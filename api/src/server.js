const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");
const { config } = require("./config");
const { createApp } = require("./app");
const { rescanLibrary } = require("./services/library-scanner");

function startServer() {
  try {
    rescanLibrary();

    const app = createApp();

    const certPath = path.join(__dirname, "../certs/cert.pem");
    const keyPath = path.join(__dirname, "../certs/key.pem");
    const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

    if (!hasCerts) {
      throw new Error(
        "HTTPS certificates are required. Expected api/certs/cert.pem and api/certs/key.pem.",
      );
    }

    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);
    const server = https.createServer({ cert, key }, app);

    server.listen(config.port, config.host, () => {
      console.log(`Secure server running at https://${config.host}:${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exitCode = 1;
  }
}

startServer();
