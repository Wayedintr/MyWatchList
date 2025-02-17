import express, { Request, Response } from "express";
import {
  AddUserRequest,
  AddUserResponse,
  ChangeUserPasswordRequest,
  ChangeUserPasswordResponse,
  DeleteUserRequest,
  DeleteUserResponse,
  ModifyUserRequest,
  ModifyUserResponse,
  PreloadShowsRequest,
  PreloadShowsResponse,
  RemoveAllShowsResponse,
  UserListRequest,
  UserListResponse,
} from "@shared/types/admin";
import { JWTPayload } from "@shared/types/auth";
import jwt from "jsonwebtoken";
import { withPoolConnection } from "./db";
import bcrypt from "bcryptjs";
import axios from "axios";
import { insertShowById } from "./queries";

export const adminRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "mywatchlist";

export async function isUserAdmin(token: string): Promise<number> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.role !== "admin") {
      return -1;
    }

    const rows = await withPoolConnection((client) =>
      client.query(`SELECT id FROM users WHERE id = $1 AND role = 'admin'`, [decoded.id])
    );

    if (rows.rows.length === 0) {
      return -1;
    }

    return rows.rows[0].id;
  } catch (error) {
    return -1;
  }
}

adminRouter.post("/adduser", async (req: Request<{}, {}, AddUserRequest>, res: Response<AddUserResponse>) => {
  const id = await isUserAdmin(req.cookies?.authToken || "");
  if (id === -1) {
    return res.status(403).json({ message: "User is not admin" });
  }

  try {
    const { user } = req.body;

    const hashedPassword = await bcrypt.hash(user.password, 10);

    const insertUserQuery = `INSERT INTO users (mail, username, password, role) VALUES ($1, $2, $3, $4) RETURNING id, mail, username, role`;
    const insertUserResult = await withPoolConnection((client) =>
      client.query(insertUserQuery, [user.mail, user.username, hashedPassword, user.role])
    );

    if (insertUserResult.rows.length === 0) {
      return res.status(500).json({ message: "Error adding user" });
    } else {
      return res.status(200).json({
        message: "User added successfully",
        user: {
          id: insertUserResult.rows[0].id,
          mail: insertUserResult.rows[0].mail,
          role: insertUserResult.rows[0].role,
          username: insertUserResult.rows[0].username,
          password: "",
        },
      });
    }
  } catch (err) {
    res.status(403).json({ message: "Error adding user" });
  }
});

adminRouter.post("/deleteuser", async (req: Request<{}, {}, DeleteUserRequest>, res: Response<DeleteUserResponse>) => {
  const id = await isUserAdmin(req.cookies?.authToken || "");
  if (id === -1) {
    return res.status(403).json({ message: "User is not admin", success: false });
  }

  try {
    const { user_id } = req.body;

    const deleteUserQuery = `DELETE FROM users WHERE id = $1`;
    const deleteUserResult = await withPoolConnection((client) => client.query(deleteUserQuery, [user_id]));

    if (deleteUserResult.rowCount === 0) {
      return res.status(500).json({ message: "Error deleting user", success: false });
    } else {
      return res.status(200).json({ message: "User deleted successfully", success: true });
    }
  } catch (err) {
    res.status(403).json({ message: "Error deleting user", success: false });
  }
});

adminRouter.post("/edituser", async (req: Request<{}, {}, ModifyUserRequest>, res: Response<ModifyUserResponse>) => {
  const id = await isUserAdmin(req.cookies?.authToken || "");
  if (id === -1) {
    return res.status(403).json({ message: "User is not admin", success: false });
  }

  try {
    const { user } = req.body;

    const updateUserQuery = `UPDATE users SET mail = $1, username = $2, role = $3 WHERE id = $4`;
    const updateUserResult = await withPoolConnection((client) =>
      client.query(updateUserQuery, [user.mail, user.username, user.role, user.id])
    );

    if (updateUserResult.rowCount === 0) {
      return res.status(500).json({ message: "Error updating user", success: false });
    } else {
      return res.status(200).json({ message: "User updated successfully", success: true });
    }
  } catch (err) {
    res.status(403).json({ message: "Error updating user", success: false });
  }
});

