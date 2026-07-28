import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "./use-auth";

export const Login = () => {
  const { login, error, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await login(username, password);
    } catch {
      // Error is handled by context
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4">
      <div className="w-full max-w-sm rounded-3xl border border-surface bg-surface-80 p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-primary">
          Media Viewer
        </h1>
        <p className="mb-6 text-center text-sm text-muted">
          Enter your credentials to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-primary mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              disabled={isLoading}
              className="w-full rounded-lg border border-surface bg-surface-strong px-4 py-2 text-primary outline-none placeholder:text-muted focus:border-accent disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-primary mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={isLoading}
              className="w-full rounded-lg border border-surface bg-surface-strong px-4 py-2 text-primary outline-none placeholder:text-muted focus:border-accent disabled:opacity-50"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full rounded-lg bg-accent px-4 py-2 font-medium text-primary transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};
