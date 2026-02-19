import { createClient } from "@sanity/client"

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ""
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? ""
const token = process.env.SANITY_API_TOKEN

if (!token) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing environment variable: SANITY_API_TOKEN. Set SANITY_API_TOKEN in your deployment (e.g. Vercel Project Settings → Environment Variables) with a write token from Sanity."
    )
  } else {
    // In development we warn but don't throw so local read-only workflows still work.
    // This gives a clearer signal during development and in Vercel logs when token is absent.
    // eslint-disable-next-line no-console
    console.warn(
      "Warning: SANITY_API_TOKEN is not set. Sanity write operations will fail in production. Add SANITY_API_TOKEN to your environment."
    )
  }
}

export const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  useCdn: process.env.NODE_ENV === "production",
  token
})

export const readClient = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  useCdn: true
})