import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";
import pkg from "pg";
const { Client } = pkg;

// Function to create the database
const createDatabase = async () => {
  const adminClient = new Client({
    user: "postgres", // PostgreSQL superuser
    host: "localhost",
    database: "postgres", // Connect to the default database
    password: "boran4545",
    port: 5432,
  });

  try {
    await adminClient.connect();
    const dbName = "mywatchlist";

    // Check if the database already exists
    const dbExistsResult = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`
    );
    if (dbExistsResult.rows.length === 0) {
      // Create the database if it doesn't exist
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error("Error creating database:", err.message);
  } finally {
    await adminClient.end();
  }
};

// Function to create the tables
const createTables = async () => {
  const client = new Client({
    user: "postgres",
    host: "localhost",
    database: "mywatchlist", // Connect to the newly created database
    password: "boran4545",
    port: 5432,
  });

  try {
    await client.connect();

    // Create tables
    const createTablesQuery = `
      CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  mail VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS shows (
  show_id INT,
  is_movie BOOLEAN,
  adult BOOLEAN,
  backdrop_path VARCHAR(255),
  origin_country VARCHAR(255),
  original_language VARCHAR(255),
  original_title VARCHAR(255),
  overview VARCHAR(3000),
  poster_path VARCHAR(255),
  release_date DATE,
  runtime INT,
  status VARCHAR(255),
  tagline VARCHAR(255),
  title VARCHAR(255),
  vote_average FLOAT,
  vote_count INT,
  episode_run_time INT[],
  in_production BOOLEAN,
  number_of_episodes INT,
  number_of_seasons INT,
  PRIMARY KEY (is_movie, show_id)
);

CREATE TABLE IF NOT EXISTS genres (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS show_genres (
  show_id INT,
  is_movie BOOLEAN,
  genre_id INT REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (show_id, is_movie, genre_id),
  FOREIGN KEY (show_id, is_movie) REFERENCES shows(show_id, is_movie) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS seasons (
  id SERIAL PRIMARY KEY,
  show_id INT,
  is_movie BOOLEAN,
  FOREIGN KEY (show_id, is_movie) REFERENCES shows(show_id, is_movie) ON DELETE CASCADE,
  air_date DATE,
  episode_count INT,
  name VARCHAR(255),
  overview VARCHAR(1000),
  poster_path VARCHAR(255),
  season_number INT,
  vote_average FLOAT
);

CREATE TABLE IF NOT EXISTS episodes (
  id SERIAL PRIMARY KEY,
  show_id INT,
  is_movie BOOLEAN,
  FOREIGN KEY (show_id, is_movie) REFERENCES shows(show_id, is_movie) ON DELETE CASCADE,
  name VARCHAR(255),
  overview VARCHAR(1000),
  vote_average FLOAT,
  vote_count INT,
  air_date DATE,
  episode_number INT,
  season_number INT,
  runtime INT,
  still_path VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS user_shows (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  show_id INT,
  is_movie BOOLEAN,
  FOREIGN KEY (show_id, is_movie) REFERENCES shows(show_id, is_movie) ON DELETE CASCADE,
  list_type VARCHAR(255),
  score INT,
  PRIMARY KEY (user_id, show_id, is_movie)
);

CREATE TABLE IF NOT EXISTS user_follows (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  follow_id INT REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, follow_id)
);

CREATE TABLE IF NOT EXISTS user_activity (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  show_id INT,
  is_movie BOOLEAN,
  FOREIGN KEY (show_id, is_movie) REFERENCES shows(show_id, is_movie) ON DELETE CASCADE,
  date DATE,
  episode INT,
  PRIMARY KEY (user_id, show_id, is_movie, date)
);

CREATE TABLE IF NOT EXISTS show_comments (
  show_id INT,
  is_movie BOOLEAN,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  comment VARCHAR(1000),
  PRIMARY KEY (show_id, is_movie, user_id),
  FOREIGN KEY (show_id, is_movie) REFERENCES shows(show_id, is_movie) ON DELETE CASCADE
);
    `;

    await client.query(createTablesQuery);
    console.log("Tables created successfully.");
  } catch (err) {
    console.error("Error creating tables:", err.message);
  } finally {
    await client.end();
  }
};
const insertMovieById = async (showId, is_movie) => {
  const client = new Client({
    user: "postgres",
    host: "localhost",
    database: "mywatchlist", // Connect to the newly created database
    password: "boran4545",
    port: 5432,
  });

  try {
    // Connect to the database
    await client.connect();

    // Fetch movie data from TMDB API
    const apiKey = "c8a5dcf600f29bb2715cc66262fb3186";
    const apiUrl = `https://api.themoviedb.org/3/${
      is_movie ? "movie" : "tv"
    }/${showId}?api_key=${apiKey}`;
    const response = await axios.get(apiUrl);

    if (response.status !== 200) {
      throw new Error(`Failed to fetch movie data for ID ${showId}`);
    }

    const show = response.data;

    // Map TMDB API fields to your database schema
    // Correcting episode_run_time to be an array
    const showData = {
      show_id: show.id,
      adult: show.adult === null ? null : show.adult,
      backdrop_path: show.backdrop_path,
      origin_country:
        show.origin_country?.join(",") ||
        show.production_countries?.map((c) => c.iso_3166_1).join(",") ||
        null,
      original_language: show.original_language,
      original_title: show.original_title || show.original_name || null,
      overview: show.overview,
      poster_path: show.poster_path,
      release_date: show.release_date || show.first_air_date || null,
      runtime: show.runtime || null,
      status: show.status,
      tagline: show.tagline,
      title: show.title || show.name,
      vote_average: show.vote_average,
      vote_count: show.vote_count,
      episode_run_time: show.episode_run_time
        ? `{${show.episode_run_time.join(",")}}`
        : null, // Correctly format array for PostgreSQL
      in_production: show.in_production === null ? null : show.in_production,
      number_of_episodes: show.number_of_episodes || null,
      number_of_seasons: show.number_of_seasons || null,
      is_movie: is_movie,
    };

    // Replace empty string values with null
    Object.keys(showData).forEach((key) => {
      if (showData[key] === "" || showData[key] === undefined) {
        showData[key] = null;
      }
    });

    // Insert movie data into the "shows" table
    const insertShowQuery = `
      INSERT INTO shows (
        show_id,is_movie, adult, backdrop_path, origin_country, original_language,
        original_title, overview, poster_path, release_date, runtime,
        status, tagline, title, vote_average, vote_count, 
        episode_run_time, in_production,
        number_of_episodes, number_of_seasons
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20
      )
      ON CONFLICT (is_movie, show_id) DO UPDATE SET
        adult = EXCLUDED.adult,
        backdrop_path = EXCLUDED.backdrop_path,
        origin_country = EXCLUDED.origin_country,
        original_language = EXCLUDED.original_language,
        original_title = EXCLUDED.original_title,
        overview = EXCLUDED.overview,
        poster_path = EXCLUDED.poster_path,
        release_date = EXCLUDED.release_date,
        runtime = EXCLUDED.runtime,
        status = EXCLUDED.status,
        tagline = EXCLUDED.tagline,
        title = EXCLUDED.title,
        vote_average = EXCLUDED.vote_average,
        vote_count = EXCLUDED.vote_count,
        episode_run_time = EXCLUDED.episode_run_time,
        in_production = EXCLUDED.in_production,
        number_of_episodes = EXCLUDED.number_of_episodes,
        number_of_seasons = EXCLUDED.number_of_seasons
    `;

    const insertShowValues = [
      showData.show_id,
      showData.is_movie,
      showData.adult,
      showData.backdrop_path,
      showData.origin_country,
      showData.original_language,
      showData.original_title,
      showData.overview,
      showData.poster_path,
      showData.release_date,
      showData.runtime,
      showData.status,
      showData.tagline,
      showData.title,
      showData.vote_average,
      showData.vote_count,
      showData.episode_run_time,
      showData.in_production,
      showData.number_of_episodes,
      showData.number_of_seasons,
    ];

    await client.query(insertShowQuery, insertShowValues);

    console.log(`Movie with ID ${showId} inserted successfully.`);
  } catch (err) {
    console.error("Error inserting movie:", err.message);
  } finally {
    await client.end();
  }
};

// Export the functions
export { createTables, createDatabase, insertMovieById };
