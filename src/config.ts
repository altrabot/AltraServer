import 'dotenv/config';

export const config = {
  port: process.env.PORT || 3000,
  ownerNumber: process.env.OWNER_NUMBER || '083131871328',
  sessionDir: process.env.SESSION_DIR || './sessions',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/altrabot'
};
