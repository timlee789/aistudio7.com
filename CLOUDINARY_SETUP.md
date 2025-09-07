# Cloudinary Setup Instructions

## Why Cloudinary?
Vercel's serverless functions have a read-only file system, so we cannot save uploaded files locally. Cloudinary provides free cloud storage for images and videos.

## Setup Steps

1. **Create a Cloudinary Account**
   - Go to https://cloudinary.com
   - Sign up for a free account
   - The free plan includes:
     - 25 GB storage
     - 25 GB bandwidth/month
     - 25,000 transformations/month

2. **Get Your API Credentials**
   - After signing up, go to your Cloudinary Dashboard
   - Find your credentials:
     - Cloud Name
     - API Key
     - API Secret

3. **Add Environment Variables to Vercel**
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add these variables:
     ```
     CLOUDINARY_CLOUD_NAME=your_cloud_name
     CLOUDINARY_API_KEY=your_api_key
     CLOUDINARY_API_SECRET=your_api_secret
     ```

4. **Add to Local .env.local** (for local development)
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

5. **Redeploy Your Application**
   - After adding environment variables, redeploy your Vercel app
   - The deployment will automatically use the new variables

## Features
- Automatic image optimization
- Automatic format selection (WebP, AVIF for supported browsers)
- CDN delivery for fast loading
- No file system limitations on Vercel

## Troubleshooting
- If uploads fail, check that all three environment variables are set correctly
- Ensure your Cloudinary account is active and not over quota
- Check the Vercel function logs for detailed error messages