import path from "path";
import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";

export default defineConfig({
    resolve: {
        alias: {
            _: path.resolve(__dirname, "src"),
        },
    },
    plugins: [
        reactRefresh(),
    ],
    clearScreen: false,
    server: {
        host: "::",
        port: 3000,
        strictPort: true,
    },
});