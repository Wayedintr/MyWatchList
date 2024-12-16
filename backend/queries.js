import axios from "axios";
import pg from "pg";
import dotenv from "dotenv";

const { Pool, Client } = pg;

// Load environment variables from .env file
dotenv.config();

// Create a connection pool
const pool = new Pool();
pool.on("error", (err) => {
  console.error("Idle client error:", err.message, err.stack);
});

// Utility function to handle pool connections
const withPoolConnection = async (callback, errorHandler) => {
  const client = await pool.connect();
  try {
    return await callback(client);
  } catch (err) {
    console.error("Error during database operation:", err.message);

    // If a custom error handler is provided, call it
    if (errorHandler && typeof errorHandler === "function") {
      await errorHandler(err, client); // Pass the error and client for further actions
    }

    throw err; // Re-throw the error for higher-level handling
  } finally {
    client.release();
  }
};

// Function to create the database
const createDatabase = async () => {
  const adminClient = new Client({ database: "postgres" });

  try {
    await adminClient.connect();
    const dbName = process.env.PGDATABASE;
    const dbExists = await adminClient.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
    if (dbExists.rows.length === 0) {
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error("Error creating database:", err.message);
  } finally {
    adminClient.end();
  }
};

// Function to create the tables
const createTables = async () => {
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
  popularity FLOAT,
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
  name VARCHAR(255),
  FOREIGN KEY (show_id, is_movie) REFERENCES shows(show_id, is_movie) ON DELETE CASCADE,
  overview VARCHAR(3000),
  vote_average FLOAT,
  vote_count INT,
  air_date DATE,
  episode_number INT,
  season_number INT,
  runtime INT,
  still_path VARCHAR(255),
  UNIQUE (show_id, is_movie, season_number, episode_number)
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

  await withPoolConnection(async (client) => {
    await client.query(createTablesQuery);
    console.log("Tables created successfully.");
  });
};

// Function to insert episodes by season
const insertEpisodesBySeason = async (showId, seasonNumber, is_movie) => {
  if (is_movie) {
    return;
  }

  const apiUrl = `https://api.themoviedb.org/3/tv/${showId}/season/${seasonNumber}?api_key=${process.env.TMDB_API_KEY}`;
  try {
    const response = await axios.get(apiUrl);

    const seasonData = response.data;

    for (const episode of seasonData.episodes) {
      const insertEpisodeQuery = `
        INSERT INTO episodes (
          show_id, is_movie, name, overview, vote_average, vote_count,
          air_date, episode_number, season_number, runtime, still_path
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (show_id, is_movie, season_number, episode_number) DO UPDATE SET
          name = COALESCE(EXCLUDED.name, episodes.name),
          overview = COALESCE(EXCLUDED.overview, episodes.overview),
          vote_average = COALESCE(EXCLUDED.vote_average, episodes.vote_average),
          vote_count = COALESCE(EXCLUDED.vote_count, episodes.vote_count),
          air_date = COALESCE(EXCLUDED.air_date, episodes.air_date),
          runtime = COALESCE(EXCLUDED.runtime, episodes.runtime),
          still_path = COALESCE(EXCLUDED.still_path, episodes.still_path);
      `;

      const episodeValues = [
        showId,
        is_movie,
        episode.name,
        episode.overview,
        episode.vote_average,
        episode.vote_count,
        episode.air_date,
        episode.episode_number,
        seasonNumber,
        episode.runtime,
        episode.still_path,
      ];

      await withPoolConnection(async (client) => {
        await client.query(insertEpisodeQuery, episodeValues);
      });
    }

    console.log(`[SUCCESS] Episodes for show ID ${showId}, season ${seasonNumber} inserted successfully.`);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.warn(`[WARN] Season data for show ID ${showId}, season ${seasonNumber} not found.`);
    } else {
      console.error(`[ERROR] Error inserting episodes for show ID ${showId}, season ${seasonNumber}:`, err.message);
    }
  }
};

