"use client";

import { ConversationDetail } from "@/components/messages/conversation-detail";

export default function MessagesPage() {
  return (
    <div className="flex h-full min-h-0 w-full min-w-0">
      <ConversationDetail />
    </div>
  );
}
