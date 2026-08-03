import express from "express";
import rateLimit from "express-rate-limit";
import { config } from "../config.js";
import { generateToken, isAuthenticatedRequest } from "../utils/auth.js";

type RateLimitedRequest = {
  rateLimit?: {
    resetTime?: Date;
  };
};

const authRouter = express.Router();

const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 3;

const loginLimiter = rateLimit({
  windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
  max: LOGIN_MAX_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    const rateLimitedRequest = req as typeof req & RateLimitedRequest;
    const retryAfterSeconds = rateLimitedRequest.rateLimit?.resetTime
      ? Math.max(
          Math.ceil((rateLimitedRequest.rateLimit.resetTime.getTime() - Date.now()) / 1000),
          1,
        )
      : Math.ceil(LOGIN_RATE_LIMIT_WINDOW_MS / 1000);

    res.setHeader("Retry-After", String(retryAfterSeconds));

    return res.status(429).json({
      error: `Too many login attempts. Try again in about ${Math.ceil(
        retryAfterSeconds / 60,
      )} minute(s).`,
    });
  },
});

authRouter.post("/api/login", loginLimiter, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "Username and password are required",
    });
  }

  if (username === config.auth.username && password === config.auth.password) {
    const token = generateToken(username);
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });
    return res.json({ username });
  }

  return res.status(401).json({
    error: "Invalid credentials",
  });
});

authRouter.post("/api/logout", (req, res) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });
  return res.json({ message: "Logged out" });
});

authRouter.get("/api/auth/status", (req, res) => {
  const authenticated = isAuthenticatedRequest(req);

  if (!authenticated) {
    return res.status(401).json({ authenticated: false });
  }

  return res.json({ authenticated: true });
});

export { authRouter };
