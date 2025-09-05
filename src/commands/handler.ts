import { proto } from '@whiskeysockets/baileys';

export interface Command {
  name: string;
  description: string;
  category: string;
  usage: string;
  aliases?: string[];
  execute: (sock: any, message: proto.IWebMessageInfo, args: string[]) => Promise<void>;
}

// Map untuk menyimpan semua commands
export const commands = new Map<string, Command>();

// Fungsi untuk mendaftarkan command
function registerCommand(command: Command) {
  commands.set(command.name, command);
  if (command.aliases) {
    command.aliases.forEach(alias => {
      commands.set(alias, command);
    });
  }
}

// ===== CORE COMMANDS =====
registerCommand({
  name: 'start',
  description: 'Perkenalan bot dan petunjuk awal',
  category: 'core',
  usage: '.start',
  execute: async (sock, message, args) => {
    const jid = message.key.remoteJid!;
    await sock.sendMessage(jid, {
      text: '🚀 *Selamat datang di AltraBot!*\n\nSaya adalah bot WhatsApp dengan 200+ perintah yang siap membantu Anda!'
    });
  }
});

registerCommand({
  name: 'ping',
  description: 'Cek respons bot',
  category: 'core',
  usage: '.ping',
  execute: async (sock, message, args) => {
    const jid = message.key.remoteJid!;
    await sock.sendMessage(jid, { text: '🏓 Pong!' });
  }
});

registerCommand({
  name: 'allmenu',
  description: 'Tampilkan semua menu perintah',
  category: 'core',
  usage: '.allmenu',
  execute: async (sock, message, args) => {
    const jid = message.key.remoteJid!;
    const menuText = `🤖 *ALTRABOT - ALL MENU*

📊 *Status Bot*
✅ Connected | ⏰ Uptime: ${process.uptime().toFixed(0)}s

🎯 *Core & Info* (12)
.start, .help, .allmenu, .menu, .ping, .uptime, .about, .verif, .profile, .stats, .report, .bug

🛠️ *User Utility* (28)
.sticker, .toimg, .tourl, .ssweb, .short, .whois, .calc, .translate, .weather, .time, .remind, .note, .poll, .vote, .qrcode, .readqr, .barcode, .unshort, .ocr, .tts, .vtt, .gif2mp4, .mp42gif, .doc2pdf, .pdf2img, .getsw, .uuid, .myid

📥 *Downloader* (30)
.ytmp3, .ytmp4, .ytplay, .tiktok, .tikmp3, .igdl, .reels, .threads, .fb, .xdl, .capcut, .pindl, .snack, .likee, .spotify, .scdl, .apk, .play, .storyig, .gdrive, .mediafire, .zippy, .gitdl, .apkmod, .wallhaven, .pixiv, .ttslide, .capcut2, .savefrom, .sfile

🎮 *Games* (25)
.rps, .tebakkata, .tebakgambar, .tebaklagu, .tebaktebakan, .tebakbendera, .mathquiz, .hangman, .tictactoe, .connect4, .uno, .slot, .suit, .tebakkalimat, .asahotak, .anagram, .unscramble, .truth, .dare, .caklontong, .susunkata, .family100, .typingrace, .minesweeper, .2048

💰 *RPG & Economy* (25)
.rpgstart, .job, .work, .hunt, .fish, .mine, .chop, .farm, .quest, .boss, .craft, .upgrade, .equip, .unequip, .inventory, .shop, .buy, .sell, .bag, .heal, .duel, .clan, .pay, .balance, .leaderboard

🧩 *Teka-Teki & Kuis* (15)
.teka, .riddle, .cipher, .morse, .caesar, .sandi, .sudoku, .crossword, .wordsearch, .math, .logika, .tebakangka, .tebakemot, .quiz, .kuis

😄 *Fun & Social* (20)
.meme, .memetext, .quote, .quotesad, .katabijak, .fancytext, .reverse, .rate, .ship, .compatibility, .cekjodoh, .profilepic, .say, .alay, .hilih, .truthdare, .rant, .emojimix, .lyrics, .define

⚡ *Admin-only* (20)
.add, .kick, .ban, .unban, .mute, .unmute, .promote, .demote, .tagall, .hidetag, .linkgc, .revoke, .setdesc, .setname, .setwelcome, .setgoodbye, .warn, .unwarn, .clear, .antilink

🌟 *Premium-only* (15)
.ai, .img, .upscale, .removebg, .hdvoice, .yt1080, .compresspdf, .mergepdf, .splitpdf, .audiomaster, .translatepro, .ocrpro, .summarize, .detectlang, .limitboost

👑 *Owner-only* (10)
.broadcast, .leave, .restart, .backupdb, .setprice, .setqris, .setpremium, .setrental, .addbot, .eval

ℹ️ Gunakan .help [command] untuk info detail`;
    
    await sock.sendMessage(jid, { text: menuText });
  }
});

