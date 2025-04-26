# MOC Frontend (moc-fe)

This is the frontend application for MOC, built with Next.js 15 and Tailwind CSS.

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`

## 🔌 API Configuration

The application is configured to connect to the backend API. By default, it connects to `http://localhost:3006/api`.

### Environment Variables

The following environment variables can be used to configure the API connection:

- `NEXT_PUBLIC_API_URL`: The URL of the API server
- `NEXT_PUBLIC_ENV`: The current environment (development, production, etc.)

### Configuration Files

The application uses the following environment files, in order of priority:

1. `.env.local` (highest priority, not committed to git)
2. `.env.development` (used in development)
3. `.env.production` (used in production)
4. `.env` (default fallback)

### Checking Environment Configuration

You can check the current environment configuration using:

```bash
npm run check-env
```

### For Production

When deploying to production, set the environment variables on your hosting platform:

```
NEXT_PUBLIC_API_URL=https://api.your-production-domain.com/api
NEXT_PUBLIC_ENV=production
```

## 📁 Project Structure

- `/src/lib/axios.ts` - API client configuration
- `/src/services/api.ts` - API service functions
- `/src/utils/apiConfig.ts` - API utility functions
- `/src/components/ApiStatus.tsx` - API status indicator component

## 📋 Available Scripts

- `npm run dev` - Run the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run linting
- `npm run check-env` - Check environment configuration
- `npm run dev:with-env` - Check environment and run development server
- `npm run build:with-env` - Check environment and build for production

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
