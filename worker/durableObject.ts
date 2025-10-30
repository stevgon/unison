import { DurableObject } from "cloudflare:workers";
import type { DemoItem, Message } from '@shared/types';
// **DO NOT MODIFY THE CLASS NAME**
export class GlobalDurableObject extends DurableObject {
    // New methods for message board
    async getMessages(): Promise<Message[]> {
      const messages = await this.ctx.storage.get("unison_messages");
      if (messages) {
        return messages as Message[];
      }
      // Initialize with an empty array if no messages exist
      await this.ctx.storage.put("unison_messages", []);
      return [];
    }
    async addMessage(text: string, mockSenderId?: string): Promise<Message[]> {
      const messages = await this.getMessages();
      const newMessage: Message = {
        id: crypto.randomUUID(),
        text: text,
        timestamp: new Date().toISOString(),
        mockSenderId: mockSenderId, // Store the mock sender ID
      };
      const updatedMessages = [newMessage, ...messages]; // Add new message to the top
      await this.ctx.storage.put("unison_messages", updatedMessages);
      return updatedMessages;
    }
}