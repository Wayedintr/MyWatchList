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
  UserListRequest,
  UserListResponse,
} from "@shared/types/admin";
import { JWTPayload } from "@shared/types/auth";
import jwt from "jsonwebtoken";
import { withPoolConnection } from "./db";
import bcrypt from "bcryptjs";

export const adminRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "mywatchlist";

async function isUserAdmin(token: string): Promise<number> {
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
    const { limit, offset, query } = req.body;

    const selectUserQuery = `SELECT id, mail, username, role FROM users WHERE username ILIKE '%${query}%' AND id != $3 ORDER BY id LIMIT $1 OFFSET $2`;
    const selectUserResult = await withPoolConnection((client) => client.query(selectUserQuery, [limit, offset, id]));

    return res.status(200).json({ message: "User list retrieved successfully", users: selectUserResult.rows });
  } catch (err) {
    res.status(403).json({ message: "Error getting user list" });
  }
});
