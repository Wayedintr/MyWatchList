import express, { Request, Response } from "express";
import { withPoolConnection } from "./db";
import {
  ShowResponse,
  ShowRequest,
  Season,
  Episode,
  SearchRequest,
  SearchResponse,
  SearchApiResponse,
  ListRequest,
  ListResponse,
  ListGetRequest,
  ListGetResponse,
  MakeShowCommentRequest,
  MakeShowCommentResponse,
  Comment,
} from "@shared/types/show";
import { insertShowById } from "./queries";
import axios from "axios";
import { removeUndefined } from "./utils";
import { authenticateToken } from "./auth";
import { JWTPayload } from "@shared/types/auth";
import jwt from "jsonwebtoken";
import { DeleteShowCommentRequest, DeleteShowCommentResponse } from "@shared/types/user";

export const showRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "mywatchlist";

showRouter.get("/info", async (req: Request, res: Response<ShowResponse>) => {
  const { type, show_id } = req.query as unknown as ShowRequest;

  if (!type || !show_id) {
    return res.status(400).json({ message: "Type and ID are required" });
  }

  await insertShowById(show_id, type === "movie");

  let response = await withPoolConnection((client) =>
    client.query("SELECT * FROM shows WHERE is_movie = $1 AND show_id = $2", [type === "movie", show_id])
  );
  if (response.rows.length === 0) {
    return res.status(404).json({ message: "Show not found" });
  }

  let show = response.rows[0];

  // Fetch genres for the show
  response = await withPoolConnection((client) =>
    client.query(
      `SELECT genres.name 
       FROM show_genres 
       JOIN genres ON show_genres.genre_id = genres.id 
       WHERE show_genres.show_id = $1 AND show_genres.is_movie = $2`,
      [show_id, type === "movie"]
    )
  );
  show.genres = response.rows.map((row) => row.name);

  if (type === "tv") {
    response = await withPoolConnection((client) =>
      client.query("SELECT * FROM seasons WHERE show_id = $1 ORDER BY season_number", [show_id])
    );
    if (response.rows.length !== 0) {
      show.seasons = response.rows as Season[];
      show.seasons.forEach((season: Season) => (season.episodes = []));
      response = await withPoolConnection((client) =>
        client.query("SELECT * FROM episodes WHERE show_id = $1 ORDER BY season_number, episode_number", [show_id])
      );
      if (response.rows.length !== 0) {
        response.rows.forEach((episode: Episode) => {
          show.seasons.find((season: Season) => season.season_number === episode.season_number).episodes.push(episode);
        });
      }
    }
  }

  response = await withPoolConnection((client) =>
    client.query(
      `SELECT sc.comment_id, sc.comment, sc.date, u.username FROM show_comments sc
       JOIN users u ON sc.user_id = u.id
       WHERE sc.show_id = $1 AND sc.is_movie = $2
       ORDER BY sc.date DESC`,
      [show_id, type === "movie"]
    )
  );
  show.comments = response.rows;

  return res.status(200).json({ message: "Show found", show });
});

showRouter.get("/search", async (req: Request, res: Response<SearchResponse>) => {
  const params = removeUndefined(req.query as unknown as SearchRequest);

  if (!params.type || !params.query) {
    return res.status(400).json({ message: "Type and query are required" });
  }

  const url = `https://api.themoviedb.org/3/search/${params.type}`;
  const searchParams = {
    ...params,
    api_key: process.env.TMDB_API_KEY,
  };

  try {
    console.log("Making request to:", url);
    const response = await axios.get(url, { params: searchParams });
    const apiResponse = response.data as SearchApiResponse;
    if (apiResponse.results.length === 0) {
      return res.status(404).json({ message: "No results found" });
    }

    return res.status(200).json({ message: "Search results", result: apiResponse });
  } catch (error: any) {
    console.error("Error details:", {
      message: error.message,
    });
    res.status(500).json({ message: "Internal Server Error" });
  }
});

