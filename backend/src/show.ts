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
} from "@shared/types/show";
import { insertShowById } from "./queries";
import axios from "axios";
import { removeUndefined } from "./utils";

export const showRouter = express.Router();

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

  if (type === "tv") {
    response = await withPoolConnection((client) =>
      client.query("SELECT * FROM seasons WHERE show_id = $1", [show_id])
    );
    if (response.rows.length !== 0) {
      show.seasons = response.rows as Season[];
      show.seasons.forEach((season: Season) => (season.episodes = []));
      response = await withPoolConnection((client) =>
        client.query("SELECT * FROM episodes WHERE show_id = $1", [show_id])
      );
      if (response.rows.length !== 0) {
        response.rows.forEach((episode: Episode) => {
          show.seasons.find((season: Season) => season.season_number === episode.season_number).episodes.push(episode);
        });
      }
    }
  }

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
