import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { logger } from '../../utils/logger';

// Database teka-teki (bisa dipindah ke DB)
const riddles = [
  {
    question: "Apa yang selalu datang tetapi tidak pernah sampai?",
    answer: "besok"
  },
  {
    question: "Semakin banyak diambil, semakin besar jadinya. Apa itu?",
    answer: "lubang"
  },
  {
    question: "Bisa berbicara semua bahasa, tapi tidak punya mulut. Apa itu?",
    answer: "gema"
  },
  {
    question: "Apa yang punya kota tapi tidak punya rumah, punya hutan tapi tidak punya pohon, punya sungai tapi tidak punya air?",
    answer: "peta"
  }
];

export const riddleCommand: Command = {
  name: 'riddle',
  description: 'Tebak teka-teki',
  usage: '.riddle',
  aliases: ['teka-teki'],
  category: 'tebak',
  
  execute: async (sock: WASocket, message: WAMessage, args: string[]) => {
    try {
      const jid = message.key.remoteJid!;
      
      // Pilih teka-teki random
      const riddle = riddles[Math.floor(Math.random() * riddles.length)];
      
      // Kirim teka-teki
      await sock.sendMessage(jid, {
        text: `🤔 *Teka-Teki*\n\n${riddle.question}\n\nJawab dengan format: .jawab [jawaban]`
      });
      
      // Simpan state untuk cek jawaban
      // (Implementasi state management diperlukan)
      
      await logCommandUsage('riddle', jid);
      
    } catch (error) {
      logger.error('Error in riddle command:', error);
      await sock.sendMessage(message.key.remoteJid!, {
        text: '❌ Terjadi kesalahan saat mengambil teka-teki.'
      });
    }
  }
};
