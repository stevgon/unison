import { DurableObject } from "cloudflare:workers";
import type { DemoItem, Message, RateLimitState } from '@shared/types';
// **DO NOT MODIFY THE CLASS NAME**
export class GlobalDurableObject extends DurableObject {
    private readonly RATE_LIMIT_INTERVAL_MS = 5000; // 5 seconds
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
    async checkAndApplyRateLimit(ip: string): Promise<boolean> {
        let rateLimitState: RateLimitState = await this.ctx.storage.get("rate_limit_state") || {};
        const currentTime = Date.now();
        const lastRequestTime = rateLimitState[ip];
        if (lastRequestTime && (currentTime - lastRequestTime < this.RATE_LIMIT_INTERVAL_MS)) {
            return false; // Rate limited
        }
        rateLimitState[ip] = currentTime;
        await this.ctx.storage.put("rate_limit_state", rateLimitState);
        return true; // Not rate limited, request allowed
    }
}