"use client"

import { useState } from "react"
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
import { useUiStore } from "@/stores/ui-store"
import { useCreateConversation } from "@/hooks/use-conversations"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function CreateConversationDialog() {
  const { modals, closeModal } = useUiStore()
  const isOpen = modals.createConversation

  const [conversationType, setConversationType] = useState<"DIRECT" | "GROUP">("DIRECT")
  const [groupName, setGroupName] = useState("")
  const [memberEmails, setMemberEmails] = useState("")
  const { mutate: createConversation, isPending } = useCreateConversation()

  const resetForm = () => {
    setConversationType("DIRECT")
    setGroupName("")
    setMemberEmails("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const emails = memberEmails
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean)

    // For MVP, we just pass the emails (the API will find users by email)
    // In a real app, you'd have a user search endpoint
    createConversation(
      {
        type: conversationType,
        name: conversationType === "GROUP" ? groupName : undefined,
        memberIds: emails,
      },
      {
        onSuccess: () => {
          resetForm()
          closeModal("createConversation")
        },
      },
    )
  }

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
      <DialogContent className="border-0 bg-card/95 shadow-xl backdrop-blur">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Start a new direct message or create a group
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs
            defaultValue="DIRECT"
            onValueChange={(v) =>
              setConversationType(v as "DIRECT" | "GROUP")
            }
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
                <Label htmlFor="memberEmails">
                  {conversationType === "DIRECT"
                    ? "Other person's email"
                    : "Member emails (comma separated)"}
                </Label>
                <Input
                  id="memberEmails"
                  placeholder={
                    conversationType === "DIRECT"
                      ? "user@example.com"
                      : "user1@example.com, user2@example.com"
                  }
                  className="rounded-xl bg-muted/70"
                  value={memberEmails}
                  onChange={(e) => setMemberEmails(e.target.value)}
                  required
                />
              </div>
            </div>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => closeModal("createConversation")}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl" disabled={isPending}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
