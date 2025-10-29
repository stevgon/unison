import { DurableObject } from "cloudflare:workers";
import type { DemoItem, Message } from '@shared/types';
import { MOCK_ITEMS } from '@shared/mock-data';
// **DO NOT MODIFY THE CLASS NAME**
export class GlobalDurableObject extends DurableObject {
    async getCounterValue(): Promise<number> {
      const value = (await this.ctx.storage.get("counter_value")) || 0;
      return value as number;
    }
    async increment(amount = 1): Promise<number> {
      let value: number = (await this.ctx.storage.get("counter_value")) || 0;
      value += amount;
      await this.ctx.storage.put("counter_value", value);
      return value;
    }
    async decrement(amount = 1): Promise<number> {
      let value: number = (await this.ctx.storage.get("counter_value")) || 0;
      value -= amount;
      await this.ctx.storage.put("counter_value", value);
      return value;
    }
    async getDemoItems(): Promise<DemoItem[]> {
      const items = await this.ctx.storage.get("demo_items");
      if (items) {
        return items as DemoItem[];
      }
      await this.ctx.storage.put("demo_items", MOCK_ITEMS);
      return MOCK_ITEMS;
    }
    async addDemoItem(item: DemoItem): Promise<DemoItem[]> {
      const items = await this.getDemoItems();
      const updatedItems = [...items, item];
      await this.ctx.storage.put("demo_items", updatedItems);
      return updatedItems;
    }
    async updateDemoItem(id: string, updates: Partial<Omit<DemoItem, 'id'>>): Promise<DemoItem[]> {
      const items = await this.getDemoItems();
      const updatedItems = items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      );
      await this.ctx.storage.put("demo_items", updatedItems);
      return updatedItems;
    }
    async deleteDemoItem(id: string): Promise<DemoItem[]> {
      const items = await this.getDemoItems();
      const updatedItems = items.filter(item => item.id !== id);
      await this.ctx.storage.put("demo_items", updatedItems);
      return updatedItems;
    }
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
    async addMessage(text: string): Promise<Message[]> {
      const messages = await this.getMessages();
      const newMessage: Message = {
        id: crypto.randomUUID(),
        text: text,
        timestamp: new Date().toISOString(),
      };
      const updatedMessages = [newMessage, ...messages]; // Add new message to the top
      await this.ctx.storage.put("unison_messages", updatedMessages);
      return updatedMessages;
    }
}