import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { withPoolConnection } from "./db";
import { JWTPayload, LoginRequest, LoginResponse, RegisterRequest, User, UserResponse } from "@shared/types/auth";

export const authRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "mywatchlist";

// Middleware for Token Authentication
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.authToken; // Read the token from cookies

  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = verified; // Attach user info to the request
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid Token" });
  }
};

// Login Function
authRouter.post("/login", async (req: Request<{}, {}, LoginRequest>, res: Response<LoginResponse>) => {
  const { mail, password } = req.body;

  if (!mail || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const selectUserQuery = `SELECT id, mail, username, password FROM users WHERE mail = $1`;
    const userResult = await withPoolConnection((client) => client.query(selectUserQuery, [mail]));

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = userResult.rows[0];

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate JWT with user information
    const token = jwt.sign({ id: user.id, mail: user.mail } as JWTPayload, JWT_SECRET, { expiresIn: "1h" });

    // Set token in HTTP-only cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000, // 1 hour
    });

    res.status(200).json({
      message: "Login successful.",
      user: {
        id: user.id,
        mail: user.mail,
        username: user.username,
      } as User,
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

// Register Function
authRouter.post("/register", async (req: Request<{}, {}, RegisterRequest>, res: Response<LoginResponse>) => {
  const { username, password, mail } = req.body;

  if (!username || !password || !mail) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const insertUserQuery = `
          INSERT INTO users (username, password, mail)
          VALUES ($1, $2, $3)
          ON CONFLICT (mail) DO NOTHING;
        `;

    const result = await withPoolConnection((client) =>
      client.query(insertUserQuery, [username, hashedPassword, mail])
    );

    if (result.rowCount === 0) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const selectUserQuery = `SELECT id, mail, username FROM users WHERE mail = $1`;
    const userResult = await withPoolConnection((client) => client.query(selectUserQuery, [mail]));

    const user = userResult.rows[0];

    // Generate JWT with user information
    const token = jwt.sign({ id: user.id, mail: user.mail } as JWTPayload, JWT_SECRET, { expiresIn: "1h" });

    // Set token in HTTP-only cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000,
    });

    res.status(201).json({
      message: "User registered and logged in successfully.",
      user,
    });
  } catch (err) {
    console.error("Error during user registration:", err);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

authRouter.get("/logout", (req: Request, res: Response) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.status(200).json({ message: "Logged out successfully." });
});

// Example of a Protected Route
authRouter.get("/me", async (req: Request, res: Response<UserResponse>) => {
  const token = req.cookies?.authToken;
  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    const selectUserQuery = `SELECT id, mail, username FROM users WHERE id = $1`;
    const userResult = await withPoolConnection((client) => client.query(selectUserQuery, [decoded.id]));

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Authenticated successfully.",
      user: userResult.rows[0],
    });
  } catch (err) {
    console.error("Error verifying token:", err);
    res.status(403).json({ message: "Invalid token" });
  }
});
