import jwt from "jsonwebtoken";
import { config } from "../config.js";

function generateToken(username) {
  return jwt.sign({ username }, config.auth.secret, {
    expiresIn: "3d",
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.auth.secret);
  } catch {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = payload;
  next();
}

function isAuthenticatedRequest(req) {
  const token = req.cookies.auth_token;
  if (!token) {
    return false;
  }

  return Boolean(verifyToken(token));
}

export { generateToken, verifyToken, isAuthenticatedRequest, authMiddleware };
