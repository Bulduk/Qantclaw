module.exports = {
  apps: [
    {
      name: "aureon-core",
      script: "npm",
      args: "run start",
      cwd: "/root/quantum-trading-system/aureon-core",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 8787
      }
    },
    {
      name: "veri-koprusu-bridge",
      script: "python3",
      args: "bridge.py",
      cwd: "/root/quantum-trading-system/bridge",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        ZMQ_PORT: 18789,
        ENVIRONMENT: "production"
      }
    }
  ]
};