adminRouter.post(
  "/changeuserpassword",
  async (req: Request<{}, {}, ChangeUserPasswordRequest>, res: Response<ChangeUserPasswordResponse>) => {
    const id = await isUserAdmin(req.cookies?.authToken || "");
    if (id === -1) {
      return res.status(403).json({ message: "User is not admin", success: false });
    }

    try {
      const { user_id, new_password } = req.body;
      const hashedPassword = await bcrypt.hash(new_password, 10);

      const updateUserQuery = `UPDATE users SET password = $1 WHERE id = $2`;
      const updateUserResult = await withPoolConnection((client) =>
        client.query(updateUserQuery, [hashedPassword, user_id])
      );

      if (updateUserResult.rowCount === 0) {
        return res.status(500).json({ message: "Error updating user password", success: false });
      } else {
        return res.status(200).json({ message: "User password updated successfully", success: true });
      }
    } catch (err) {
      res.status(403).json({ message: "Error updating user password", success: false });
    }
  }
);

adminRouter.post("/userlist", async (req: Request<{}, {}, UserListRequest>, res: Response<UserListResponse>) => {
  const id = await isUserAdmin(req.cookies?.authToken || "");
  if (id === -1) {
    return res.status(403).json({ message: "User is not admin" });
  }

  try {
    const { page, query } = req.body;

    // Set a fixed limit for pagination
    const limit = 10; // You can adjust this as needed

    // Validate inputs
    if (!page || page <= 0) {
      return res.status(400).json({ message: "Invalid page number" });
    }

    // Calculate offset based on page and fixed limit
    const offset = (page - 1) * limit;

    const selectUserQuery = `
        SELECT id, mail, username, role 
        FROM users 
        WHERE username ILIKE $1 AND id != $2 
        ORDER BY id 
        LIMIT $3 OFFSET $4
      `;

    const selectUserResult = await withPoolConnection((client) =>
      client.query(selectUserQuery, [`%${query}%`, id, limit, offset])
    );

    // Count total users matching the query for pagination
    const countQuery = `
        SELECT COUNT(*) as total
        FROM users 
        WHERE username ILIKE $1 AND id != $2
      `;

    const countResult = await withPoolConnection((client) => client.query(countQuery, [`%${query}%`, id]));

    const totalUsers = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      message: "User list retrieved successfully",
      users: selectUserResult.rows,
      pagination: {
        totalPages,
        currentPage: page,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error getting user list" });
  }
});

adminRouter.post("/removeallshows", async (req, res: Response<RemoveAllShowsResponse>) => {
  const id = await isUserAdmin(req.cookies?.authToken || "");
  if (id === -1) {
    return res.status(403).json({ message: "User is not admin", success: false });
  }

  try {
    const removeAllShowsQuery = `DELETE FROM shows`;
    const removeAllShowsResult = await withPoolConnection((client) => client.query(removeAllShowsQuery));

    if (removeAllShowsResult.rowCount === 0) {
      return res.status(500).json({ message: "Error removing all shows", success: false });
    } else {
      return res.status(200).json({ message: "All shows removed successfully", success: true });
    }
  } catch (err) {
    res.status(403).json({ message: "Error removing all shows", success: false });
  }
});

adminRouter.post(
  "/preloadshows",
  async (req: Request<{}, {}, PreloadShowsRequest>, res: Response<PreloadShowsResponse>) => {
    const id = await isUserAdmin(req.cookies?.authToken || "");
    if (id === -1) {
      return res.status(403).json({ message: "User is not admin" });
    }

    const { page_count } = req.body;

    console.log(`Preloading ${page_count}x2 pages of shows...`);

    try {
      for (let i = 1; i <= page_count; i++) {
        const urlTV = `https://api.themoviedb.org/3/discover/tv`;
        const urlMovie = `https://api.themoviedb.org/3/discover/movie`;
        const searchParams = {
          api_key: process.env.TMDB_API_KEY,
          sort_by: "popularity.desc",
          page: i,
        };

        const [responseTv, responseMovie] = await Promise.all([
          axios.get(urlTV, { params: searchParams }),
          axios.get(urlMovie, { params: searchParams }),
        ]);

        const tvShowIds = responseTv.data.results.map((show: any) => show.id);
        const movieShowIds = responseMovie.data.results.map((show: any) => show.id);

        // Sequentially insert all shows for this page
        for (const showId of tvShowIds) {
          await insertShowById(showId, false);
        }
        for (const showId of movieShowIds) {
          await insertShowById(showId, true);
        }

        console.log(`Preloaded page ${i}`);
      }

      res.status(200).json({ message: "Shows preloaded successfully" });
    } catch (error) {
      console.error("Error during preload:", error);
      res.status(500).json({ message: "Error preloading shows" });
    }
  }
);
