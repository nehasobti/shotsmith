export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: {
    compatibilityVersion: 4,
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    betterAuthUrl: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleGenerativeAiApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    falKey: process.env.FAL_KEY,
    falWebhookBaseUrl: process.env.FAL_WEBHOOK_BASE_URL || '',
    blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN,
    upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL,
    upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN,
    inngestEventKey: process.env.INNGEST_EVENT_KEY,
    inngestSigningKey: process.env.INNGEST_SIGNING_KEY,
    aiMock: process.env.AI_MOCK === '1',
    signupCredits: Number(process.env.SIGNUP_CREDITS || '30'),
    demoUserEmail: process.env.DEMO_USER_EMAIL || 'demo@shopshot.dev',
    demoUserPassword: process.env.DEMO_USER_PASSWORD || '',
    public: {
      appName: 'ShopShot AI',
      appUrl: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    },
  },
  nitro: {
    preset: 'node-server',
  },
});
