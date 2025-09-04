import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import axios from 'axios';
import { isPremium } from '../../middleware/auth';
import { logger } from '../../utils/logger';

export const aiCommand: Command = {
  name: 'ai',
  description: 'Chat dengan AI (hanya premium)',
  usage: '.ai [pertanyaan]',
  aliases: ['chatgpt', 'gpt'],
  category: 'premium',
  premiumOnly: true,
  
  execute: async (sock: WASocket, message: WAMessage, args: string[]) => {
    try {
      const jid = message.key.remoteJid!;
      const userJid = message.key.participant || message.key.remoteJid!;
      
      if (args.length === 0) {
        await sock.sendMessage(jid, {
          text: '❌ Silakan berikan pertanyaan untuk AI.\nContoh: .ai Jelaskan tentang machine learning'
        });
        return;
      }
      
      // Cek status premium
      const premium = await isPremium(userJid);
      if (!premium) {
        await sock.sendMessage(jid, {
          text: '❌ Fitur ini hanya untuk member premium. Ketik .premium untuk info lebih lanjut.'
        });
        return;
      }
      
      const question = args.join(' ');
      await sock.sendMessage(jid, {
        text: '🤖 AI sedang memproses pertanyaan Anda...'
      });
      
      // Gunakan API AI (contoh menggunakan OpenAI-style API)
      const response = await callAI(question);
      
      // Potong response jika terlalu panjang
      const maxLength = 4000;
      const aiResponse = response.length > maxLength 
        ? response.substring(0, maxLength) + '...' 
        : response;
      
      await sock.sendMessage(jid, {
        text: `🤖 *AI Response*\n\n${aiResponse}`
      });
      
      await logCommandUsage('ai', jid);
      
    } catch (error) {
      logger.error('Error in ai command:', error);
      await sock.sendMessage(message.key.remoteJid!, {
        text: '❌ Terjadi kesalahan saat memproses permintaan AI.'
      });
    }
  }
};

async function callAI(prompt: string): Promise<string> {
  // Implementasi sebenarnya menggunakan API AI
  // Ini adalah contoh menggunakan layanan gratis
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.choices[0].message.content;
  } catch (error) {
    // Fallback ke layanan gratis jika API premium error
    const fallbackResponse = await axios.get(`https://api.azz.biz.id/api/simi?q=${encodeURIComponent(prompt)}`);
    return fallbackResponse.data.response;
  }
        }
