"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useUiStore } from "@/stores/ui-store"
import { useAuthStore } from "@/stores/auth-store"
import { useConversation, useAddMembers, useRemoveMember } from "@/hooks/use-conversations"
import { apiClient } from "@/lib/api-client"
import type { User } from "@/types/auth"

export function ManageMembersDialog() {
  const { manageMembersConversationId, closeManageMembers } = useUiStore()
  const isOpen = !!manageMembersConversationId
  const currentUser = useAuthStore((s) => s.user)

  const { data: conversation, isLoading } = useConversation(manageMembersConversationId)
  const { mutate: addMembers, isPending: isAdding } = useAddMembers()
  const { mutate: removeMember, isPending: isRemoving } = useRemoveMember()

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!searchQuery.trim()) return

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await apiClient.get<User[]>("/api/users/search", {
          q: searchQuery,
        })
        setSearchResults(results)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const existingMemberIds = new Set(conversation?.members.map((m) => m.id) ?? [])

  const handleAdd = (user: User) => {
    if (!manageMembersConversationId) return
    addMembers({
      conversationId: manageMembersConversationId,
      memberIds: [user.id],
    })
    setSearchQuery("")
  }

  const handleRemove = (userId: string) => {
    if (!manageMembersConversationId) return
    removeMember({
      conversationId: manageMembersConversationId,
      userId,
    })
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setSearchQuery("")
          setSearchResults([])
          closeManageMembers()
        }
      }}
    >
      <DialogContent className="border-0 bg-card/95 shadow-xl backdrop-blur sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Members</DialogTitle>
          <DialogDescription>
            {conversation?.name ?? "Group"}
            {conversation ? ` \u00B7 ${conversation.members.length} members` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Search by name or email to add..."
              className="rounded-xl bg-muted/70"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (!e.target.value.trim()) {
                  setSearchResults([])
                }
              }}
              autoComplete="off"
            />
          </div>

          {searchQuery.trim() && (
            <div className="rounded-xl border bg-muted/30">
              {isSearching ? (
                <p className="p-3 text-center text-sm text-muted-foreground">
                  Searching...
                </p>
              ) : searchResults.length === 0 ? (
                <p className="p-3 text-center text-sm text-muted-foreground">
                  No users found
                </p>
              ) : (
                <div className="max-h-48 divide-y overflow-y-auto">
                  {searchResults
                    .filter((u) => u.id !== currentUser?.id)
                    .map((user) => {
                      const isMember = existingMemberIds.has(user.id)
                      return (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 px-3 py-2"
                        >
                          <Avatar className="h-8 w-8">
                            {user.avatarUrl ? (
                              <AvatarImage src={user.avatarUrl} />
                            ) : null}
                            <AvatarFallback className="text-xs">
                              {user.displayName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium">
                              {user.displayName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                          {isMember ? (
                            <span className="text-xs text-muted-foreground shrink-0">
                              Member
                            </span>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 shrink-0 rounded-full"
                              onClick={() => handleAdd(user)}
                              disabled={isAdding}
                            >
                              <span className="text-lg leading-none">+</span>
                            </Button>
                          )}
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Current members</p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <div className="max-h-60 divide-y overflow-y-auto rounded-xl border bg-muted/30">
                {conversation?.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <Avatar className="h-8 w-8">
                      {member.avatarUrl ? (
                        <AvatarImage src={member.avatarUrl} />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {member.displayName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">
                        {member.displayName}
                        {member.id === currentUser?.id ? " (you)" : ""}
                      </p>
                    </div>
                    {member.id !== currentUser?.id && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(member.id)}
                        disabled={isRemoving}
                      >
                        <span className="text-lg leading-none">−</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