showRouter.post("/list", async (req: Request<{}, {}, ListRequest>, res: Response<ListResponse>) => {
  const token = req.cookies?.authToken;
  const { show_id, is_movie, user_show_info } = req.body;

  console.log("Received request to add show to list:", { show_id, is_movie, user_show_info });

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    const listInsertQuery = `INSERT INTO user_shows (user_id, show_id, is_movie, list_type, season_number, episode_number, score) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (user_id, show_id, is_movie) DO UPDATE SET 
    list_type = EXCLUDED.list_type, 
    season_number = EXCLUDED.season_number, 
    episode_number = EXCLUDED.episode_number, 
    score = EXCLUDED.score;`;

    const listResult = await withPoolConnection((client) =>
      client.query(listInsertQuery, [
        decoded.id,
        show_id,
        is_movie,
        user_show_info.list_type === "" ? null : user_show_info.list_type,
        user_show_info.season_number === "" ? null : user_show_info.season_number,
        user_show_info.episode_number === "" ? null : user_show_info.episode_number,
        user_show_info.score === "" ? null : user_show_info.score,
      ])
    );

    if (listResult.rowCount === 0) {
      return res.status(409).json({ message: "There was an error adding the show to the list" });
    }

    return res.status(200).json({ message: "Post added to the list" });
  } catch (err: any) {
    console.error("Error adding list: " + err.message + ' "' + user_show_info.score + '"');
    res.status(403).json({ message: "Invalid token" });
  }
});

showRouter.get("/listget", async (req: Request, res: Response<ListGetResponse>) => {
  const token = req.cookies?.authToken;
  const params = removeUndefined(req.query as unknown as ListGetRequest);

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    const listInsertQuery = `SELECT * FROM user_shows WHERE user_id = $1 AND show_id = $2 AND is_movie = $3`;

    const listResult = await withPoolConnection((client) =>
      client.query(listInsertQuery, [decoded.id, params.show_id, params.is_movie])
    );

    if (listResult.rowCount === 0) {
      return res.status(200).json({ message: "No entry" });
    }

    return res.status(200).json({
      message: "Get operation has been completed",
      show_user_info: {
        list_type: listResult.rows[0].list_type,
        season_number: listResult.rows[0].season_number,
        episode_number: listResult.rows[0].episode_number,
        score: listResult.rows[0].score,
      },
    });
  } catch (err) {
    console.error("Error verifying token:", err);
    res.status(403).json({ message: "Invalid token" });
  }
});

showRouter.post(
  "/make-comment",
  async (req: Request<{}, {}, MakeShowCommentRequest>, res: Response<MakeShowCommentResponse>) => {
    const token = req.cookies?.authToken;
    if (!token) {
      return res.status(401).json({ message: "Not authenticated", success: false, comment_id: -1 });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

      const { show_id, type, comment } = req.body;

      const insertCommentQuery = `INSERT INTO show_comments (show_id, is_movie, comment, user_id, date) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING comment_id`;

      const insertCommentResult = await withPoolConnection((client) =>
        client.query(insertCommentQuery, [show_id, type === "movie", comment, decoded.id])
      );

      if (insertCommentResult.rowCount === 0) {
        return res.status(500).json({ message: "Error making comment", success: false, comment_id: -1 });
      }

      return res.status(200).json({
        message: "Comment made successfully",
        success: true,
        comment_id: insertCommentResult.rows[0].comment_id,
      });
    } catch (error) {
      console.error("Error making comment:", error);
      res.status(403).json({ message: "Error making comment", success: false, comment_id: -1 });
    }
  }
);

showRouter.delete(
  "/delete-comment",
  async (req: Request<{}, {}, DeleteShowCommentRequest>, res: Response<DeleteShowCommentResponse>) => {
    const token = req.cookies?.authToken;
    if (!token) {
      return res.status(401).json({ message: "Not authenticated", success: false });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

      const { comment_id } = req.query as unknown as DeleteShowCommentRequest;

      const deleteCommentQuery = `DELETE FROM show_comments WHERE comment_id = $1 AND user_id = $2`;

      const deleteCommentResult = await withPoolConnection((client) =>
        client.query(deleteCommentQuery, [comment_id, decoded.id])
      );

      if (deleteCommentResult.rowCount === 0) {
        return res.status(500).json({ message: "Error deleting comment", success: false });
      }

      return res.status(200).json({ message: "Comment deleted successfully", success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(403).json({ message: "Error deleting comment", success: false });
    }
  }
);
