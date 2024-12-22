import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser"; // Middleware to parse cookies
import cors from "cors";
import { createDatabase, createTables, insertShowById, withPoolConnection } from "./queries.js";
import { login, register, logout, authenticateToken } from "./auth.js";

const app = express();
const port = 3000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(express.json());

// Routes
app.post("/login", login); // Login route
app.post("/register", register); // Registration route
app.get("/logout", logout);

app.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: "Protected route accessed!", user: req.user });
});

// Function to initialize database and sync tables
const initializeDatabase = async () => {
  await createDatabase();
  await createTables();
  /*
  insertShowById(30984, false);
  insertShowById(278523, false);
  for (let i = 1; i <= 100; i++) {
    await insertShowById(i, true);
    await insertShowById(i, false);
  }
  */
};

initializeDatabase();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Example API endpoint (uses TMDb API)
app.get("/", async (req, res) => {
  const apiKey = "c8a5dcf600f29bb2715cc66262fb3186";
  const url = "https://api.themoviedb.org/3/search/movie";
  const { query } = req.query;
  const params = {
    include_adult: false,
    language: "en-US",
    page: 1,
    api_key: apiKey,
    query,
  };

  try {
    console.log("Making request to:", url);
    const response = await axios.get(url, { params });
    res.json(response.data);
  } catch (error) {
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      request: error.request,
    });
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.get("/user/:username", async (req, res) => {
  const username = req.params.username;
  const response = await withPoolConnection((client) => client.query("SELECT username FROM users WHERE username = $1", [username]));
  if  (response.rows.length === 0) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json(response.rows[0]);
});

app.get("/show/:type/:id", async (req, res) => {

  let show = {};   

  const type = req.params.type;
  const id = req.params.id;
  await insertShowById(id, type === "movie");
  let response = await withPoolConnection((client) => client.query("SELECT * FROM shows WHERE is_movie = $1 AND show_id = $2", [type === "movie", id]));
  if  (response.rows.length === 0) {
    res.status(404).json({ message: "Show not found" });
    return;
  }
  show = response.rows[0];
  response = await withPoolConnection((client) => client.query("SELECT * FROM seasons WHERE show_id = $1", [id]));
  if  (response.rows.length !== 0) {
    show.seasons = response.rows;
    show.seasons.forEach((season) => season.episodes = []);
    response = await withPoolConnection((client) => client.query("SELECT * FROM episodes WHERE show_id = $1", [id]));
    if  (response.rows.length !== 0) {
      response.rows.forEach((episode) => {
        show.seasons.find((season) => season.season_number === episode.season_number).episodes.push(episode);
      })
    }
  }
  res.json(show);
});


app.get("/search/", async (req, res) => {
  const apiKey = "c8a5dcf600f29bb2715cc66262fb3186";
  const { query, is_movie } = req.query;
  const url = "https://api.themoviedb.org/3/search/" + (is_movie === "true" ? "movie" : "tv");
  const params = {
    include_adult: false,
    language: "en-US",
    page: 1,
    api_key: apiKey,
    query,
  };

  try {
    console.log("Making request to:", url);
    const response = await axios.get(url, { params });
    res.json(response.data);
  } catch (error) {
    console.error("Error details:", {
      message: error.message,
    });
    res.status(500).json({ message: "Internal Server Error" });
  }
});


