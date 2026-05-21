import { defineConfig } from "vitest/config";
import path from "path";

const isGithubActions = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  // Unit tests are .ts only (no JSX); omit @vitejs/plugin-react to avoid Rolldown deprecation noise.
  test: {
    environment: "node",
    globals: true,
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
