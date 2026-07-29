"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { User } from "@/types"

interface AuthState {
  user: User | null
  token: string | null
  isHydrated: boolean
  setSession: (user: User, token: string) => void
  updateUser: (partial: Partial<User>) => void
  clear: () => void
  setHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isHydrated: false,
      setSession: (user, token) => set({ user, token }),
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : state.user,
        })),
      clear: () => set({ user: null, token: null }),
      setHydrated: (value) => set({ isHydrated: value }),
    }),
    {
      name: "epu-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
