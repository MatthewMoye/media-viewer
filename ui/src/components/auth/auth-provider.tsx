import { type ReactNode, useCallback, useEffect, useState } from "react";
import { AuthContext, type AuthContextValue } from "./auth-context";
import { authenticatedFetch } from "@/utils/authenticated-fetch";

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const data = (await response.json()) as { error?: string };
      if (typeof data.error === "string" && data.error.trim() !== "") {
        return data.error;
      }
    } catch {
      return response.statusText || "Login failed";
    }
  }

  return response.statusText || "Login failed";
}

async function checkSessionAuthenticated(): Promise<boolean> {
  try {
    const statusResponse = await authenticatedFetch("/api/auth/status");

    if (statusResponse.ok) {
      return true;
    }

    if (statusResponse.status !== 404) {
      return false;
    }
  } catch {
    return false;
  }

  try {
    const fallbackResponse = await authenticatedFetch("/api/comics");
    return fallbackResponse.ok;
  } catch {
    return false;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const isAuthenticated = await checkSessionAuthenticated();

        if (isAuthenticated) {
          setIsAuthenticated(true);
          setUsername("User");
        } else {
          setIsAuthenticated(false);
          setUsername(null);
        }
      } catch {
        setIsAuthenticated(false);
        setUsername(null);
      } finally {
        setIsInitializing(false);
      }
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get("Retry-After");
          const retryAfterSeconds = Number.parseInt(retryAfterHeader ?? "", 10);
          const retryText = Number.isFinite(retryAfterSeconds)
            ? `Please wait about ${Math.max(Math.ceil(retryAfterSeconds / 60), 1)} minute(s) and try again.`
            : "Please wait a bit and try again.";
          throw new Error(`Too many login attempts. ${retryText}`);
        }

        const message = await readErrorMessage(response);
        throw new Error(message || "Login failed");
      }

      setIsAuthenticated(true);
      setUsername(username);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Login failed. Check server connectivity and HTTPS certificate trust.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      return;
    } finally {
      setIsAuthenticated(false);
      setUsername(null);
      setError(null);
    }
  }, []);

  const value: AuthContextValue = {
    isAuthenticated,
    isInitializing,
    username,
    login,
    logout,
    error,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
