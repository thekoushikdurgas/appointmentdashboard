/**
 * PM2 ecosystem for Contact360 Next.js dashboard (production on EC2).
 *
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *
 * Env:
 *   PORT              — listen port (default 3000)
 *   PM2_APP_NAME      — process name in pm2 list (default contact360-dashboard)
 *   NODE_ENV          — set via --env production
 *
 * Logs: ./logs/pm2-*.log (create logs/ before first start, or let PM2 create files)
 */
const path = require("path");

const appName = process.env.PM2_APP_NAME || "contact360-dashboard";
const port = process.env.PORT || "3000";

module.exports = {
  apps: [
    {
      name: appName,
      cwd: __dirname,
      script: "npm",
      args: "run start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: port,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: port,
      },
      error_file: path.join(__dirname, "logs", "pm2-error.log"),
      out_file: path.join(__dirname, "logs", "pm2-out.log"),
      merge_logs: true,
      time: true,
    },
  ],
};
