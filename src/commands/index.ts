import { proto } from '@whiskeysockets/baileys';

export interface Command {
  name: string;
  description: string;
  category: string;
  usage: string;
  aliases?: string[];
  execute: (sock: any, message: proto.IWebMessageInfo, args: string[]) => Promise<void>;
}

export const commands = new Map<string, Command>();

// Import dan register semua commands
import { coreCommands } from './core';
import { utilityCommands } from './utility';

// Register commands
[...coreCommands, ...utilityCommands].forEach(cmd => {
  commands.set(cmd.name, cmd);
  
  // Register aliases jika ada
  if (cmd.aliases) {
    cmd.aliases.forEach(alias => {
      commands.set(alias, cmd);
    });
  }
});

// Helper function untuk mendapatkan command
export function getCommand(name: string): Command | undefined {
  return commands.get(name);
}

export function getAllCommands(): Command[] {
  return Array.from(commands.values());
}

export function getCommandsByCategory(category: string): Command[] {
  return getAllCommands().filter(cmd => cmd.category === category);
}
