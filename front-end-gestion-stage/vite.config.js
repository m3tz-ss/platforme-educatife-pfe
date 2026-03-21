import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function rewritePublicPaths() {
  return {
    name: "rewrite-public-paths",
    transform(code, id) {
      if (id.includes("node_modules")) return null;
      if (!/\.(jsx?|tsx?)$/.test(id)) return null;
      const rewritten = code.replace(
        /(=\s*|:\s*)["'](\/img\/)([^"']*)["']/g,
        (_, prefix, _slashImg, rest) =>
          `${prefix}(import.meta.env.BASE_URL + 'img/${rest.replace(/'/g, "\\'")}')`
      );
      return rewritten !== code ? { code: rewritten } : null;
    },
  };
}

export default defineConfig({
  base: "/",
  plugins: [react(), rewritePublicPaths()],
  resolve: {
    alias: [{ find: "@", replacement: "/src" }],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["@material-tailwind/react", "@heroicons/react"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
