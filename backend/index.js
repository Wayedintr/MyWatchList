import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";
import {createDatabase, createTables, insertShowById, withPoolConnection} from "./queries.js";
import { login, register, authenticateToken } from "./auth.js";

const app = express();
const port = 3000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Routes
app.post("/login", login); // Login route
app.post("/register", register); // Registration route

// Example protected route
app.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
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


