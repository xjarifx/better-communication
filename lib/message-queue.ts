import { useMessageQueueStore } from "@/stores/message-queue-store"
import { useSocketStore } from "@/stores/socket-store"
import type { QueuedMessage } from "@/stores/message-queue-store"

let processingInterval: NodeJS.Timeout | null = null
let isProcessing = false

/**
 * Processes the message queue, sending pending messages in FIFO order
 */
export function processMessageQueue() {
  if (isProcessing) return

  const { socket, isConnected } = useSocketStore.getState()
  const { queue, setProcessing, updateMessageStatus, removeFromQueue, incrementRetryCount } =
    useMessageQueueStore.getState()

  if (!isConnected || !socket) {
    console.log("[MessageQueueManager] Socket not connected, skipping queue processing")
    return
  }

  // Get pending messages sorted by queuedAt (FIFO)
  const pendingMessages = queue
    .filter((m) => m.status === "pending" || m.status === "failed")
    .sort((a, b) => new Date(a.queuedAt).getTime() - new Date(b.queuedAt).getTime())

  if (pendingMessages.length === 0) return

  isProcessing = true
  setProcessing(true)
  console.log(`[MessageQueueManager] Processing ${pendingMessages.length} queued messages`)

  // Process messages sequentially (FIFO order)
  const processNext = (index: number) => {
    if (index >= pendingMessages.length) {
      isProcessing = false
      setProcessing(false)
      console.log("[MessageQueueManager] Queue processing complete")
      return
    }

    const message = pendingMessages[index]

    // Check if already at max retries
    if (message.retryCount >= 5 && message.status === "failed") {
      console.warn(
        `[MessageQueueManager] Message ${message.id} exceeded max retries (${message.retryCount})`
      )
      // Keep in queue but marked as failed so user can retry manually
      processNext(index + 1)
      return
    }

    // Update status to "sending"
    updateMessageStatus(message.id, "sending")

    const timeout = setTimeout(() => {
      console.error(`[MessageQueueManager] Message ${message.id} send timeout`)
      updateMessageStatus(message.id, "failed", "Send timeout")
      incrementRetryCount(message.id)
      processNext(index + 1)
    }, 5000)

    // Send the message
    socket.emit(
      "message:send",
      {
        conversationId: message.conversationId,
        type: message.type,
        content: message.content,
        fileUrl: message.fileUrl,
        thumbnailUrl: message.thumbnailUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
      },
      (response: { status: string; messageId?: string; error?: string }) => {
        clearTimeout(timeout)

        if (response.status === "ok") {
          console.log(`[MessageQueueManager] Message ${message.id} sent successfully`)
          removeFromQueue(message.id)
        } else {
          console.error(
            `[MessageQueueManager] Message ${message.id} failed:`,
            response.error
          )
          updateMessageStatus(message.id, "failed", response.error)
          incrementRetryCount(message.id)
        }

        // Process next message
        processNext(index + 1)
      }
    )
  }

  processNext(0)
}

/**
 * Starts periodic queue processing when the app is online
 */
export function startQueueProcessing() {
  console.log("[MessageQueueManager] Starting queue processor")

  // Process queue immediately
  processMessageQueue()

  // Process queue every 5 seconds if there are messages
  if (processingInterval) clearInterval(processingInterval)

  processingInterval = setInterval(() => {
    const { queue } = useMessageQueueStore.getState()
    if (queue.length > 0) {
      processMessageQueue()
    }
  }, 5000)
}

/**
 * Stops periodic queue processing
 */
export function stopQueueProcessing() {
  console.log("[MessageQueueManager] Stopping queue processor")
  if (processingInterval) {
    clearInterval(processingInterval)
    processingInterval = null
  }
}

/**
 * Retries a specific failed message
 */
export function retryMessage(messageId: string) {
  const { getQueuedMessage, updateMessageStatus } = useMessageQueueStore.getState()
  const message = getQueuedMessage(messageId)

  if (!message) {
    console.warn(`[MessageQueueManager] Message ${messageId} not found in queue`)
    return
  }

  console.log(`[MessageQueueManager] Retrying message ${messageId}`)
  updateMessageStatus(messageId, "pending")
  processMessageQueue()
}

/**
 * Checks if app is online (both navigator.onLine and socket connected)
 */
export function isAppOnline(): boolean {
  if (typeof window !== "undefined" && !navigator.onLine) {
    return false
  }

  return true
}

/**
 * Adds a message to the queue and triggers processing
 */
export function enqueueMessage(message: QueuedMessage) {
  const { addToQueue } = useMessageQueueStore.getState()
  addToQueue(message)
  console.log(`[MessageQueueManager] Message ${message.id} added to queue`)

  // If we're online, start processing
  if (isAppOnline()) {
    processMessageQueue()
  }
}
