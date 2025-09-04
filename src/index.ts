import 'dotenv/config';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { PrismaClient } from '@prisma/client';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { initWebServer } from './web/server';
import { initWhatsAppClient } from './wa/baileys';
import { initScheduler } from './services/scheduler';
import { initRedis } from './services/redis';
import { logger } from './utils/logger';
import { config } from './config';

// Inisialisasi database
export const prisma = new PrismaClient();

// Inisialisasi Express dan Socket.IO
const app = express();
const server = createServer(app);
const io = new SocketIOServer(server);

// Variabel global
export let whatsappClient: ReturnType<typeof makeWASocket> | null = null;
export let qrCode: string | null = null;
export let isConnected = false;

async function startApp() {
  try {
    logger.info('Memulai AltraBot...');

    // Inisialisasi Redis
    await initRedis();

    // Inisialisasi scheduler
    initScheduler();

    // Inisialisasi web server
    initWebServer(app, io);

    // Inisialisasi WhatsApp client
    await initWhatsAppClient(io);

    // Health endpoint
    app.get('/healthz', (req, res) => {
      res.status(200).json({ 
        status: 'OK', 
        connected: isConnected,
        timestamp: new Date().toISOString()
      });
    });

    // Start server
    const PORT = config.port;
    server.listen(PORT, () => {
      logger.info(`Server berjalan di port ${PORT}`);
      logger.info(`Health check tersedia di http://localhost:${PORT}/healthz`);
      logger.info(`QR login tersedia di http://localhost:${PORT}/qr`);
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Menerima SIGINT, mematikan bot dengan graceful...');
      if (whatsappClient) {
        await whatsappClient.logout();
        await whatsappClient.ws.close();
      }
      await prisma.$disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Menerima SIGTERM, mematikan bot dengan graceful...');
      if (whatsappClient) {
        await whatsappClient.logout();
        await whatsappClient.ws.close();
      }
      await prisma.$disconnect();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Error saat memulai aplikasi:', error);
    process.exit(1);
  }
}

startApp();
