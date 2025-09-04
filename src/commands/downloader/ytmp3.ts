import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import axios from 'axios';
import { createWriteStream } from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { logger } from '../../utils/logger';

const pipelineAsync = promisify(pipeline);

export const ytmp3Command: Command = {
  name: 'ytmp3',
  description: 'Mengunduh audio dari YouTube',
  usage: '.ytmp3 [url|query]',
  aliases: ['ytaudio', 'youtubemp3'],
  category: 'downloader',
  
  execute: async (sock: WASocket, message: WAMessage, args: string[]) => {
    try {
      const jid = message.key.remoteJid!;
      
      if (args.length === 0) {
        await sock.sendMessage(jid, {
          text: '❌ Silakan berikan URL YouTube atau query pencarian.\nContoh: .ytmp3 https://youtube.com/watch?v=...'
        });
        return;
      }
      
      const query = args.join(' ');
      await sock.sendMessage(jid, {
        text: '⏳ Sedang mengunduh audio YouTube...'
      });
      
      // Gunakan API y2mate atau similar (implementasi sebenarnya)
      const audioInfo = await downloadYTAudio(query);
      
      if (!audioInfo) {
        await sock.sendMessage(jid, {
          text: '❌ Gagal mengunduh audio. Pastikan URL valid.'
        });
        return;
      }
      
      // Kirim audio
      await sock.sendMessage(jid, {
        audio: { url: audioInfo.url },
        mimetype: 'audio/mpeg',
        fileName: `${audioInfo.title}.mp3`
      });
      
      await logCommandUsage('ytmp3', jid);
      
    } catch (error) {
      logger.error('Error in ytmp3 command:', error);
      await sock.sendMessage(message.key.remoteJid!, {
        text: '❌ Terjadi kesalahan saat mengunduh audio YouTube.'
      });
    }
  }
};

async function downloadYTAudio(query: string): Promise<{ url: string; title: string } | null> {
  // Implementasi sebenarnya menggunakan y2mate API atau similar
  // Ini adalah contoh implementasi
  try {
    // Cek jika query adalah URL
    const isUrl = query.match(/youtube\.com|youtu\.be/);
    
    if (isUrl) {
      // Extract video ID dari URL
      const videoId = extractYoutubeId(query);
      if (!videoId) return null;
      
      // Gunakan API untuk mendapatkan download link
      const response = await axios.get(`https://y2mate.ai/api/convert/${videoId}`);
      
      if (response.data && response.data.audio) {
        return {
          url: response.data.audio.url,
          title: response.data.title
        };
      }
    } else {
      // Search video pertama
      const searchResponse = await axios.get(`https://y2mate.ai/api/search/${encodeURIComponent(query)}`);
      
      if (searchResponse.data && searchResponse.data.videos && searchResponse.data.videos.length > 0) {
        const firstVideo = searchResponse.data.videos[0];
        const videoId = firstVideo.id;
        
        // Dapatkan download link
        const convertResponse = await axios.get(`https://y2mate.ai/api/convert/${videoId}`);
        
        if (convertResponse.data && convertResponse.data.audio) {
          return {
            url: convertResponse.data.audio.url,
            title: convertResponse.data.title
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    logger.error('Error downloading YouTube audio:', error);
    return null;
  }
}

function extractYoutubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
          }
