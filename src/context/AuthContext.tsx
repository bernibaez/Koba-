import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  authenticate,
  authenticateByCode,
  getStoredUser,
  storeUser,
  type AuthUser,
} from '@/lib/auth';

type AuthSuccess = { ok: true; user: AuthUser };
type AuthFailure = { ok: false; error: string };

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => AuthSuccess | AuthFailure;
  loginWithCode: (code: string) => AuthSuccess | AuthFailure;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const login = useCallback((username: string, password: string) => {
    const result = authenticate(username, password);
    if (!result.ok) return result;
    storeUser(result.user);
    setUser(result.user);
    return { ok: true as const, user: result.user };
  }, []);

  const loginWithCode = useCallback((code: string) => {
    const result = authenticateByCode(code);
    if (!result.ok) return result;
    storeUser(result.user);
    setUser(result.user);
    return { ok: true as const, user: result.user };
  }, []);

  const logout = useCallback(() => {
    storeUser(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      loginWithCode,
      logout,
    }),
    [user, login, loginWithCode, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
