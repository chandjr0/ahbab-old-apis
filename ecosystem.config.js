module.exports = {
  apps: [
    {
      name: "ahbab-api",
      script: "./src/server.js",
      instances: "3",
      autorestart: true,
      watch: ["src"],
      max_memory_restart: "2G",
      exec_mode: "cluster",
      args: ["--port", "8074"],
      ignore_watch: ["node_modules", "logs"],
      log_file: "logs/pm2.log",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      merge_logs: true,
      env_production: {
        NODE_ENV: "production",
        exec_mode: "cluster_mode",
      },
    },
  ],
};
