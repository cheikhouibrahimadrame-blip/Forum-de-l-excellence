import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const backendPort = env.VITE_BACKEND_PORT || "5001"

  return {
    base: './',
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      // Bind to 0.0.0.0 so Android emulators, iOS simulators and real
      // devices on the same Wi-Fi (including Mobile Pilot) can reach
      // the dev server on the host's LAN IP. Vite 5+ rejects non-localhost
      // hosts by default; `allowedHosts: true` opens it up for dev.
      host: true,
      strictPort: true,
      allowedHosts: true,
      proxy: {
        // Forward `/api` to the Express backend on the host machine so
        // that API calls stay same-origin from the device's point of view
        // (avoids CORS and lets the mobile browser reach the backend
        //  transparently via the Vite dev server).
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  }
});
