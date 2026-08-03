import fs from "node:fs";
import https from "node:https";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { createApp } from "./app.js";
import { requestLibraryRescan } from "./services/library-scanner.js";

function startServer() {
  try {
    requestLibraryRescan();

    const app = createApp();

    const certPath = fileURLToPath(new URL("../certs/cert.pem", import.meta.url));
    const keyPath = fileURLToPath(new URL("../certs/key.pem", import.meta.url));
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
