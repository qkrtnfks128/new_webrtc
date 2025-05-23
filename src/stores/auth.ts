import { defineStore } from 'pinia'
import type { AuthState, User } from '@/types'
import SignalingService from '@/repository/SignalingService'

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuthenticated: false,
    user: null,
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
  },

  actions: {
    async login(username: string, password: string) {
      try {
        const user = await SignalingService.login(username, password)
        this.user = user
        this.isAuthenticated = true
        return true
      } catch (error) {
        console.error('로그인 실패:', error)
        return false
      }
    },

    logout() {
      this.user = null
      this.isAuthenticated = false
      SignalingService.disconnect()
    },
  },
})
