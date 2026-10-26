/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_FIREBASE_DATABASE_URL:
      process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
      process.env.VITE_FIREBASE_DATABASE_URL ||
      "",
    NEXT_PUBLIC_FIREBASE_NODE:
      process.env.NEXT_PUBLIC_FIREBASE_NODE ||
      process.env.VITE_FIREBASE_NODE ||
      "expenseTracker",
    NEXT_PUBLIC_DATABASE_SECRET:
      process.env.NEXT_PUBLIC_DATABASE_SECRET ||
      process.env.VITE_DATABASE_SECRET ||
      "",
    NEXT_PUBLIC_EXPUSER_NODE:
      process.env.NEXT_PUBLIC_EXPUSER_NODE || "expuser",
    NEXT_PUBLIC_EXPPASS_NODE:
      process.env.NEXT_PUBLIC_EXPPASS_NODE || "exppass",
    NEXT_PUBLIC_EXPUSER:
      process.env.NEXT_PUBLIC_EXPUSER || process.env.EXPUSER || "",
    NEXT_PUBLIC_EXPPASS:
      process.env.NEXT_PUBLIC_EXPPASS || process.env.EXPPASS || "",
  },
};

export default nextConfig;
