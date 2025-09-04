import { WAMessage, WASocket, downloadContentFromMessage } from '@whiskeysockets/baileys';
import { writeFile, unlink } from 'fs/promises';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';
import { logger } from '../../utils/logger';

const execAsync = promisify(exec);

export const stickerCommand: Command = {
  name: 'sticker',
  description: 'Mengubah gambar/video menjadi stiker',
  usage: '.sticker [reply ke gambar/video]',
  aliases: ['s', 'stiker'],
  category: 'utility',
  
  execute: async (sock: WASocket, message: WAMessage, args: string[]) => {
    try {
      const jid = message.key.remoteJid!;
      
      // Cek apakah ada reply ke media
      if (!message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        await sock.sendMessage(jid, {
          text: '❌ Silakan reply ke gambar atau video yang ingin dijadikan stiker.'
        });
        return;
      }
      
      const quotedMessage = message.message.extendedTextMessage.contextInfo.quotedMessage;
      let buffer: Buffer;
      let isVideo = false;
      
      // Download media
      if (quotedMessage.imageMessage) {
        const stream = await downloadContentFromMessage(quotedMessage.imageMessage, 'image');
        buffer = await streamToBuffer(stream);
      } else if (quotedMessage.videoMessage) {
        const stream = await downloadContentFromMessage(quotedMessage.videoMessage, 'video');
        buffer = await streamToBuffer(stream);
        isVideo = true;
      } else {
        await sock.sendMessage(jid, {
          text: '❌ Hanya support gambar dan video.'
        });
        return;
      }
      
      // Simpan file temporary
      const inputPath = `/tmp/input_${Date.now()}${isVideo ? '.mp4' : '.jpg'}`;
      const outputPath = `/tmp/output_${Date.now()}.webp`;
      
      await writeFile(inputPath, buffer);
      
      // Convert ke webp
      if (isVideo) {
        // Convert video ke webp (gif)
        await execAsync(`ffmpeg -i ${inputPath} -vf "scale=512:512:flags=lanczos" -y ${outputPath}`);
      } else {
        // Convert image ke webp
        await execAsync(`ffmpeg -i ${inputPath} -vf "scale=512:512" -y ${outputPath}`);
      }
      
      // Kirim stiker
      const stickerBuffer = await readFile(outputPath);
      await sock.sendMessage(jid, {
        sticker: stickerBuffer
      });
      
      // Bersihkan file temporary
      await unlink(inputPath);
      await unlink(outputPath);
      
      await logCommandUsage('sticker', jid);
      
    } catch (error) {
      logger.error('Error in sticker command:', error);
      await sock.sendMessage(message.key.remoteJid!, {
        text: '❌ Terjadi kesalahan saat membuat stiker.'
      });
    }
  }
};

async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
        }
