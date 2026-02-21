import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        Cookies.set('accessToken', accessToken, { expires: 1 });
        Cookies.set('refreshToken', refreshToken, { expires: 7 });
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (user) => set({ user }),
    }),
    {
      name: 'auth-store',
      // Only persist user, not tokens (tokens are in cookies)
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);