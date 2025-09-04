import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { logger } from '../../utils/logger';

export const rpsCommand: Command = {
  name: 'rps',
  description: 'Bermain batu gunting kertas',
  usage: '.rps [batu|gunting|kertas]',
  aliases: ['suit', 'batu-gunting-kertas'],
  category: 'games',
  
  execute: async (sock: WASocket, message: WAMessage, args: string[]) => {
    try {
      const jid = message.key.remoteJid!;
      
      if (args.length === 0) {
        await sock.sendMessage(jid, {
          text: '❌ Silakan pilih: batu, gunting, atau kertas.\nContoh: .rps batu'
        });
        return;
      }
      
      const playerChoice = args[0].toLowerCase();
      const choices = ['batu', 'gunting', 'kertas'];
      
      if (!choices.includes(playerChoice)) {
        await sock.sendMessage(jid, {
          text: '❌ Pilihan tidak valid. Gunakan: batu, gunting, atau kertas.'
        });
        return;
      }
      
      // Bot memilih secara random
      const botChoice = choices[Math.floor(Math.random() * choices.length)];
      
      // Tentukan pemenang
      let result: string;
      if (playerChoice === botChoice) {
        result = 'Seri!';
      } else if (
        (playerChoice === 'batu' && botChoice === 'gunting') ||
        (playerChoice === 'gunting' && botChoice === 'kertas') ||
        (playerChoice === 'kertas' && botChoice === 'batu')
      ) {
        result = 'Kamu menang! 🎉';
      } else {
        result = 'Bot menang! 🤖';
      }
      
      // Kirim hasil
      const response = `🎮 *Batu Gunting Kertas*\n\n` +
                     `Kamu: ${getEmoji(playerChoice)} ${playerChoice}\n` +
                     `Bot: ${getEmoji(botChoice)} ${botChoice}\n\n` +
                     `*Hasil:* ${result}`;
      
      await sock.sendMessage(jid, { text: response });
      await logCommandUsage('rps', jid);
      
    } catch (error) {
      logger.error('Error in rps command:', error);
      await sock.sendMessage(message.key.remoteJid!, {
        text: '❌ Terjadi kesalahan saat bermain RPS.'
      });
    }
  }
};

function getEmoji(choice: string): string {
  switch (choice) {
    case 'batu': return '🪨';
    case 'gunting': return '✂️';
    case 'kertas': return '📄';
    default: return '';
  }
    }
