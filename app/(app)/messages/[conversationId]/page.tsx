"use client"

import { useEffect } from "react"
import { useUiStore } from "@/stores/ui-store"
import { ConversationDetail } from "@/components/messages/conversation-detail"

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  return <ConversationPageInner params={params} />
}

function ConversationPageInner({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { selectConversation } = useUiStore()

  useEffect(() => {
    params.then(({ conversationId }) => {
      selectConversation(conversationId)
    })
    return () => selectConversation(null)
  }, [params, selectConversation])

  return (
    <div className="flex h-full">
      <ConversationDetail />
    </div>
  )
}