const insertShowById = async (showId, is_movie) => {
  await withPoolConnection(async (client) => {
    try {
      const apiUrl = `https://api.themoviedb.org/3/${is_movie ? "movie" : "tv"}/${showId}?api_key=${
        process.env.TMDB_API_KEY
      }`;
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
          show.origin_country?.join(",") || show.production_countries?.map((c) => c.iso_3166_1).join(",") || null,
        original_language: show.original_language,
        original_title: show.original_title || show.original_name || null,
        overview: show.overview,
        popularity: show.popularity || null,
        poster_path: show.poster_path,
        release_date: show.release_date || show.first_air_date || null,
        runtime: show.runtime || null,
        status: show.status,
        tagline: show.tagline,
        title: show.title || show.name,
        vote_average: show.vote_average,
        vote_count: show.vote_count,
        episode_run_time: show.episode_run_time ? `{${show.episode_run_time.join(",")}}` : null, // Correctly format array for PostgreSQL
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
        show_id, is_movie, adult, backdrop_path, origin_country, original_language,
        original_title, overview, popularity, poster_path, release_date, runtime,
        status, tagline, title, vote_average, vote_count,
        episode_run_time, in_production,
        number_of_episodes, number_of_seasons
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21
      )
      ON CONFLICT (is_movie, show_id) DO UPDATE SET
        adult = EXCLUDED.adult,
        backdrop_path = EXCLUDED.backdrop_path,
        origin_country = EXCLUDED.origin_country,
        original_language = EXCLUDED.original_language,
        original_title = EXCLUDED.original_title,
        overview = EXCLUDED.overview,
        popularity = EXCLUDED.popularity,
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
        showData.popularity,
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

      // Insert genres
      if (show.genres && show.genres.length > 0) {
        for (const genre of show.genres) {
          const insertGenreQuery = `
          INSERT INTO genres (id, name)
          VALUES ($1, $2)
          ON CONFLICT (id) DO NOTHING
        `;
          await client.query(insertGenreQuery, [genre.id, genre.name]);

          // Insert show_genres
          const insertShowGenreQuery = `
          INSERT INTO show_genres (show_id, is_movie, genre_id)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
        `;
          await client.query(insertShowGenreQuery, [showId, is_movie, genre.id]);
        }
      }

      // Insert seasons (for TV shows)
      if (!is_movie && show.seasons && show.seasons.length > 0) {
        for (const season of show.seasons) {
          const insertSeasonQuery = `
          INSERT INTO seasons (
            show_id, is_movie, air_date, episode_count, name, overview,
            poster_path, season_number, vote_average
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            air_date = COALESCE(EXCLUDED.air_date, seasons.air_date),
            episode_count = COALESCE(EXCLUDED.episode_count, seasons.episode_count),
            name = COALESCE(EXCLUDED.name, seasons.name),
            overview = COALESCE(EXCLUDED.overview, seasons.overview),
            poster_path = COALESCE(EXCLUDED.poster_path, seasons.poster_path),
            vote_average = COALESCE(EXCLUDED.vote_average, seasons.vote_average);
        `;
          await client.query(insertSeasonQuery, [
            showId,
            is_movie,
            season.air_date,
            season.episode_count,
            season.name,
            season.overview,
            season.poster_path,
            season.season_number,
            season.vote_average,
          ]);
        }
      }

      // Fetch seasons and episodes for TV shows
      if (!is_movie) {
        const show = response.data;
        for (const season of show.seasons) {
          // Insert season data (existing logic)
          await insertEpisodesBySeason(showId, season.season_number, is_movie);
        }
      }

      console.log(`[SUCCESS] Show with ID ${showId} inserted successfully.`);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.warn(`[WARN] Show data for ID ${showId} not found.`);
      } else {
        console.error(`[ERROR] Error inserting show with ID ${showId}:`, err.message);
      }
    }
  });
};

// Export the functions
export { createTables, createDatabase, insertShowById, withPoolConnection};
