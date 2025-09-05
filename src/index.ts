import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { makeWASocket, useMultiFileAuthState, Browsers, proto } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { commands, getCommand } from './commands';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Global variables
let whatsappClient: any = null;
let qrCode: string | null = null;
let isConnected = false;

// Middleware
app.use(express.json());

// Command handler
async function handleMessage(message: proto.IWebMessageInfo) {
  try {
    if (!message.message || !whatsappClient) return;

    const jid = message.key.remoteJid;
    if (!jid) return;

    const messageType = Object.keys(message.message)[0];
    
    // Hanya handle conversation messages
    if (messageType !== 'conversation') return;

    const text = message.message.conversation?.toLowerCase().trim();
    if (!text || !text.startsWith('.')) return;

    const commandText = text.substring(1); // Hilangkan titik
    const [commandName, ...args] = commandText.split(' ');

    console.log(`Received command: ${commandName} from ${jid}`);

    // Cari command
    const command = getCommand(commandName);
    if (command) {
      await command.execute(whatsappClient, message, args);
    } else {
      // Jika command tidak ditemukan
      await whatsappClient.sendMessage(jid, {
        text: `❌ Perintah "${commandName}" tidak dikenali.\n\n` +
              'Gunakan `.allmenu` untuk melihat daftar perintah yang tersedia.\n' +
              'Gunakan `.help` untuk bantuan.'
      });
    }

  } catch (error) {
    console.error('Error handling message:', error);
  }
}

// Inisialisasi WhatsApp
async function initWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('./sessions');

    whatsappClient = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.ubuntu('Chrome'),
    });

    // Event handlers
    whatsappClient.ev.on('connection.update', async (update: any) => {
      const { connection, qr } = update;

      if (qr) {
        qrCode = await QRCode.toDataURL(qr);
        console.log('QR code generated');
      }

      if (connection === 'open') {
        isConnected = true;
        qrCode = null;
        console.log('WhatsApp connected successfully!');
        whatsappClient.ev.on('creds.update', saveCreds);
      }

      if (connection === 'close') {
        isConnected = false;
        console.log('WhatsApp disconnected, restarting...');
        setTimeout(initWhatsApp, 5000);
      }
    });

    // Handle incoming messages
    whatsappClient.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const message of messages) {
        await handleMessage(message);
      }
    });

    whatsappClient.ev.on('creds.update', saveCreds);

  } catch (error) {
    console.error('Error initializing WhatsApp:', error);
    setTimeout(initWhatsApp, 5000);
  }
}

// Health check endpoint
app.get('/healthz', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'OK', 
      message: 'AltraBot is running',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      whatsapp: isConnected ? 'Connected' : 'Disconnected',
      commands: 'Ready'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Main endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AltraBot WhatsApp Bot</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .status { color: green; font-size: 24px; margin-bottom: 20px; }
        .container { max-width: 600px; margin: 0 auto; }
        .connected { color: green; } .disconnected { color: red; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 AltraBot WhatsApp Bot</h1>
        <p class="status">✅ Service is running successfully</p>
        <p>WhatsApp Status: <span class="${isConnected ? 'connected' : 'disconnected'}">${isConnected ? 'Connected' : 'Disconnected'}</span></p>
        <p>Commands: <span class="connected">Ready</span></p>
        <p><a href="/qr">QR Login</a> | <a href="/healthz">Health Check</a></p>
      </div>
    </body>
    </html>
  `);
});

// QR endpoint
app.get('/qr', async (req, res) => {
  try {
    if (!qrCode) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>AltraBot - QR Login</title><meta http-equiv="refresh" content="3"></head>
        <body>
          <h1>AltraBot QR Login</h1>
          <p>⏳ Generating QR code, please wait...</p>
          <script>setTimeout(() => location.reload(), 3000);</script>
        </body>
        </html>
      `);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>AltraBot - QR Login</title></head>
      <body>
        <h1>AltraBot QR Login</h1>
        <img src="${qrCode}" alt="WhatsApp QR Code" style="width: 300px; height: 300px;" />
        <p>Status: <strong>${isConnected ? '✅ Terhubung' : '❌ Menunggu scan'}</strong></p>
        ${!isConnected ? '<script>setTimeout(() => location.reload(), 3000);</script>' : ''}
      </body>
      </html>
    `);

  } catch (error) {
    res.status(500).send('Error generating QR code');
  }
});

// Start server
async function startServer() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`🚀 AltraBot server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/healthz`);
      console.log(`📱 QR Login: http://localhost:${PORT}/qr`);
      
      setTimeout(() => {
        console.log('🔄 Initializing WhatsApp connection...');
        initWhatsApp();
      }, 1000);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  if (whatsappClient) await whatsappClient.ws.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  if (whatsappClient) await whatsappClient.ws.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;
