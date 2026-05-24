"use client";

import { useEffect } from "react";
import { useUiStore } from "@/stores/ui-store";
import { ConversationDetail } from "@/components/messages/conversation-detail";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  return <ConversationPageInner params={params} />;
}

function ConversationPageInner({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { selectConversation, setSidebarOpen } = useUiStore();

  useEffect(() => {
    params.then(({ conversationId }) => {
      selectConversation(conversationId);
      if (window.matchMedia("(max-width: 767px)").matches) {
        setSidebarOpen(false);
      }
    });
    return () => selectConversation(null);
  }, [params, selectConversation, setSidebarOpen]);

  return (
    <div className="flex h-full min-h-0 min-w-0">
      <ConversationDetail />
    </div>
  );
}
