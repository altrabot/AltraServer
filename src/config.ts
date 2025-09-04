import { z } from 'zod';
import 'dotenv/config';

const configSchema = z.object({
  env: z.enum(['development', 'production']).default('development'),
  port: z.coerce.number().default(3000),
  ownerNumber: z.string().default('083131871328'),
  sessionDir: z.string().default('./sessions'),
  databaseUrl: z.string().url(),
  redisUrl: z.string().url().optional(),
  baseUrl: z.string().url().optional(),
  qrImageUrl: z.string().url().default('https://files.catbox.moe/311wcy.jpeg'),
});

export const config = configSchema.parse({
  env: process.env.ENV,
  port: process.env.PORT,
  ownerNumber: process.env.OWNER_NUMBER,
  sessionDir: process.env.SESSION_DIR,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  baseUrl: process.env.BASE_URL,
  qrImageUrl: process.env.QR_IMAGE_URL,
});

export type Config = z.infer<typeof configSchema>;