registerCommand({
  name: 'help',
  description: 'Bantuan perintah',
  category: 'core',
  usage: '.help [command]',
  execute: async (sock, message, args) => {
    const jid = message.key.remoteJid!;
    if (args.length > 0) {
      const cmdName = args[0].toLowerCase();
      const cmd = commands.get(cmdName);
      if (cmd) {
        await sock.sendMessage(jid, {
          text: `📚 *${cmd.name}*\n${cmd.description}\nUsage: ${cmd.usage}`
        });
      } else {
        await sock.sendMessage(jid, {
          text: `❌ Perintah "${cmdName}" tidak ditemukan. Gunakan .allmenu untuk melihat daftar perintah.`
        });
      }
    } else {
      await sock.sendMessage(jid, {
        text: '🤖 *Bantuan AltraBot*\nGunakan .allmenu untuk melihat semua perintah\nGunakan .help [command] untuk info detail'
      });
    }
  }
});

// ===== UTILITY COMMANDS =====
registerCommand({
  name: 'sticker',
  description: 'Buat stiker dari gambar',
  category: 'utility',
  usage: '.sticker [reply gambar]',
  execute: async (sock, message, args) => {
    const jid = message.key.remoteJid!;
    await sock.sendMessage(jid, {
      text: '🔄 Fitur stiker akan segera hadir!'
    });
  }
});

registerCommand({
  name: 'qrcode',
  description: 'Buat QR code',
  category: 'utility',
  usage: '.qrcode [teks]',
  execute: async (sock, message, args) => {
    const jid = message.key.remoteJid!;
    if (args.length === 0) {
      await sock.sendMessage(jid, {
        text: '❌ Harap berikan teks untuk QR code\nContoh: .qrcode Hello World'
      });
      return;
    }
    await sock.sendMessage(jid, {
      text: `📲 QR Code untuk: "${args.join(' ')}"\nFitur QR code akan segera hadir!`
    });
  }
});

// ===== DOWNLOADER COMMANDS =====
registerCommand({
  name: 'ytmp3',
  description: 'Download audio YouTube',
  category: 'downloader',
  usage: '.ytmp3 [url]',
  execute: async (sock, message, args) => {
    const jid = message.key.remoteJid!;
    await sock.sendMessage(jid, {
      text: '🎵 YouTube MP3 downloader akan segera hadir!'
    });
  }
});

// Tambahkan 195 commands lainnya di sini dengan pattern yang sama...
// Untuk demo, saya tambahkan beberapa contoh:

registerCommand({
  name: 'tts',
  description: 'Text to speech',
  category: 'utility',
  usage: '.tts [teks]',
  execute: async (sock, message, args) => {
    const jid = message.key.remoteJid!;
    await sock.sendMessage(jid, {
      text: '🔊 Fitur TTS akan segera hadir!'
    });
  }
});

registerCommand({
  name: 'weather',
  description: 'Info cuaca',
  category: 'utility',
  usage: '.weather [kota]',
  execute: async (sock, message, args) => {
    const jid = message.key.remoteJid!;
    await sock.sendMessage(jid, {
      text: '🌤️ Fitur weather akan segera hadir!'
    });
  }
});

// ===== FUN COMMANDS =====
registerCommand({
  name: 'meme',
  description: 'Meme acak',
  category: 'fun',
  usage: '.meme',
  execute: async (sock, message, args) => {
    const jid = message.key.remoteJid!;
    await sock.sendMessage(jid, {
      text: '😂 Fitur meme akan segera hadir!'
    });
  }
});

// Total commands yang sudah terdaftar: 10 (tambahkan 190 lagi sesuai kebutuhan)

console.log(`✅ Registered ${commands.size} commands`);
