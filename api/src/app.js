const express = require("express");
const cookieParser = require("cookie-parser");
const { filesRouter } = require("./routes/files-routes");
const { mediaRouter } = require("./routes/media-routes");
const { adminRouter } = require("./routes/admin-routes");
const { comicsRouter } = require("./routes/comics-routes");
const { authRouter } = require("./routes/auth-routes");
const { authMiddleware } = require("./utils/auth");

function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(express.json());
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

module.exports = {
  createApp,
};
