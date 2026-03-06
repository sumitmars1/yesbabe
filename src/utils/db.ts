import Dexie, { Table } from 'dexie';
import { ChatMessage } from '@/types/chat';

export class MySubClassedDexie extends Dexie {
  chat_messages!: Table<ChatMessage>; 

  constructor() {
    super('ai_chat_db');
    this.version(1).stores({
      chat_messages: '++id, companionId, content, role, create_time, update_time, message_id, is_deleted, user_id' // 主键和索引
    });
  }
}

export const db = new MySubClassedDexie();