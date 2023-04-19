const express = require("express");
const redis = require("redis");
const bodyParser = require("body-parser");
const fs = require("fs");
const app = express();

// Use bodyParser middleware to parse JSON data
app.use(bodyParser.json());

// Create a Redis client and connect to the Redis server
const client = redis.createClient({
  legacyMode: true,
});

client.on("connect", () => {
  console.log("Connected to redis");
});
client.del("data");

client.on("error", (err) => {
  console.log("Error");
});

// Define a route that retrieves data from Redis cache
app.get("/cached-data", async (req, res) => {
  try {
    client.get("data", (err, cachedData) => {
      if (err) {
        console.error("Redis error:", err);
        res.status(500).json({ error: "Internal Server Error" });
      } else if (cachedData !== null) {
        // If the data is in the cache, return it to the client
        const data = JSON.parse(cachedData);
        res.json(data);
      } else {
        // If the data is not in the cache, retrieve it from the database
        let data = [];
        const filename = 'data.txt';

        fs.readFile(filename, 'utf-8', (err, lines) => {
          if (err) throw err;
          
          data = lines.trim().split('\n').map(item => JSON.parse(item));
          
          console.log(data);
          
          // Store the data in the Redis cache for future requests
          client.set("data", JSON.stringify(data), "EX", 60 * 60, (err) => {
            if (err) {
              console.error("Redis error:", err);
            }
          });

          res.json(data);
        });
      }
    });
  } catch (err) {
    console.error("Redis connection error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(8081, () => {
  console.log("Server started on port 8081");
});
