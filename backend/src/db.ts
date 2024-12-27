import { Pool, PoolClient } from "pg";

export const pool = new Pool();

pool.on("error", (err: Error) => {
  console.error("Idle client error:", err.message, err.stack);
});

type Callback<T> = (client: PoolClient) => Promise<T>;
type ErrorHandler = (error: Error, client: PoolClient) => Promise<void>;

export const withPoolConnection = async <T>(callback: Callback<T>, errorHandler?: ErrorHandler): Promise<T> => {
  const client = await pool.connect();
  try {
    return await callback(client);
  } catch (err) {
    console.error("Database operation error:", (err as Error).message);
    if (errorHandler) await errorHandler(err as Error, client);
    throw err;
  } finally {
    client.release();
  }
};
