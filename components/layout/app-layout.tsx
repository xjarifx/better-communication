"use client"

import { useUiStore } from "@/stores/ui-store"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { CreateConversationDialog } from "@/components/messages/create-conversation-dialog"
import { IncomingCallModal } from "@/components/call/incoming-call-modal"
import { useCallStore } from "@/stores/call-store"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { incomingCall } = useCallStore()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
      <CreateConversationDialog />
      {incomingCall && <IncomingCallModal />}
    </div>
  )
}
