import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { withPoolConnection } from "./queries.js"; // Your existing DB utility function

const JWT_SECRET = "mywatchlist";

// Login Function
export const login = async (req, res) => {
  const { mail, password } = req.body;

  if (!mail || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const selectUserQuery = `SELECT * FROM users WHERE mail = $1`;
    const user = await withPoolConnection((client) => client.query(selectUserQuery, [mail]));

    if (user.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.rows[0].id, mail: user.rows[0].mail }, JWT_SECRET, { expiresIn: "1h" });

    // Set token in HTTP-only cookie
    res.cookie("authToken", token, {
      httpOnly: true, // Secure from client-side scripts
      secure: process.env.NODE_ENV === "production", // Set to true in production (requires HTTPS)
      sameSite: "Strict", // CSRF protection
      maxAge: 3600000, // 1 hour in milliseconds
    });

    res.status(200).json({ message: "Login successful." });
  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

export const register = async (req, res) => {
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

    // Fetch the newly created user to generate the token
    const selectUserQuery = `SELECT * FROM users WHERE mail = $1`;
    const userResult = await withPoolConnection((client) => client.query(selectUserQuery, [mail]));

    const user = userResult.rows[0];

    // Generate JWT for the new user
    const token = jwt.sign({ id: user.id, mail: user.mail }, JWT_SECRET, { expiresIn: "1h" });

    // Set token in HTTP-only cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 3600000, // 1 hour
    });

    res.status(201).json({
      message: "User registered and logged in successfully.",
    });
  } catch (err) {
    console.error("Error during user registration:", err.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

export const logout = (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  res.status(200).json({ message: "Logged out successfully." });
};

export const authenticateToken = (req, res, next) => {
  const token = req.cookies.authToken; // Read the token from cookies

  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // Attach user info to the request
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid Token" });
  }
};
