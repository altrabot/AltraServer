import { proto } from '@whiskeysockets/baileys';

export interface Command {
  name: string;
  description: string;
  category: string;
  usage: string;
  aliases?: string[];
  execute: (sock: any, message: proto.IWebMessageInfo, args: string[]) => Promise<void>;
}

// Import semua command handlers
export * from './core';
export * from './utility';
export * from './downloader';
export * from './games';
export * from './rpg';
export * from './tebak';
export * from './fun';
export * from './admin';
export * from './premium';
export * from './owner';

export const commands = new Map<string, Command>();
