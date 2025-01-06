import express, { Request, Response } from "express";
import { withPoolConnection } from "./db";
import { UserPublicResponse } from "@shared/types/auth";
import { showShort, userShowResponse, userStats, userStatsResponse } from "@shared/types/show";

export const userRouter = express.Router();

userRouter.get("/info", async (req: Request, res: Response<UserPublicResponse>) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const selectUserQuery = `SELECT username FROM users WHERE username = $1`;
    const userResult = await withPoolConnection((client) => client.query(selectUserQuery, [username]));

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User found successfully.",
      user: userResult.rows[0],
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
});

userRouter.get("/shows", async (req: Request, res: Response<userShowResponse>) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const selectUserShowQuery = `SELECT 
    u.id AS user_id,
    u.username,
    us.show_id,
    us.is_movie,
    us.list_type,
    us.season_number,
    us.episode_number,
    us.score,
    s.title,
    s.poster_path,
    se.episode_count
    FROM 
    users u
    JOIN 
    user_shows us ON u.id = us.user_id
    JOIN 
    shows s ON us.show_id = s.show_id
    JOIN
    seasons se ON s.show_id = se.show_id
    AND
    se.season_number = us.season_number
    WHERE 
    u.username = $1; -- Replace $1 with the actual username parameter
`;
    const userShowQueryResult = await withPoolConnection((client) => client.query(selectUserShowQuery, [username]));

    if (userShowQueryResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = userShowQueryResult.rows[0].id;

    return res.status(200).json({
      message: "User shows found successfully.",
      show_list: userShowQueryResult.rows.map(
        (row) =>
          ({
            id: row.id,
            show_id: row.show_id,
            is_movie: row.is_movie,
            list_type: row.list_type,
            season_number: row.season_number,
            episode_number: row.episode_number,
            score: row.score,
            title: row.title,
            poster_path: row.poster_path,
            episode_count: row.episode_count,
          } as unknown as showShort)
      ),
    });
  } catch (error) {
    console.error("Error fetching user shows:", error);
    res.status(500).json({ message: "Error fetching user shows" });
  }
});


userRouter.get("/statistics", async (req: Request, res: Response<userStatsResponse>) => {

 try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const selectUserStatsQuery = `SELECT * FROM user_statistics WHERE username = $1`;
    const userStatsQueryResult = await withPoolConnection((client) => client.query(selectUserStatsQuery, [username]));

    if (userStatsQueryResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    } 

    return res.status(200).json({
      message: "User statistics found successfully.",
      stats: userStatsQueryResult.rows[0] as unknown as userStats
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({ message: "Error fetching user statistics" });
  }


});
