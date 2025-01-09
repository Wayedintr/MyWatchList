import axios from "axios";
import { Client, PoolClient } from "pg";
import { withPoolConnection } from "./db";
import { Episode, Season } from "@shared/types/show";
import TTLCache from "@isaacs/ttlcache";

type ShowData = {
  show_id: number;
  is_movie: boolean;
  adult: boolean | null;
  backdrop_path: string | null;
  origin_country: string | null;
  original_language: string | null;
  original_title: string | null;
  overview: string | null;
  popularity: number | null;
  poster_path: string | null;
  release_date: string | null;
  runtime: number | null;
  status: string | null;
  tagline: string | null;
  title: string | null;
  vote_average: number | null;
  vote_count: number | null;
  episode_run_time: string | null;
  in_production: boolean | null;
  number_of_episodes: number | null;
  number_of_seasons: number | null;
};

// Configure the LRU cache
const showTimeouts = new TTLCache({
  ttl: 10 * 60 * 1000, // 10 minutes
  max: 100000, // 100.000 * 8bytes = 800MB
  noUpdateTTL: true,
});

export const createDatabase = async (): Promise<void> => {
  const adminClient = new Client({ database: "postgres" });

  try {
    await adminClient.connect();
    const dbName = process.env.PGDATABASE;
    const dbExists = await adminClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);

    if (dbExists.rows.length === 0) {
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error("Error creating database:", (err as Error).message);
  } finally {
    await adminClient.end();
  }
};

