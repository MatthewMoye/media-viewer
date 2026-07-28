import { createContext } from "react";

export type AuthContextValue = {
  isAuthenticated: boolean;
  isInitializing: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
