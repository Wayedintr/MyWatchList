import express, { Request, Response } from "express";
import { withPoolConnection } from "./db";
import { JWTPayload, UserFriendsRequest, UserFriendsResponse, UserPublicResponse } from "@shared/types/auth";
import {
  showShort,
  userFollowRequest,
  userFollowResponse,
  userFollowsRequest,
  userFollowsResponse,
  UserShowInfo,
  UserShowListRequest,
  UserShowListResponse,
  userShowResponse,
  userStats,
  userStatsResponse,
} from "@shared/types/show";
import {
  DeleteUserActivityRequest,
  DeleteUserActivityResponse,
  GetUserActivityRequest,
  GetUserActivityResponse,
  IncrementShowEpisodeRequest,
  IncrementShowEpisodeResponse,
} from "@shared/types/user";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mywatchlist";

export const userRouter = express.Router();

userRouter.get("/info", async (req: Request, res: Response<UserPublicResponse>) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const selectUserQuery = `SELECT username, id AS user_id FROM users WHERE username = $1`;
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

userRouter.get("/activity", async (req: Request, res: Response<GetUserActivityResponse>) => {
  const query = req.query as unknown as GetUserActivityRequest;
  const user_id = query.user_id;
  const offset = query.offset || 0; // Default to 0 if not provided
  const limit = query.limit || 10; // Default to 10 if not provided
  const include_follows = query.include_follows === "true";

  console.log("user_id", user_id, "offset", offset, "limit", limit, "include_follows", include_follows);

  if (!user_id) {
    return res.status(400).json({ message: "user_id is required" });
  }

  try {
    // Query to fetch user activity with additional data from shows and episodes
    const selectUserActivityQuery = `
      SELECT ua.activity_id, ua.date, ua.list_type, ua.season AS season_number, ua.episode AS episode_number, se.name AS season_name, ua.show_id, ua.is_movie,
        COALESCE(e.still_path, s.poster_path) AS image_path, e.name AS episode_name, s.title AS show_name, u.username
      FROM user_activity ua
      JOIN users u ON ua.user_id = u.id
      LEFT JOIN shows s ON ua.show_id = s.show_id AND ua.is_movie = s.is_movie
      LEFT JOIN episodes e ON ua.show_id = e.show_id AND ua.is_movie = e.is_movie AND ua.season = e.season_number AND ua.episode = e.episode_number
      LEFT JOIN seasons se ON e.show_id = se.show_id AND e.season_number = se.season_number
      WHERE u.id = $1 ${
        include_follows === true ? "OR u.id IN (SELECT follow_id FROM user_follows WHERE user_id = $1)" : ""
      }
      ORDER BY ua.date DESC
      LIMIT $2 OFFSET $3;
    `;

    const userActivityQueryResult = await withPoolConnection((client) =>
      client.query(selectUserActivityQuery, [user_id, limit, offset])
    );

    return res.status(200).json({
      message: "User activity found successfully.",
      activity: userActivityQueryResult.rows.map((row) => ({
        activity_id: row.activity_id,
        username: row.username,
        show_id: row.show_id,
        type: row.is_movie ? "movie" : "tv",
        date: row.date,
        list_type: row.list_type,
        season_number: row.season_number,
        episode_number: row.episode_number,
        image_path: row.image_path,
        season_name: row.season_name,
        episode_name: row.episode_name || null,
        show_name: row.show_name || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ message: "Error fetching user activity" });
  }
});

userRouter.delete("/delete-activity", async (req: Request, res: Response<DeleteUserActivityResponse>) => {
  console.log("DELETE ACTIVITY", req.query as unknown as DeleteUserActivityRequest);
  const token = req.cookies?.authToken;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized", success: false });
  }
  const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

  const { activity_id } = req.query as unknown as DeleteUserActivityRequest;

  try {
    const deleteActivityQuery = `DELETE FROM user_activity WHERE activity_id = $1 AND user_id = $2`;
    const deleteActivityResult = await withPoolConnection((client) =>
      client.query(deleteActivityQuery, [activity_id, decoded.id])
    );
    if (deleteActivityResult.rowCount === 0) {
      return res.status(500).json({ message: "Error deleting user activity", success: false });
    }
    return res.status(200).json({ message: "User activity deleted successfully.", success: true });
  } catch (error) {
    console.error("Error deleting user activity:", error);
    res.status(500).json({ message: "Error deleting user activity", success: false });
  }
});

userRouter.get("/follows", async (req: Request<{}, {}, userFollowsRequest>, res: Response<userFollowsResponse>) => {
  const { username } = req.query;
  const token = req.cookies?.authToken;
  if (!token) {
    return res.status(401).json({ message: "Not authenticated", follows: false });
  }

  try {
    const selectFollowerUserIdQuery = `SELECT id FROM users WHERE username = $1`;
    const followerUserIdResult = await withPoolConnection((client) =>
      client.query(selectFollowerUserIdQuery, [username])
    );

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const selectFollowsQuery = `SELECT user_id, follow_id FROM user_follows WHERE user_id = $1 AND follow_id = $2`;
    const followsResult = await withPoolConnection((client) =>
      client.query(selectFollowsQuery, [decoded.id, followerUserIdResult.rows[0].id])
    );

    if (followsResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found", follows: false });
    }

    if (followsResult.rows.length !== 0) {
      return res.status(200).json({ message: "User follows found successfully.", follows: true });
    }
  } catch (error) {
    console.error("Error fetching user follows:", error);
    res.status(500).json({ message: "Error fetching user follows", follows: false });
  }
});

userRouter.get("/friends", async (req: Request<{}, {}, UserFriendsRequest>, res: Response<UserFriendsResponse>) => {
  const { username } = req.query;
  const token = req.cookies?.authToken;
  if (!token)
    return res.status(401).json({
      message: "Not authenticated",
      friends: [],
    });
  const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

  try {
    const selectFollowerUserIdQuery = `SELECT id FROM users WHERE username = $1`;
    const followerUserIdResult = await withPoolConnection((client) =>
      client.query(selectFollowerUserIdQuery, [username])
    );

    const selectFollowsQuery = `SELECT user_id, username FROM users 
    JOIN user_follows ON users.id = user_follows.user_id WHERE user_follows.follow_id = $1`;
    const followsResult = await withPoolConnection((client) =>
      client.query(selectFollowsQuery, [followerUserIdResult.rows[0].id])
    );

    if (followsResult.rows.length === 0) {
      return res.status(404).json({ message: "Users friends not found", friends: [] });
    }

    if (followsResult.rows.length !== 0) {
      return res.status(200).json({ message: "User friends found successfully.", friends: followsResult.rows });
    }
  } catch (error) {
    console.error("Error fetching user friends:", error);
    res.status(500).json({ message: "Error fetching user friends", friends: [] });
  }
});

userRouter.get("/show-list", async (req: Request, res: Response<UserShowListResponse>) => {
  const query = req.query as unknown as UserShowListRequest;

  try {
    const { user_id, list_type, show_type } = query;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    // Initialize the base query and parameters
    let selectUserShowListQuery = `
      SELECT us.show_id, us.is_movie, s.poster_path, s.title, 
             us.list_type, us.season_number, us.episode_number, us.score, 
             se.episode_count, s.number_of_seasons
      FROM users u
      JOIN user_shows us ON u.id = us.user_id
      JOIN shows s ON us.show_id = s.show_id
      LEFT JOIN seasons se 
             ON s.show_id = se.show_id AND se.season_number = us.season_number
      WHERE u.id = $1
    `;
    const parameters: (string | boolean)[] = [user_id.toString()];

    // Add optional filters dynamically
    if (list_type) {
      selectUserShowListQuery += ` AND us.list_type = $${parameters.length + 1}`;
      parameters.push(list_type);
    }
    if (show_type) {
      selectUserShowListQuery += ` AND us.is_movie = $${parameters.length + 1}`;
      parameters.push(show_type === "movie");
    }

    // Add ordering
    selectUserShowListQuery += ` ORDER BY us.is_movie, us.list_type`;

    // Execute the query
    const userShowListResult = await withPoolConnection((client) => client.query(selectUserShowListQuery, parameters));

    if (userShowListResult.rows.length === 0) {
      return res.status(404).json({ message: "User show list not found" });
    }

    return res.status(200).json({
      message: "User show list found successfully.",
      show_list: userShowListResult.rows.map(
        (row) =>
          ({
            show_id: row.show_id,
            is_movie: row.is_movie,
            poster_path: row.poster_path,
            title: row.title,
            user_show_info: {
              list_type: row.list_type,
              season_number: row.season_number, // Can be NULL
              episode_number: row.episode_number, // Can be NULL
              score: row.score,
              episode_count: row.episode_count, // Can be NULL
              number_of_seasons: row.number_of_seasons,
            } as UserShowInfo,
          } as unknown as showShort)
      ),
    });
  } catch (error) {
    console.error("Error fetching user show list:", error);
    res.status(500).json({ message: "Error fetching user show list" });
  }
});

userRouter.post(
  "/increment-show",
  async (req: Request<{}, {}, IncrementShowEpisodeRequest>, res: Response<IncrementShowEpisodeResponse>) => {
    const token = req.cookies?.authToken;
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      const { show_id, type } = req.body;

      if (!show_id || !type) {
        return res.status(400).json({ message: "show_id and type are required" });
      }

      if (type === "tv") {
        const incrementShowEpisodeQuery = `
        UPDATE user_shows
        SET episode_number = episode_number + 1
        WHERE user_id = $1 AND show_id = $2 AND is_movie = false
        RETURNING episode_number
      `;

        const rows = await withPoolConnection((client) =>
          client.query(incrementShowEpisodeQuery, [decoded.id, show_id])
        );
        return res
          .status(200)
          .json({ message: "Show episode incremented successfully.", tv_episode_number: rows.rows[0].episode_number });
      } else {
        const completeMovieQuery = `
        UPDATE user_shows
        SET list_type = 'Completed'
        WHERE user_id = $1 AND show_id = $2 AND is_movie = true
        RETURNING list_type
        `;

        const rows = await withPoolConnection((client) => client.query(completeMovieQuery, [decoded.id, show_id]));
        return res
          .status(200)
          .json({ message: "Movie completed successfully.", movie_completed: rows.rows[0].list_type === "Completed" });
      }
    } catch (error) {
      console.error("Error incrementing show episode:", error);
      res.status(500).json({ message: "Error incrementing show episode" });
    }
  }
);
