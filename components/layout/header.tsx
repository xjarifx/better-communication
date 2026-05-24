"use client"

import { useUiStore } from "@/stores/ui-store"
import { Button } from "@/components/ui/button"
import { Menu, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export function Header() {
  const { toggleSidebar, selectedConversationId } = useUiStore()
  const router = useRouter()

  return (
    <header className="flex h-14 items-center gap-2 border-b px-4 md:hidden">
      {selectedConversationId ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/messages")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      ) : (
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
      )}
    </header>
  )
}
