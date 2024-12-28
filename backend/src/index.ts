import "dotenv/config";
import dotenv from "dotenv";
import express, { Express, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createDatabase, createTables } from "./queries";
import { authenticateToken, authRouter } from "./auth";
import { userRouter } from "./user";
import { showRouter } from "./show";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/show", showRouter);

const initializeDatabase = async () => {
  await createDatabase();
  await createTables();
};
initializeDatabase();

// Example of a Protected Route
app.get("/protected", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    message: "You have accessed a protected route!",
    user: req.user,
  });
});

/* Start the Express app and listen
 for incoming requests on the specified port */
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
