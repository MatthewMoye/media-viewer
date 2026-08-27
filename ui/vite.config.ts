import { defineConfig, type ServerOptions } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import { loadEnvFile } from "node:process";

const rootEnvPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(rootEnvPath)) {
  loadEnvFile(rootEnvPath);
}

const certPath = path.resolve(__dirname, "../certs/cert.pem");
const keyPath = path.resolve(__dirname, "../certs/key.pem");
const useHttps = fs.existsSync(certPath) && fs.existsSync(keyPath);

const host = process.env.HOST?.trim() || "localhost";
const uiPort = Number.parseInt(process.env.UI_PORT ?? "5173", 10);
const apiPort = process.env.API_PORT?.trim() || "3000";
const apiHost = host === "0.0.0.0" ? "localhost" : host;
const apiOrigin = `${useHttps ? "https" : "http"}://${apiHost}:${apiPort}`;

const serverConfig: ServerOptions = {
  host,
  port: uiPort,
  proxy: {
    "/api": {
      target: apiOrigin,
      changeOrigin: true,
      secure: false, // Allow self-signed certs
    },
    "/file": {
      target: apiOrigin,
      changeOrigin: true,
      secure: false,
    },
    "/thumbnail": {
      target: apiOrigin,
      changeOrigin: true,
      secure: false,
    },
    "/comic-thumbnail": {
      target: apiOrigin,
      changeOrigin: true,
      secure: false,
    },
    "/comic-page": {
      target: apiOrigin,
      changeOrigin: true,
      secure: false,
    },
  },
};

if (useHttps) {
  serverConfig.https = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: serverConfig,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
