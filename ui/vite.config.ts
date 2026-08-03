import { defineConfig, type ServerOptions } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

const certPath = path.resolve(__dirname, "../api/certs/cert.pem");
const keyPath = path.resolve(__dirname, "../api/certs/key.pem");
const useHttps = fs.existsSync(certPath) && fs.existsSync(keyPath);

const serverConfig: ServerOptions = {
  port: 5173,
  proxy: {
    "/api": {
      target: useHttps ? "https://localhost:3000" : "http://localhost:3000",
      changeOrigin: true,
      secure: false, // Allow self-signed certs
    },
    "/file": {
      target: useHttps ? "https://localhost:3000" : "http://localhost:3000",
      changeOrigin: true,
      secure: false,
    },
    "/thumbnail": {
      target: useHttps ? "https://localhost:3000" : "http://localhost:3000",
      changeOrigin: true,
      secure: false,
    },
    "/comic-thumbnail": {
      target: useHttps ? "https://localhost:3000" : "http://localhost:3000",
      changeOrigin: true,
      secure: false,
    },
    "/comic-page": {
      target: useHttps ? "https://localhost:3000" : "http://localhost:3000",
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
