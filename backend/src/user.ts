import express, { Request, Response, NextFunction } from "express";
import { withPoolConnection } from "./db";
import { UserPublicResponse } from "@shared/types/auth";

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
