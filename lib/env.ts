import "dotenv/config";

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

export const NODE_ENV = required("NODE_ENV");

export const DATABASE_URL = required("DATABASE_URL");

export const ACCESS_TOKEN_SECRET = required("ACCESS_TOKEN_SECRET");
export const ACCESS_TOKEN_EXPIRES_IN = required("ACCESS_TOKEN_EXPIRES_IN");

export const REFRESH_TOKEN_SECRET = required("REFRESH_TOKEN_SECRET");
export const REFRESH_TOKEN_EXPIRES_IN = required("REFRESH_TOKEN_EXPIRES_IN");

export const IMAGEKIT_PUBLIC_KEY = required("IMAGEKIT_PUBLIC_KEY");
export const IMAGEKIT_PRIVATE_KEY = required("IMAGEKIT_PRIVATE_KEY");
export const IMAGEKIT_URL_ENDPOINT = required("IMAGEKIT_URL_ENDPOINT");

export const DAILY_API_KEY = required("DAILY_API_KEY");
