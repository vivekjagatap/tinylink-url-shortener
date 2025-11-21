const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { nanoid } = require("nanoid");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create short URL
app.post("/shorten", async (req, res) => { 
  const { longUrl } = req.body;
  const shortId = nanoid(8);

  await pool.query(
    "INSERT INTO links (short_id, long_url, clicks) VALUES ($1, $2, 0)",
    [shortId, longUrl]
  );

  res.json({ shortUrl: `${process.env.BASE_URL}/${shortId}` });
});

// Redirect
app.get("/:shortId", async (req, res) => {
  const { shortId } = req.params;

  const result = await pool.query(
    "SELECT * FROM links WHERE short_id = $1",
    [shortId]
  );

  if (result.rows.length === 0) return res.status(404).send("Not found");

  // Increment clicks
  await pool.query(
    "UPDATE links SET clicks = clicks + 1 WHERE short_id = $1",
    [shortId]
  );

  res.redirect(result.rows[0].long_url);
});

app.listen(5000, () => console.log("Server running on port 5000"));
