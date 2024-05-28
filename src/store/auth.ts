import { User } from "firebase/auth"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { AUTH, DB } from "../api/firebase"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"

type AuthStore = {
  user: User | null
  updateUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      updateUser: (user) => set(() => ({ user })),
      logout: async () => {
        const { user } = useAuthStore.getState()
        await addDoc(collection(DB, "history"), {
          created_at: serverTimestamp(),
          user: user?.displayName,
          action: "logged out.",
        })
        await AUTH.signOut()
        set(() => ({ user: null }))
        localStorage.clear()
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
