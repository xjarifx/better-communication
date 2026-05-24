import { create } from "zustand"

interface UiState {
  selectedConversationId: string | null
  sidebarOpen: boolean
  theme: "light" | "dark"
  modals: {
    createConversation: boolean
    fileUpload: boolean
    settings: boolean
  }
  selectConversation: (id: string | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: "light" | "dark") => void
  openModal: (name: keyof UiState["modals"]) => void
  closeModal: (name: keyof UiState["modals"]) => void
  closeAllModals: () => void
}

export const useUiStore = create<UiState>()((set) => ({
  selectedConversationId: null,
  sidebarOpen: true,
  theme: "light",
  modals: {
    createConversation: false,
    fileUpload: false,
    settings: false,
  },

  selectConversation: (id) => set({ selectedConversationId: id, sidebarOpen: false }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setTheme: (theme) => set({ theme }),

  openModal: (name) =>
    set((state) => ({
      modals: { ...state.modals, [name]: true },
    })),

  closeModal: (name) =>
    set((state) => ({
      modals: { ...state.modals, [name]: false },
    })),

  closeAllModals: () =>
    set({
      modals: {
        createConversation: false,
        fileUpload: false,
        settings: false,
      },
    }),
}))
