import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { makeWASocket, useMultiFileAuthState, Browsers, proto } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { commands } from './commands/handler';

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

    // Cek jenis pesan
    const messageType = Object.keys(message.message)[0];
    
    if (messageType === 'conversation') {
      const text = message.message.conversation?.trim();
      if (!text || !text.startsWith('.')) return;

      const commandText = text.substring(1);
      const [commandName, ...args] = commandText.split(' ');

      console.log(`Received command: ${commandName} from ${jid}`);

      // Cari command
      const command = commands.get(commandName.toLowerCase());
      if (command) {
        await command.execute(whatsappClient, message, args);
      } else {
        await whatsappClient.sendMessage(jid, {
          text: `❌ Perintah "${commandName}" tidak dikenali. Gunakan .allmenu untuk melihat daftar perintah.`
        });
      }
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
        console.log('✅ WhatsApp connected successfully!');
        whatsappClient.ev.on('creds.update', saveCreds);
      }

      if (connection === 'close') {
        isConnected = false;
        console.log('🔄 WhatsApp disconnected, restarting...');
        setTimeout(initWhatsApp, 5000);
      }
    });

    // Handle incoming messages
    whatsappClient.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const message of messages) {
        if (!message.key.fromMe) {
          await handleMessage(message);
        }
      }
    });

    whatsappClient.ev.on('creds.update', saveCreds);

  } catch (error) {
    console.error('Error initializing WhatsApp:', error);
    setTimeout(initWhatsApp, 5000);
  }
}

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'AltraBot is running',
    timestamp: new Date().toISOString(),
    whatsapp: isConnected ? 'Connected' : 'Disconnected'
  });
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
        .status { color: green; font-size: 24px; }
      </style>
    </head>
    <body>
      <h1>🤖 AltraBot WhatsApp Bot</h1>
      <p class="status">✅ Service is running</p>
      <p>WhatsApp: ${isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
      <p><a href="/qr">QR Login</a></p>
    </body>
    </html>
  `);
});

// QR endpoint
app.get('/qr', async (req, res) => {
  if (!qrCode) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>AltraBot - QR Login</title>
        <meta http-equiv="refresh" content="3">
      </head>
      <body>
        <h1>AltraBot QR Login</h1>
        <p>⏳ Generating QR code...</p>
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
      <img src="${qrCode}" alt="QR Code" style="width: 300px; height: 300px;">
      <p>Status: ${isConnected ? '✅ Connected' : '❌ Waiting for scan'}</p>
      ${!isConnected ? '<script>setTimeout(() => location.reload(), 3000);</script>' : ''}
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 QR Login: http://localhost:${PORT}/qr`);
  setTimeout(initWhatsApp, 1000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  process.exit(0);
});
