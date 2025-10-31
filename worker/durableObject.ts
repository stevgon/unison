import { DurableObject } from "cloudflare:workers";
import type { DemoItem, Message, RateLimitState, UserSession } from '@shared/types';


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

  async getMessages(): Promise<Message[]> {
    const messages = await this.ctx.storage.get("unison_messages");
    if (messages) {
      return messages as Message[];
    }

    await this.ctx.storage.put("unison_messages", []);
    return [];
  }
  async addMessage(text: string, mockSenderId?: string): Promise<Message[]> {
    const messages = await this.getMessages();
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