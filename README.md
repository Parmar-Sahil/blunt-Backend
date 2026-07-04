# BLUNT Ecommerce Backend

Custom Express and Mongoose backend server for the BLUNT streetwear platform.

## Getting Started

1. Set up your local environment file:
   ```bash
   cp .env.example .env
   ```
2. Configure credentials in `.env` (MongoDB connection URI, JWT secrets, Resend key, and Cloudinary keys).
3. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```

## Cloudinary Setup

To configure image hosting for Products, Categories, and Collections:

1. Create a [Cloudinary](https://cloudinary.com) account.
2. Obtain the **Cloud Name**, **API Key**, and **API Secret** from the Cloudinary Dashboard console.
3. Add these credentials to your local `.env` file under the following keys:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Restart the backend server after updating these environment variables.
