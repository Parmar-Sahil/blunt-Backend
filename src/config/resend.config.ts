import dotenv from "dotenv";
dotenv.config();

export const resendConfig = {
  apiKey: process.env.RESEND_API_KEY || "re_mock_api_key_for_testing",
  fromEmail: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
};

export default resendConfig;
