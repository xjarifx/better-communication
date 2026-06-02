"use client"

import { useCallStore } from "@/stores/call-store"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Phone, PhoneOff, PhoneIncoming } from "lucide-react"
import { useRouter } from "next/navigation"

export function IncomingCallModal() {
  const { incomingCall, acceptCall, rejectCall } = useCallStore()
  const router = useRouter()

  if (!incomingCall) return null

  const handleAccept = () => {
    acceptCall(incomingCall.callerId)
    router.push(`/call/${incomingCall.conversationId}`)
  }

  return (
    <Dialog open={!!incomingCall}
      onOpenChange={(open) => { if (!open) rejectCall() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <PhoneIncoming className="h-8 w-8 text-green-600" />
          </div>
          <DialogTitle className="text-center">Incoming Call</DialogTitle>
          <DialogDescription className="text-center">
            Someone is calling you
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row justify-center gap-4 sm:justify-center">
          <Button variant="destructive" size="lg" className="rounded-full"
            onClick={rejectCall}>
            <PhoneOff className="mr-2 h-5 w-5" /> Decline
          </Button>
          <Button variant="default" size="lg"
            className="rounded-full bg-green-600 hover:bg-green-700"
            onClick={handleAccept}>
            <Phone className="mr-2 h-5 w-5" /> Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
