const LOCAL_API_BASE_URL = "http://localhost:8080";
const PROD_API_BASE_URL = "https://app-a2138b56-48d2-4d1a-a28e-1aa8425e9298.cleverapps.io";

const trimTrailingSlash = (url) => (url ? url.replace(/\/+$/, "") : "");

const fromEnv = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL);
const isLocalHost = typeof window !== "undefined"
  && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export const API_BASE_URL = fromEnv || (isLocalHost ? LOCAL_API_BASE_URL : PROD_API_BASE_URL);

if (!fromEnv && !isLocalHost) {
  console.warn("VITE_API_BASE_URL is not set. Falling back to default production backend URL.");
}
