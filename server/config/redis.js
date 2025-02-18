const Redis = require("ioredis");

const redisClient = new Redis({
  host: "127.0.0.1",  // Change this if using Docker
  port: 6379,
});

redisClient.on("connect", () => {
  console.log("✅ Connected to Redis successfully!");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

module.exports = redisClient;
