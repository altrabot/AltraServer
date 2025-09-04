import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { prisma } from '../../index';
import { Command } from '../../types/command';
import { logger } from '../../utils/logger';

export const helpCommand: Command = {
  name: 'help',
  description: 'Menampilkan bantuan perintah',
  usage: '.help [perintah]',
  aliases: ['h', 'bantuan'],
  category: 'core',
  
  execute: async (sock: WASocket, message: WAMessage, args: string[]) => {
    try {
      const jid = message.key.remoteJid!;
      const fromMe = message.key.fromMe;
      
      if (args.length > 0) {
        // Tampilkan detail perintah spesifik
        const commandName = args[0].toLowerCase().replace('.', '');
        const command = CommandHandler.getCommand(commandName);
        
        if (command) {
          const response = `📚 *Bantuan Perintah: ${command.name}*\n\n` +
                         `📖 *Deskripsi:* ${command.description}\n` +
                         `⚡ *Penggunaan:* ${command.usage}\n` +
                         `📂 *Kategori:* ${command.category}\n` +
                         (command.aliases ? `🔤 *Alias:* ${command.aliases.join(', ')}\n` : '');
          
          await sock.sendMessage(jid, { text: response });
        } else {
          await sock.sendMessage(jid, { 
            text: '❌ Perintah tidak ditemukan. Gunakan .allmenu untuk melihat daftar perintah.' 
          });
        }
      } else {
        // Tampilkan daftar kategori
        const categories = CommandHandler.getCategories();
        let response = '🤖 *Daftar Kategori Perintah AltraBot*\n\n';
        
        for (const category of categories) {
          const commands = CommandHandler.getCommandsByCategory(category);
          response += `📂 *${category.toUpperCase()}* (${commands.length} perintah)\n`;
        }
        
        response += '\nℹ️ Gunakan `.help [perintah]` untuk detail perintah spesifik\n';
        response += '📋 Gunakan `.menu [kategori]` untuk melihat perintah dalam kategori\n';
        response += '🌐 Gunakan `.allmenu` untuk melihat semua perintah';
        
        await sock.sendMessage(jid, { text: response });
      }
      
      // Log penggunaan perintah
      if (!fromMe) {
        await logCommandUsage('help', jid);
      }
      
    } catch (error) {
      logger.error('Error in help command:', error);
      await sock.sendMessage(message.key.remoteJid!, {
        text: '❌ Terjadi kesalahan saat memproses perintah help.'
      });
    }
  }
};

async function logCommandUsage(command: string, userJid: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { jid: userJid }
    });
    
    if (user) {
      const usage = await prisma.commandUsage.findUnique({
        where: {
          userId_command: {
            userId: user.id,
            command: command
          }
        }
      });
      
      if (usage) {
        await prisma.commandUsage.update({
          where: { id: usage.id },
          data: { count: { increment: 1 }, lastUsed: new Date() }
        });
      } else {
        await prisma.commandUsage.create({
          data: {
            command: command,
            userId: user.id,
            count: 1
          }
        });
      }
    }
  } catch (error) {
    logger.error('Error logging command usage:', error);
  }
    }
