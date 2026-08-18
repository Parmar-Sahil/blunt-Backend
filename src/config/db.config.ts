import dotenv from "dotenv";
dotenv.config();

export const dbConfig = {
  uri: process.env.MONGODB_URI || "mongodb://localhost:27017/blunt",
  options: {
    autoIndex: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 60000,
    connectTimeoutMS: 30000,
    heartbeatFrequencyMS: 10000,
  },
};

export default dbConfig;
