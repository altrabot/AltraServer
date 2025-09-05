import 'dotenv/config';

export const config = {
  port: process.env.PORT || 3000,
  ownerNumber: process.env.OWNER_NUMBER || '083131871328',
  sessionDir: process.env.SESSION_DIR || './sessions',
  databaseUrl: process.env.DATABASE_URL || 'postgres://7c8228d94725305c4fee7b2874d2d7c6ed03c568c69e375b42173e313f37287e:sk_K4KFOB900HrkeqoYGgVEa@db.prisma.io:5432/postgres?sslmode=require',
  redisUrl: process.env.REDIS_URL,
  baseUrl: process.env.BASE_URL,
  qrImageUrl: process.env.QR_IMAGE_URL || 'https://files.catbox.moe/311wcy.jpeg'
};
