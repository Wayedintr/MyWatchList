import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { withPoolConnection } from "./queries.js"; // Your existing DB utility function


const JWT_SECRET = "mywatchlist"; // Use a secure key and store it in environment variables for production

export const login = async (req, res) => {
    const { mail, password } = req.body;

    if (!mail || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
  
    try {
      const selectUserQuery = `SELECT * FROM users WHERE mail = $1`;
      const user = await withPoolConnection((client) =>
        client.query(selectUserQuery, [mail])
      );
  
      if (user.rows.length === 0) {
        return res.status(401).json({ message: "Invalid email or password." });
      }
  
      // Compare hashed passwords
      const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);
  
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password." });
      }
  
      // Generate JWT
      const token = jwt.sign({ id: user.rows[0].id, username: user.rows[0].username }, JWT_SECRET, {
        expiresIn: "1h",
      });
  
      res.status(200).json({ message: "Login successful.", token });
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

    res.status(201).json({ message: "User registered successfully." });
  } catch (err) {
    console.error("Error during user registration:", err.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

export const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied' });
  
    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      req.user = verified;
      next();
    } catch (err) {
      res.status(403).json({ message: 'Invalid Token' });
    }
  };
