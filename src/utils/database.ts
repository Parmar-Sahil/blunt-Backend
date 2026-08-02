import mongoose from "mongoose";
import dns from "dns";

// Force public DNS resolvers to handle MongoDB Atlas querySrv DNS lookups correctly
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (err) {
  console.warn("[DNS] FAILED TO CONFIGURE PUBLIC DNS RESOLVERS", err);
}


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
