import { DurableObject } from "cloudflare:workers";
import type { DemoItem, Message, RateLimitState, UserSession, PaginatedMessagesResponse } from '@shared/types';
interface Env {
  id?: string | number;
  [key: string]: unknown;
}export class GlobalDurableObject extends DurableObject {private readonly RATE_LIMIT_INTERVAL_MS = 5000;private readonly MAX_ACTIVE_TOKENS = 100;private readonly TOKEN_EXPIRATION_MS = 30 * 60 * 1000;private activeSessions: Record<string, UserSession> = {};constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      const storedSessions = await this.ctx.storage.get<Record<string, UserSession>>("active_sessions");
      if (storedSessions) {
        this.activeSessions = storedSessions;
      }
      this.cleanupExpiredSessions();
    });
  }
  private async saveSessions(): Promise<void> {
    await this.ctx.storage.put("active_sessions", this.activeSessions);
  }
  private cleanupExpiredSessions(): void {
    const currentTime = Date.now();
    let sessionsChanged = false;
    for (const token in this.activeSessions) {
      const session = this.activeSessions[token];
      if (new Date(session.expiresAt).getTime() < currentTime) {
        delete this.activeSessions[token];
        sessionsChanged = true;
      }
    }
    if (sessionsChanged) {
      this.ctx.storage.put("active_sessions", this.activeSessions);
    }
  }
  async getMessages(limit: number, cursorTimestamp?: string, cursorId?: string): Promise<PaginatedMessagesResponse> {
    const allMessages: Message[] = (await this.ctx.storage.get("unison_messages")) || [];
    // Sort messages: newest first, then by ID for stable ordering
    const sortedMessages = [...allMessages].sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      if (dateA !== dateB) {
        return dateB - dateA; // Newest first
      }
      return b.id.localeCompare(a.id); // Stable sort by ID if timestamps are identical
    });
    let startIndex = 0;
    if (cursorTimestamp && cursorId) {
      // Find the index of the message right after the cursor
      startIndex = sortedMessages.findIndex(
        (msg) =>
          new Date(msg.timestamp).getTime() === new Date(cursorTimestamp).getTime() &&
          msg.id === cursorId
      );
      if (startIndex !== -1) {
        startIndex++; // Start from the next message
      } else {
        startIndex = 0; // Cursor not found, start from beginning
      }
    }
    const paginatedMessages = sortedMessages.slice(startIndex, startIndex + limit);
    const hasMore = (startIndex + limit) < sortedMessages.length;
    let nextCursorTimestamp: string | undefined;
    let nextCursorId: string | undefined;
    if (hasMore) {
      const lastMessage = paginatedMessages[paginatedMessages.length - 1];
      if (lastMessage) {
        nextCursorTimestamp = lastMessage.timestamp;
        nextCursorId = lastMessage.id;
      }
    }
    return {
      messages: paginatedMessages,
      hasMore,
      nextCursorTimestamp,
      nextCursorId,
    };
  }
  async addMessage(text: string, mockSenderId?: string): Promise<Message[]> {
    const messages = await this.getMessages(Infinity).then(res => res.messages); // Fetch all messages for adding
    const newMessage: Message = {
      id: crypto.randomUUID(),
      text: text,
      timestamp: new Date().toISOString(),
      mockSenderId: mockSenderId
    };
    const updatedMessages = [newMessage, ...messages];
    await this.ctx.storage.put("unison_messages", updatedMessages);
    return updatedMessages;
  }
  async checkAndApplyRateLimit(ip: string): Promise<boolean> {
    let rateLimitState: RateLimitState = (await this.ctx.storage.get("rate_limit_state")) || {};
    const currentTime = Date.now();
    const lastRequestTime = rateLimitState[ip];
    if (lastRequestTime && currentTime - lastRequestTime < this.RATE_LIMIT_INTERVAL_MS) {
      return false;
    }
    rateLimitState[ip] = currentTime;
    await this.ctx.storage.put("rate_limit_state", rateLimitState);
    return true;
  }
  async createSession(): Promise<UserSession | null> {
    this.cleanupExpiredSessions();
    if (Object.keys(this.activeSessions).length >= this.MAX_ACTIVE_TOKENS) {
      return null;
    }
    const token = crypto.randomUUID();
    const currentTime = Date.now();
    const expiresAt = new Date(currentTime + this.TOKEN_EXPIRATION_MS).toISOString();
    const createdAt = new Date(currentTime).toISOString();
    const newSession: UserSession = { token, expiresAt, createdAt };
    this.activeSessions[token] = newSession;
    await this.saveSessions();
    return newSession;
  }
  async validateToken(token: string): Promise<boolean> {
    this.cleanupExpiredSessions();
    const session = this.activeSessions[token];
    if (!session) {
      return false;
    }
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      delete this.activeSessions[token];
      await this.saveSessions();
      return false;
    }
    return true;
  }
  async refreshToken(token: string): Promise<UserSession | null> {
    this.cleanupExpiredSessions();
    const session = this.activeSessions[token];
    if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
      return null;
    }
    const newExpiresAt = new Date(Date.now() + this.TOKEN_EXPIRATION_MS).toISOString();
    session.expiresAt = newExpiresAt;
    this.activeSessions[token] = session;
    await this.saveSessions();
    return session;
  }
}