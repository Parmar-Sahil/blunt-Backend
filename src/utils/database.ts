import mongoose from "mongoose";

/**
 * Production-grade database connection utility.
 */
export async function connectDatabase(uri: string): Promise<typeof mongoose> {
  if (!uri) {
    throw new Error("DATABASE CONNECTION URI IS REQUIRED");
  }

  try {
    const conn = await mongoose.connect(uri);
    return conn;
  } catch (err: any) {
    throw new Error(`Database connection failed: ${err.message}`);
  }
}

/**
 * Closes the active database connection.
 */
export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
