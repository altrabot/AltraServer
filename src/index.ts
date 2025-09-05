import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { makeWASocket, useMultiFileAuthState, Browsers, proto, downloadContentFromMessage } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'path';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Global variables untuk WhatsApp client
let whatsappClient: any = null;
let qrCode: string | null = null;
let isConnected = false;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Command handler sederhana
async function handleMessage(message: proto.IWebMessageInfo) {
  try {
    if (!message.message) return;

    const jid = message.key.remoteJid;
    const isGroup = jid?.endsWith('@g.us');
    const messageType = Object.keys(message.message)[0];
    
    // Hanya handle conversation messages
    if (messageType !== 'conversation') return;

    const text = message.message.conversation?.toLowerCase().trim();
    if (!text) return;

    // Cek jika pesan adalah perintah (dimulai dengan .)
    if (text.startsWith('.')) {
      const command = text.split(' ')[0].substring(1);
      const args = text.split(' ').slice(1);

      console.log(`Received command: ${command} from ${jid}`);

      // Handler untuk berbagai perintah
      switch (command) {
        case 'ping':
          await whatsappClient.sendMessage(jid, { text: '🏓 Pong!' });
          break;

        case 'allmenu':
          const menuText = `🤖 *ALTRABOT - ALL MENU*

📊 *Status Bot*
- ✅ Connected: Yes
- ⏰ Uptime: ${process.uptime().toFixed(0)}s
- 🚀 Version: 1.0.0

📂 *Categories & Commands*

🎯 *Core & Info* (12 commands)
.start, .help, .allmenu, .menu, .ping, .uptime, .about, .verif, .profile, .stats, .report, .bug

🛠️ *User Utility* (28 commands)
.sticker, .toimg, .tourl, .ssweb, .short, .whois, .calc, .translate, .weather, .time, .remind, .note, .poll, .vote, .qrcode, .readqr, .barcode, .unshort, .ocr, .tts, .vtt, .gif2mp4, .mp42gif, .doc2pdf, .pdf2img, .getsw, .uuid, .myid

📥 *Downloader* (30 commands)
.ytmp3, .ytmp4, .ytplay, .tiktok, .tikmp3, .igdl, .reels, .threads, .fb, .xdl, .capcut, .pindl, .snack, .likee, .spotify, .scdl, .apk, .play, .storyig, .gdrive, .mediafire, .zippy, .gitdl, .apkmod, .wallhaven, .pixiv, .ttslide, .capcut2, .savefrom, .sfile

🎮 *Games* (25 commands)
.rps, .tebakkata, .tebakgambar, .tebaklagu, .tebaktebakan, .tebakbendera, .mathquiz, .hangman, .tictactoe, .connect4, .uno, .slot, .suit, .tebakkalimat, .asahotak, .anagram, .unscramble, .truth, .dare, .caklontong, .susunkata, .family100, .typingrace, .minesweeper, .2048

💰 *RPG & Economy* (25 commands)
.rpgstart, .job, .work, .hunt, .fish, .mine, .chop, .farm, .quest, .boss, .craft, .upgrade, .equip, .unequip, .inventory, .shop, .buy, .sell, .bag, .heal, .duel, .clan, .pay, .balance, .leaderboard

🧩 *Teka-Teki & Kuis* (15 commands)
.teka, .riddle, .cipher, .morse, .caesar, .sandi, .sudoku, .crossword, .wordsearch, .math, .logika, .tebakangka, .tebakemot, .quiz, .kuis

😄 *Fun & Social* (20 commands)
.meme, .memetext, .quote, .quotesad, .katabijak, .fancytext, .reverse, .rate, .ship, .compatibility, .cekjodoh, .profilepic, .say, .alay, .hilih, .truthdare, .rant, .emojimix, .lyrics, .define

⚡ *Admin-only* (20 commands)
.add, .kick, .ban, .unban, .mute, .unmute, .promote, .demote, .tagall, .hidetag, .linkgc, .revoke, .setdesc, .setname, .setwelcome, .setgoodbye, .warn, .unwarn, .clear, .antilink

🌟 *Premium-only* (15 commands)
.ai, .img, .upscale, .removebg, .hdvoice, .yt1080, .compresspdf, .mergepdf, .splitpdf, .audiomaster, .translatepro, .ocrpro, .summarize, .detectlang, .limitboost

👑 *Owner-only* (10 commands)
.broadcast, .leave, .restart, .backupdb, .setprice, .setqris, .setpremium, .setrental, .addbot, .eval

ℹ️ *Usage*
- Gunakan .help [command] untuk info detail
- Gunakan .menu [category] untuk perintah kategori tertentu

© 2024 AltraBot - All rights reserved`;
          
          await whatsappClient.sendMessage(jid, { text: menuText });
          break;

        case 'help':
          await whatsappClient.sendMessage(jid, { 
            text: '🤖 *Bantuan AltraBot*\n\n' +
                  'Gunakan `.allmenu` untuk melihat semua perintah\n' +
                  'Gunakan `.help [perintah]` untuk bantuan spesifik\n' +
                  'Contoh: `.help sticker`\n\n' +
                  'Bot sedang dalam pengembangan!'
          });
          break;

        case 'start':
          await whatsappClient.sendMessage(jid, {
            text: '🚀 *Selamat datang di AltraBot!*\n\n' +
                  'Saya adalah bot WhatsApp dengan 200+ perintah.\n\n' +
                  '✨ *Fitur Utama:*\n' +
                  '• Downloader media (YouTube, TikTok, Instagram, dll)\n' +
                  '• Tools utility (sticker, qrcode, dll)\n' +
                  '• Game seru dan RPG economy\n' +
                  '• System moderator untuk grup\n\n' +
                  '📋 Gunakan `.allmenu` untuk melihat semua perintah\n' +
                  '❓ Gunakan `.help` untuk bantuan\n\n' +
                  'Enjoy menggunakan AltraBot! 🤖'
          });
          break;

        default:
          await whatsappClient.sendMessage(jid, {
            text: `❌ Perintah "${command}" tidak dikenali.\n\n` +
                  'Gunakan `.allmenu` untuk melihat daftar perintah yang tersedia.\n' +
                  'Gunakan `.help` untuk bantuan.'
          });
          break;
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
        // Generate QR code sebagai data URL
        qrCode = await QRCode.toDataURL(qr);
        console.log('QR code generated');
      }

      if (connection === 'open') {
        isConnected = true;
        qrCode = null;
        console.log('WhatsApp connected successfully!');
        
        // Simpan credentials
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
      message: 'AltraBot is running with database connected',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      whatsapp: isConnected ? 'Connected' : 'Disconnected',
      commands: 'Ready'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      database: 'Disconnected'
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
        .info { margin: 10px 0; }
        .qr-container { margin: 20px auto; }
        .connected { color: green; }
        .disconnected { color: red; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 AltraBot WhatsApp Bot</h1>
        <p class="status">✅ Service is running successfully</p>
        
        <div class="info">
          <p><strong>WhatsApp Status:</strong> 
            <span class="${isConnected ? 'connected' : 'disconnected'}">
              ${isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </p>
          <p><strong>Commands:</strong> <span class="connected">Ready</span></p>
          <p><strong>Health check:</strong> <a href="/healthz">/healthz</a></p>
          <p><strong>QR Login:</strong> <a href="/qr">/qr</a></p>
          <p><strong>Database:</strong> PostgreSQL with Prisma</p>
        </div>
        
        <p>Bot sudah siap menerima perintah di WhatsApp!</p>
        <p>Try: <code>.start</code>, <code>.help</code>, or <code>.allmenu</code></p>
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
        <head>
          <title>AltraBot - QR Login</title>
          <style>body { font-family: Arial, sans-serif; text-align: center; padding: 50px; } .info { margin: 20px 0; } .loading { color: blue; }</style>
          <meta http-equiv="refresh" content="3">
        </head>
        <body>
          <h1>AltraBot QR Login</h1>
          <div class="info">
            <p class="loading">⏳ Generating QR code, please wait...</p>
          </div>
          <p><a href="/">Back to Home</a></p>
          <script>setTimeout(() => { location.reload(); }, 3000);</script>
        </body>
        </html>
      `);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>AltraBot - QR Login</title>
        <style>body { font-family: Arial, sans-serif; text-align: center; padding: 50px; } .info { margin: 20px 0; } .qr-container { margin: 20px auto; }</style>
      </head>
      <body>
        <h1>AltraBot QR Login</h1>
        <div class="qr-container"><img src="${qrCode}" alt="WhatsApp QR Code" style="width: 300px; height: 300px;" /></div>
        <div class="info">
          <p>Status: <strong>${isConnected ? '✅ Terhubung' : '❌ Menunggu scan'}</strong></p>
          ${!isConnected ? '<p><em>Halaman akan otomatis refresh setiap 3 detik</em></p>' : ''}
        </div>
        <p><a href="/">Back to Home</a></p>
        ${!isConnected ? '<script>setTimeout(() => { location.reload(); }, 3000);</script>' : ''}
      </body>
      </html>
    `);

  } catch (error) {
    console.error('QR endpoint error:', error);
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
      console.log(`🔗 Homepage: http://localhost:${PORT}`);
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

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  if (whatsappClient) {
    await whatsappClient.ws.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  if (whatsappClient) {
    await whatsappClient.ws.close();
  }
  process.exit(0);
});

// Start the server
startServer();

export default app;
