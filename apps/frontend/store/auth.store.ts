import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  tenantId: string;
  isApproved: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  tenantSlug: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string, tenantSlug: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      tenantSlug:   null,

      setAuth: (user, accessToken, refreshToken, tenantSlug) => {
        localStorage.setItem('accessToken',  accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('tenantSlug',   tenantSlug);
        document.cookie = `accessToken=${accessToken}; path=/; max-age=900`;
        set({ user, accessToken, refreshToken, tenantSlug });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tenantSlug');
        document.cookie = 'accessToken=; path=/; max-age=0';
        set({ user: null, accessToken: null, refreshToken: null, tenantSlug: null });
      },

      isAuthenticated: () => !!get().user && !!get().accessToken,
    }),
    { name: 'airman-auth' }
  )
);