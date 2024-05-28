import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type NotifStore = {
  message: string
  show: boolean
  severity: any
  showNotif: (message: string, type: string) => void
  close: () => void
}

export const useNotifStore = create<NotifStore>()(
  persist(
    (set) => ({
      message: "",
      show: false,
      severity: "",
      showNotif: (message: string, severity: any) =>
        set(() => ({ show: true, message, severity })),
      close: () => set(() => ({ show: false, message: "", severity: "" })),
    }),
    {
      name: "notif-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
