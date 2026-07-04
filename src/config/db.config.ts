import dotenv from "dotenv";
dotenv.config();

export const dbConfig = {
  uri: process.env.MONGODB_URI || "mongodb://localhost:27017/blunt",
  options: {
    autoIndex: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
};

export default dbConfig;
