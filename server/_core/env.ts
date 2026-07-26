export const ENV = {
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production-use-long-random-string",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // Optional: AWS S3 for photo storage (leave empty to use local /uploads folder)
  awsS3Bucket: process.env.AWS_S3_BUCKET ?? "",
  awsRegion: process.env.AWS_REGION ?? "us-east-1",
  // Optional: Forge API (for LLM, image generation, voice — not required for core features)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