export const createTables = async (): Promise<void> => {
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
    show_id INT,
    is_movie BOOLEAN,
    FOREIGN KEY (show_id, is_movie) REFERENCES shows(show_id, is_movie) ON DELETE CASCADE,
    air_date DATE,
    episode_count INT,
    name VARCHAR(255),
    overview VARCHAR(1000),
    poster_path VARCHAR(255),
    season_number INT,
    vote_average FLOAT,
    PRIMARY KEY (show_id, is_movie, season_number)
  );

  CREATE TABLE IF NOT EXISTS episodes (
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
    UNIQUE (show_id, is_movie, season_number, episode_number),
    PRIMARY KEY (show_id, is_movie, season_number, episode_number)
  );

  CREATE TABLE IF NOT EXISTS user_shows (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    show_id INT,
    is_movie BOOLEAN,
    FOREIGN KEY (show_id, is_movie) REFERENCES shows(show_id, is_movie) ON DELETE CASCADE,
    list_type VARCHAR(255) CHECK (list_type IN ('Plan To Watch', 'Watching', 'Completed', 'Dropped', 'On Hold', null)),
    season_number INT,
    episode_number INT,
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
    date TIMESTAMP,
    list_type VARCHAR(255) CHECK (list_type IN ('Plan To Watch', 'Watching', 'Completed', 'Dropped', 'On Hold', null)),
    season INT,
    episode INT,
    FOREIGN KEY (show_id, is_movie) REFERENCES shows(show_id, is_movie) ON DELETE CASCADE,
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

  CREATE OR REPLACE VIEW user_statistics AS
    SELECT 
    u.id AS user_id,
    u.username,
    COUNT(CASE WHEN us.list_type = 'Watching' THEN 1 END) AS watching_count,
    COUNT(CASE WHEN us.list_type = 'Completed' THEN 1 END) AS completed_count,
    COUNT(CASE WHEN us.list_type = 'On-Hold' THEN 1 END) AS on_hold_count,
    COUNT(CASE WHEN us.list_type = 'Dropped' THEN 1 END) AS dropped_count,
    COUNT(CASE WHEN us.list_type = 'Plan to Watch' THEN 1 END) AS plan_to_watch_count,
    COUNT(*) AS total_entries,

    -- Total episodes watched calculation
    SUM(
        COALESCE(
            (SELECT SUM(s.episode_count)
             FROM seasons s
             WHERE s.show_id = us.show_id AND s.is_movie = FALSE 
               AND s.season_number < us.season_number),
            0
        ) + us.episode_number
    ) AS total_episodes_watched,

    -- Calculate total runtime watched in days (runtime from episodes table)
    ROUND(
        SUM(
            COALESCE(
                (SELECT SUM(e.runtime)
                 FROM episodes e
                 WHERE e.show_id = us.show_id AND e.is_movie = FALSE
                   AND e.season_number < us.season_number),
                0
            ) + 
            (SELECT SUM(e.runtime)
             FROM episodes e
             WHERE e.show_id = us.show_id AND e.is_movie = FALSE
               AND e.season_number = us.season_number
               AND e.episode_number <= us.episode_number)
        ) / 1440.0, 2
    ) AS days_watched,

    -- Average score
    ROUND(AVG(us.score)::NUMERIC, 2) AS mean_score
    FROM 
    users u
    LEFT JOIN 
    user_shows us ON u.id = us.user_id
    LEFT JOIN 
    shows s ON us.show_id = s.show_id AND us.is_movie = s.is_movie
    GROUP BY 
    u.id, u.username;


CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip if no changes are detected
    IF NEW = OLD THEN
        RETURN NULL;
    END IF;

    -- Handle list type change or "Watching" season/episode changes
    IF (NEW.list_type != OLD.list_type) OR (OLD.list_type IS NULL AND NEW.list_type IS NOT NULL)
       OR (NEW.list_type = 'Watching'
           AND NEW.season_number IS NOT NULL
           AND NEW.episode_number IS NOT NULL
           AND (NEW.season_number != OLD.season_number OR NEW.episode_number != OLD.episode_number)) THEN

        INSERT INTO user_activity (user_id, show_id, is_movie, date, list_type, season, episode)
        VALUES (NEW.user_id, NEW.show_id, NEW.is_movie, CURRENT_TIMESTAMP, NEW.list_type, NEW.season_number, NEW.episode_number)
        ON CONFLICT (user_id, show_id, is_movie, date) DO NOTHING;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER log_activity
AFTER INSERT OR UPDATE ON user_shows
FOR EACH ROW
EXECUTE FUNCTION log_activity();
  `;

  await withPoolConnection(async (client: PoolClient) => {
    await client.query(createTablesQuery);
    console.log("Tables created successfully.");
  });
};

const insertEpisodesBySeason = async (showId: number, seasonNumber: number, is_movie: boolean): Promise<void> => {
  if (is_movie) return;

  const apiUrl = `https://api.themoviedb.org/3/tv/${showId}/season/${seasonNumber}?api_key=${process.env.TMDB_API_KEY}`;

  try {
    const response = await axios.get(apiUrl);
    const seasonData = response.data;

    if (!seasonData.episodes || seasonData.episodes.length === 0) {
      console.warn(`[WARN] No episodes found for show ID ${showId}, season ${seasonNumber}.`);
      return;
    }

    const values = seasonData.episodes
      .map(
        (episode: Episode) => `(
          ${showId},
          ${is_movie},
          ${episode.name ? `'${episode.name.replace(/'/g, "''")}'` : "NULL"},
          ${episode.overview ? `'${episode.overview.replace(/'/g, "''")}'` : "NULL"},
          ${episode.vote_average || "NULL"},
          ${episode.vote_count || "NULL"},
          ${episode.air_date ? `'${episode.air_date}'` : "NULL"},
          ${episode.episode_number},
          ${seasonNumber},
          ${episode.runtime || "NULL"},
          ${episode.still_path ? `'${episode.still_path.replace(/'/g, "''")}'` : "NULL"}
        )`
      )
      .join(", ");

    const insertEpisodeQuery = `
      INSERT INTO episodes (
        show_id, is_movie, name, overview, vote_average, vote_count,
        air_date, episode_number, season_number, runtime, still_path
      )
      VALUES ${values}
      ON CONFLICT (show_id, is_movie, season_number, episode_number) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, episodes.name),
        overview = COALESCE(EXCLUDED.overview, episodes.overview),
        vote_average = COALESCE(EXCLUDED.vote_average, episodes.vote_average),
        vote_count = COALESCE(EXCLUDED.vote_count, episodes.vote_count),
        air_date = COALESCE(EXCLUDED.air_date, episodes.air_date),
        runtime = COALESCE(EXCLUDED.runtime, episodes.runtime),
        still_path = COALESCE(EXCLUDED.still_path, episodes.still_path);
    `;

    await withPoolConnection(async (client: PoolClient) => {
      await client.query(insertEpisodeQuery);
    });

    console.log(`[SUCCESS] Episodes for show ID ${showId}, season ${seasonNumber} inserted successfully.`);
  } catch (err: any) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      console.warn(`[WARN] Season data for show ID ${showId}, season ${seasonNumber} not found.`);
    } else {
      console.error(`[ERROR] Error inserting episodes for show ID ${showId}, season ${seasonNumber}:`, err.message);
    }
  }
};

export const insertShowById = async (showId: number, is_movie: boolean): Promise<void> => {
  if (showTimeouts.has(showId)) {
    console.log(`[INFO] Show ID ${showId} is in timeout, skipping...`);
    return;
  }

  await withPoolConnection(async (client: PoolClient) => {
    try {
      await client.query("SELECT status FROM shows WHERE show_id = $1 AND is_movie = $2", [showId, is_movie]);

      const apiUrl = `https://api.themoviedb.org/3/${is_movie ? "movie" : "tv"}/${showId}?api_key=${
        process.env.TMDB_API_KEY
      }`;
      const response = await axios.get(apiUrl);

      if (response.status !== 200) {
        throw new Error(`Failed to fetch movie data for ID ${showId}`);
      }

      const show = response.data;

      const showData: ShowData = {
        show_id: show.id,
        is_movie,
        adult: show.adult ?? null,
        backdrop_path: show.backdrop_path ?? null,
        origin_country: show.origin_country?.join(",") || null,
        original_language: show.original_language ?? null,
        original_title: show.original_title || show.original_name || null,
        overview: show.overview ?? null,
        popularity: show.popularity || null,
        poster_path: show.poster_path ?? null,
        release_date: show.release_date || show.first_air_date || null,
        runtime: show.runtime || null,
        status: show.status ?? null,
        tagline: show.tagline ?? null,
        title: show.title || show.name || null,
        vote_average: show.vote_average || null,
        vote_count: show.vote_count || null,
        episode_run_time: show.episode_run_time ? `{${show.episode_run_time.join(",")}}` : null,
        in_production: show.in_production ?? null,
        number_of_episodes: show.number_of_episodes || null,
        number_of_seasons: show.number_of_seasons || null,
      };

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

      if (show.genres && show.genres.length > 0) {
        // Batch insert into genres table
        const genresValues = show.genres
          .map((genre: any) => `(${genre.id}, '${genre.name.replace(/'/g, "''")}')`)
          .join(", ");

        const insertGenresQuery = `
          INSERT INTO genres (id, name)
          VALUES ${genresValues}
          ON CONFLICT (id) DO NOTHING;
        `;

        // Batch insert into show_genres table
        const showGenresValues = show.genres.map((genre: any) => `(${showId}, ${is_movie}, ${genre.id})`).join(", ");

        const insertShowGenresQuery = `
          INSERT INTO show_genres (show_id, is_movie, genre_id)
          VALUES ${showGenresValues}
          ON CONFLICT DO NOTHING;
        `;

        await withPoolConnection(async (client: PoolClient) => {
          // Execute both batch queries
          if (genresValues) {
            await client.query(insertGenresQuery);
          }
          if (showGenresValues) {
            await client.query(insertShowGenresQuery);
          }
        });

        console.log(`[SUCCESS] Genres and show genres for show ID ${showId} inserted successfully.`);
      }

      if (!is_movie && show.seasons && show.seasons.length > 0) {
        // Prepare batched insert for seasons
        const seasonsValues = show.seasons
          .map(
            (season: Season) =>
              `(${showId}, ${is_movie}, ${season.air_date ? `'${season.air_date}'` : "NULL"}, ${
                season.episode_count || "NULL"
              }, ${season.name ? `'${season.name.replace(/'/g, "''")}'` : "NULL"}, ${
                season.overview ? `'${season.overview.replace(/'/g, "''")}'` : "NULL"
              }, ${season.poster_path ? `'${season.poster_path.replace(/'/g, "''")}'` : "NULL"}, ${
                season.season_number
              }, ${season.vote_average || "NULL"})`
          )
          .join(", ");

        const insertSeasonsQuery = `
          INSERT INTO seasons (
            show_id, is_movie, air_date, episode_count, name, overview,
            poster_path, season_number, vote_average
          )
          VALUES ${seasonsValues}
          ON CONFLICT (show_id, is_movie, season_number) DO UPDATE SET
            air_date = COALESCE(EXCLUDED.air_date, seasons.air_date),
            episode_count = COALESCE(EXCLUDED.episode_count, seasons.episode_count),
            name = COALESCE(EXCLUDED.name, seasons.name),
            overview = COALESCE(EXCLUDED.overview, seasons.overview),
            poster_path = COALESCE(EXCLUDED.poster_path, seasons.poster_path),
            vote_average = COALESCE(EXCLUDED.vote_average, seasons.vote_average);
        `;

        const lastSeason = show.seasons.reduce((prev: any, curr: any) =>
          prev.season_number > curr.season_number ? prev : curr
        );

        // Check if all seasons are already inserted
        const result = await client.query(`SELECT COUNT(*) FROM seasons WHERE show_id = $1 AND is_movie = $2`, [
          showId,
          is_movie,
        ]);
        const insertedSeasonsCount = parseInt(result.rows[0].count, 10);

        // Insert or update seasons
        await client.query(insertSeasonsQuery);

        if (insertedSeasonsCount === show.seasons.length) {
          // Only insert episodes for the last season if all seasons are already inserted
          console.log(`[INFO] All seasons for show ID ${showId} are already inserted.`);
          console.log(`[INFO] Processing episodes for the last season: ${lastSeason.season_number}.`);
          await insertEpisodesBySeason(showId, lastSeason.season_number, is_movie);
        } else {
          // Insert episodes for all seasons
          console.log(`[INFO] Inserting episodes for all seasons of show ID ${showId}.`);
          for (const season of show.seasons) {
            await insertEpisodesBySeason(showId, season.season_number, is_movie);
          }
        }

        console.log(`[SUCCESS] Seasons and episodes for show ID ${showId} processed successfully.`);
      }

      showTimeouts.set(showId, true);
      console.log(`[SUCCESS] Show with ID ${showId} inserted successfully.`);
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        console.warn(`[WARN] Show data for ID ${showId} not found.`);
      } else {
        console.error(`[ERROR] Error inserting show with ID ${showId}:`, err.message);
      }
    }
  });
};
