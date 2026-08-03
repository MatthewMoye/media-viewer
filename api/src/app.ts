import express from "express";
import cookieParser from "cookie-parser";
import { filesRouter } from "./routes/files-routes.js";
import { mediaRouter } from "./routes/media-routes.js";
import { adminRouter } from "./routes/admin-routes.js";
import { comicsRouter } from "./routes/comics-routes.js";
import { authRouter } from "./routes/auth-routes.js";
import { authMiddleware } from "./utils/auth.js";

function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // Public routes (no auth required)
  app.use(authRouter);

  // Protected routes (auth required)
  app.use(authMiddleware);
  app.use(filesRouter);
  app.use(mediaRouter);
  app.use(comicsRouter);
  app.use(adminRouter);

  app.use((request, response) => {
    response.status(404).json({
      error: "Route not found",
    });
  });

  app.use((error, request, response, next) => {
    console.error(error);

    if (response.headersSent) {
      next(error);
      return;
    }

    response.status(500).json({
      error: "Internal server error",
    });
  });

  return app;
}

export { createApp };
