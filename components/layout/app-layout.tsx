"use client";

import { useUiStore } from "@/stores/ui-store";
import { Sidebar } from "@/components/layout/sidebar";
import { CreateConversationDialog } from "@/components/messages/create-conversation-dialog";
import { IncomingCallModal } from "@/components/call/incoming-call-modal";
import { useCallStore } from "@/stores/call-store";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { incomingCall } = useCallStore();
  const { selectedConversationId, sidebarOpen } = useUiStore();
  const showSidebarOnMobile = !selectedConversationId || sidebarOpen;

  return (
    <div className="bg-background text-foreground flex h-dvh w-screen min-w-0 overflow-hidden">
      <div
        className={
          showSidebarOnMobile
            ? "flex h-full w-full md:w-auto md:shrink-0"
            : "hidden md:flex md:shrink-0"
        }
      >
        <Sidebar />
      </div>
      <div
        className={
          showSidebarOnMobile
            ? "hidden min-w-0 flex-1 flex-col overflow-hidden md:flex"
            : "flex min-w-0 flex-1 flex-col overflow-hidden"
        }
      >
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          {children}
        </main>
      </div>
      <CreateConversationDialog />
      {incomingCall && <IncomingCallModal />}
    </div>
  );
}
