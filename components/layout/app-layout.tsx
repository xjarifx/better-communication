"use client";

import { useUiStore } from "@/stores/ui-store";
import { Sidebar } from "@/components/layout/sidebar";
import { CreateConversationDialog } from "@/components/messages/create-conversation-dialog";
import { IncomingCallModal } from "@/components/call/incoming-call-modal";
import { useCallStore } from "@/stores/call-store";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { incomingCall } = useCallStore();
  const { selectedConversationId, sidebarOpen } = useUiStore();
  const showSidebarOnMobile = sidebarOpen || !selectedConversationId;

  return (
    <div className="bg-background text-foreground flex h-dvh w-screen overflow-hidden">
      <div
        className={
          showSidebarOnMobile
            ? "flex h-full w-full md:w-auto"
            : "hidden md:flex"
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
