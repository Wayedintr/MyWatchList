import express, { Request, Response } from "express";
import { withPoolConnection } from "./db";
import { JWTPayload, UserPublicResponse } from "@shared/types/auth";
import {
  showShort,
  userFollowRequest,
  userFollowResponse,
  userShowResponse,
  userStats,
  userStatsResponse,
} from "@shared/types/show";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mywatchlist";

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
      stats: userStatsQueryResult.rows[0] as unknown as userStats,
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({ message: "Error fetching user statistics" });
  }
});

userRouter.post("/follow", async (req: Request<{}, {}, userFollowRequest>, res: Response<userFollowResponse>) => {
  console.log("FOLLOW REQUEST", req.body);
  const token = req.cookies?.authToken;
  const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const { followed_username: followed_username, is_following: is_following } = req.body;

  if (is_following) {
    try {
      const selectFollowedUserQuery = `SELECT id FROM users WHERE username = $1`;
      const followedUseridResult = await withPoolConnection((client) =>
        client.query(selectFollowedUserQuery, [followed_username])
      );

      const followerId = decoded.id;
      const followId = followedUseridResult.rows[0].id;

      const deleteFollowQuery = `DELETE FROM user_follows WHERE user_id = $1 AND follow_id = $2`;
      const followResult = await withPoolConnection((client) =>
        client.query(deleteFollowQuery, [followerId, followId])
      );

      if (followResult.rowCount === 0) {
        return res.status(500).json({ message: "Error unfollowing user" });
      }

      console.log("FOLLOWED USER ID", followerId, "FOLLOWING USER ID", followId);
      return res.status(200).json({ message: "User unfollowed successfully." });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Error unfollowing user" });
    }

  } else {
    try {
      const selectFollowedUserQuery = `SELECT id FROM users WHERE username = $1`;
      const followedUseridResult = await withPoolConnection((client) =>
        client.query(selectFollowedUserQuery, [followed_username])
      );

      const followerId = decoded.id;
      const followId = followedUseridResult.rows[0].id;

      const insertFollowQuery = `INSERT INTO user_follows(user_id, follow_id) VALUES ($1, $2)`;
      const followResult = await withPoolConnection((client) =>
        client.query(insertFollowQuery, [followerId, followId])
      );

      if (followResult.rowCount === 0) {
        return res.status(500).json({ message: "Error following user" });
      }

      console.log("FOLLOWED USER ID", followerId, "FOLLOWING USER ID", followId);
      return res.status(200).json({ message: "User followed successfully." });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Error following user" });
    }
  }
});
