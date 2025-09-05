import { proto } from '@whiskeysockets/baileys';
import { Command } from './index';

export const coreCommands: Command[] = [
  {
    name: 'start',
    description: 'Perkenalan bot dan petunjuk awal',
    category: 'core',
    usage: '.start',
    execute: async (sock, message, args) => {
      const jid = message.key.remoteJid!;
      await sock.sendMessage(jid, {
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
    }
  },
  {
    name: 'help',
    description: 'Bantuan ringkas perintah',
    category: 'core',
    usage: '.help [perintah]',
    execute: async (sock, message, args) => {
      const jid = message.key.remoteJid!;
      if (args.length > 0) {
        const commandName = args[0].toLowerCase();
        await sock.sendMessage(jid, {
          text: `📚 *Bantuan: ${commandName}*\n\nFitur help detail sedang dalam pengembangan.`
        });
      } else {
        await sock.sendMessage(jid, {
          text: '🤖 *Bantuan AltraBot*\n\n' +
                'Gunakan `.allmenu` untuk melihat semua perintah\n' +
                'Gunakan `.help [perintah]` untuk bantuan spesifik\n' +
                'Contoh: `.help sticker`\n\n' +
                'Bot sedang dalam pengembangan!'
        });
      }
    }
  },
  {
    name: 'allmenu',
    description: 'Tampilkan semua menu perintah',
    category: 'core',
    usage: '.allmenu',
    execute: async (sock, message, args) => {
      const jid = message.key.remoteJid!;
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
      
      await sock.sendMessage(jid, { text: menuText });
    }
  },
  {
    name: 'ping',
    description: 'Cek respons bot',
    category: 'core',
    usage: '.ping',
    execute: async (sock, message, args) => {
      const jid = message.key.remoteJid!;
      await sock.sendMessage(jid, { text: '🏓 Pong!' });
    }
  },
  {
    name: 'uptime',
    description: 'Lama bot online',
    category: 'core',
    usage: '.uptime',
    execute: async (sock, message, args) => {
      const jid = message.key.remoteJid!;
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      
      await sock.sendMessage(jid, {
        text: `⏰ *Uptime Bot*\n\n` +
              `🕒 ${hours} jam ${minutes} menit ${seconds} detik\n` +
              `📊 sejak terakhir restart`
      });
    }
  }
];
