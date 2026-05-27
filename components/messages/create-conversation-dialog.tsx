"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useUiStore } from "@/stores/ui-store"
import { useCreateConversation } from "@/hooks/use-conversations"
import { useAuthStore } from "@/stores/auth-store"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api-client"
import type { User } from "@/types/auth"

export function CreateConversationDialog() {
  const { modals, closeModal } = useUiStore()
  const isOpen = modals.createConversation
  const currentUser = useAuthStore((s) => s.user)

  const [conversationType, setConversationType] = useState<"DIRECT" | "GROUP">("DIRECT")
  const [groupName, setGroupName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const { mutate: createConversation, isPending } = useCreateConversation()

  const resetForm = () => {
    setConversationType("DIRECT")
    setGroupName("")
    setSearchQuery("")
    setSearchResults([])
    setSelectedUsers([])
  }

  useEffect(() => {
    if (!isOpen) return

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
    }, searchQuery.trim() ? 300 : 0)

    return () => clearTimeout(timer)
  }, [searchQuery, isOpen])

  const addUser = useCallback(
    (user: User) => {
      if (conversationType === "DIRECT") {
        setSelectedUsers([user])
      } else {
        setSelectedUsers((prev) => {
          if (prev.some((u) => u.id === user.id)) return prev
          return [...prev, user]
        })
      }
      setSearchQuery("")
    },
    [conversationType],
  )

  const removeUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedUsers.length === 0) return

    createConversation(
      {
        type: conversationType,
        name: conversationType === "GROUP" ? groupName : undefined,
        memberIds: selectedUsers.map((u) => u.id),
      },
      {
        onSuccess: () => {
          resetForm()
          closeModal("createConversation")
        },
      },
    )
  }

  const isSelected = (userId: string) => selectedUsers.some((u) => u.id === userId)
  const canSubmit =
    selectedUsers.length > 0 &&
    (conversationType === "DIRECT" || (conversationType === "GROUP" && groupName.trim()))

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm()
          closeModal("createConversation")
        }
      }}
    >
      <DialogContent className="border-0 bg-card/95 shadow-xl backdrop-blur sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Start a new direct message or create a group
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs
            defaultValue="DIRECT"
            onValueChange={(v) => {
              setConversationType(v as "DIRECT" | "GROUP")
              setSelectedUsers([])
            }}
          >
            <TabsList className="w-full rounded-xl bg-muted">
              <TabsTrigger value="DIRECT" className="flex-1">
                Direct Message
              </TabsTrigger>
              <TabsTrigger value="GROUP" className="flex-1">
                Group
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              {conversationType === "GROUP" && (
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    placeholder="My Group"
                    className="rounded-xl bg-muted/70"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="userSearch">
                  {conversationType === "DIRECT"
                    ? "Search user"
                    : "Add members"}
                </Label>
                <Input
                  id="userSearch"
                  placeholder="Search by name or email..."
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

              <div className="rounded-xl border bg-muted/30">
                {isSearching && searchResults.length === 0 ? (
                  <p className="p-3 text-center text-sm text-muted-foreground">
                    Searching...
                  </p>
                ) : searchResults.length === 0 ? (
                  <p className="p-3 text-center text-sm text-muted-foreground">
                    {searchQuery.trim() ? "No users found" : "No users available"}
                  </p>
                ) : (
                    <div className="max-h-48 divide-y overflow-y-auto">
                        {searchResults
                          .filter((u) => u.id !== currentUser?.id)
                          .map((user) => (
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
                              <Button
                                type="button"
                                variant={
                                  isSelected(user.id) ? "secondary" : "outline"
                                }
                                size="icon"
                                className="h-7 w-7 shrink-0 rounded-full"
                                disabled={
                                  conversationType === "DIRECT" &&
                                  selectedUsers.length > 0 &&
                                  !isSelected(user.id)
                                    ? selectedUsers[0]?.id !== user.id
                                    : false
                                }
                                onClick={() => {
                                  if (isSelected(user.id)) {
                                    removeUser(user.id)
                                  } else {
                                    addUser(user)
                                  }
                                }}
                              >
                                {isSelected(user.id) ? (
                                  <span className="text-lg leading-none">−</span>
                                ) : (
                                  <span className="text-lg leading-none">+</span>
                                )}
                              </Button>
                            </div>
                          ))}
                      </div>
                  )}
                </div>

              {selectedUsers.length > 0 && (
                <div className="space-y-2">
                  <Label>
                    {conversationType === "DIRECT"
                      ? "Recipient"
                      : `Selected (${selectedUsers.length})`}
                  </Label>
                  <div className="rounded-xl border bg-muted/30">
                    <div className="max-h-36 divide-y overflow-y-auto">
                        {selectedUsers.map((user) => (
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
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
                              onClick={() => removeUser(user.id)}
                            >
                              <span className="text-lg leading-none">−</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                  </div>
                </div>
              )}
            </div>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                closeModal("createConversation")
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl"
              disabled={isPending || !canSubmit}
            >
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
