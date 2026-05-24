"use client"

import { useState, useCallback, createContext, useContext } from "react"
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  type ToastActionType,
} from "@/components/ui/toast"

interface ToastContextType {
  toast: (props: Omit<ToastActionType, "id">) => void
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastActionType[]>([])

  const addToast = useCallback(
    (props: Omit<ToastActionType, "id">) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { ...props, id }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 5000)
    },
    [],
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {toasts.length > 0 && (
        <ToastProvider>
          {toasts.map((t) => (
            <Toast key={t.id} variant={t.variant}>
              <div className="grid gap-1">
                <ToastTitle>{t.title}</ToastTitle>
                {t.description && (
                  <ToastDescription>{t.description}</ToastDescription>
                )}
              </div>
              {t.action && (
                <ToastAction altText={t.action.label} onClick={t.action.onClick}>
                  {t.action.label}
                </ToastAction>
              )}
              <ToastClose onClick={() => removeToast(t.id)} />
            </Toast>
          ))}
          <ToastViewport />
        </ToastProvider>
      )}
    </ToastContext.Provider>
  )
}
