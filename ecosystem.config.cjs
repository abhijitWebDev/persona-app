// pm2 process definition for persona-chat.
//   pm2 start ecosystem.config.cjs
//   pm2 save && pm2 startup   (to survive reboots)
module.exports = {
  apps: [
    {
      name: "persona-chat",
      script: "server/index.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 8787,
      },
      // Reads OPENAI_API_KEY / OPENAI_MODEL from the .env file next to it
      // (server/index.js loads dotenv), so no secrets live in this file.
      max_memory_restart: "300M",
      time: true,
    },
  ],
};
