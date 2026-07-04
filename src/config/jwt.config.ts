import dotenv from "dotenv";
dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || "blunt_super_secret_key_change_in_production",
  expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "blunt_super_refresh_secret_key",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
};

export default jwtConfig;
