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
authRouter.post("/login", async (req: Request<LoginRequest>, res: Response<LoginResponse>) => {
  const { mail, password } = req.body;

  if (!mail || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const selectUserQuery = `SELECT id, mail, role, username, password FROM users WHERE mail = $1`;
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
    const token = jwt.sign({ id: user.id, mail: user.mail, role: user.role } as JWTPayload, JWT_SECRET, {
      expiresIn: "24h",
    });

    // Set token in HTTP-only cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000 * 24, // 1 day
    });

    res.status(200).json({
      message: "Login successful.",
      user: {
        id: user.id,
        mail: user.mail,
        username: user.username,
        role: user.role,
      } as User,
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

// Register Function
// Register Function
authRouter.post("/register", async (req: Request<RegisterRequest>, res: Response<LoginResponse>) => {
  const { username, password, mail } = req.body;

  if (!username || !password || !mail) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    return res.status(400).json({ message: "Invalid username." });
  }

  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(mail)) {
    return res.status(400).json({ message: "Invalid email." });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check for conflicts on username or mail
    const checkUserConflictQuery = `
      SELECT username, mail FROM users WHERE username = $1 OR mail = $2
    `;
    const conflictResult = await withPoolConnection((client) => client.query(checkUserConflictQuery, [username, mail]));

    if (conflictResult.rows.length > 0) {
      const conflictFields = conflictResult.rows
        .map((row) => (row.username === username ? "Username" : "Mail"))
        .join(" and ");
      return res.status(409).json({ message: `${conflictFields} already exists.` });
    }

    // Insert the new user into the database
    const insertUserQuery = `
      INSERT INTO users (username, password, mail)
      VALUES ($1, $2, $3)
      RETURNING id, mail, username, role
    `;

    const result = await withPoolConnection((client) =>
      client.query(insertUserQuery, [username, hashedPassword, mail])
    );

    const user = result.rows[0];

    // Generate JWT with user information
    const token = jwt.sign({ id: user.id, mail: user.mail, role: user.role } as JWTPayload, JWT_SECRET, {
      expiresIn: "24h",
    });

    // Set token in HTTP-only cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000 * 24, // 1 day
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

// Retrieve logged in user information
authRouter.get("/me", async (req: Request, res: Response<UserResponse>) => {
  const token = req.cookies?.authToken;
  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    const selectUserQuery = `SELECT id, mail, username, role FROM users WHERE id = $1`;
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
