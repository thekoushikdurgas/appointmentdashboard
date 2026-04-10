import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const isGithubActions = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    // On Actions, add github-actions so Vitest writes the Job Summary (Vitest Test Report).
    // If you ever set reporters explicitly, the github-actions reporter must be listed or the summary disappears.
    reporters: isGithubActions ? ["default", "github-actions"] : ["default"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
