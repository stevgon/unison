import { DurableObject } from "cloudflare:workers";
import type { DemoItem, Message, RateLimitState, UserSession } from '@shared/types';
// **DO NOT MODIFY THE CLASS NAME**
export class GlobalDurableObject extends DurableObject {
    private readonly RATE_LIMIT_INTERVAL_MS = 5000; // 5 seconds
    private readonly MAX_ACTIVE_TOKENS = 100; // Maximum number of active user sessions
    private readonly TOKEN_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes
    private activeSessions: Record<string, UserSession> = {}; // In-memory cache for active sessions
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
        this.ctx.blockConcurrencyWhile(async () => {
            const storedSessions = await this.ctx.storage.get<Record<string, UserSession>>("active_sessions");
            if (storedSessions) {
                this.activeSessions = storedSessions;
            }
            this.cleanupExpiredSessions(); // Clean up on load
        });
    }
    // Helper to persist active sessions to storage
    private async saveSessions(): Promise<void> {
        await this.ctx.storage.put("active_sessions", this.activeSessions);
    }
    // Helper to remove expired sessions from the in-memory cache and storage
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
            // Only save if changes were made
            this.ctx.storage.put("active_sessions", this.activeSessions);
        }
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
    // New methods for user session and token management
    async createSession(): Promise<UserSession | null> {
        this.cleanupExpiredSessions(); // Ensure current sessions are valid
        if (Object.keys(this.activeSessions).length >= this.MAX_ACTIVE_TOKENS) {
            return null; // Max active tokens reached
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
        this.cleanupExpiredSessions(); // Ensure current sessions are valid
        const session = this.activeSessions[token];
        if (!session) {
            return false; // Token not found
        }
        if (new Date(session.expiresAt).getTime() < Date.now()) {
            // Token found but expired, remove it
            delete this.activeSessions[token];
            await this.saveSessions();
            return false;
        }
        return true; // Token is valid
    }
    async refreshToken(token: string): Promise<UserSession | null> {
        this.cleanupExpiredSessions(); // Ensure current sessions are valid
        const session = this.activeSessions[token];
        if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
            return null; // Token invalid or expired
        }
        const newExpiresAt = new Date(Date.now() + this.TOKEN_EXPIRATION_MS).toISOString();
        session.expiresAt = newExpiresAt;
        this.activeSessions[token] = session; // Update in-memory cache
        await this.saveSessions(); // Persist the updated session
        return session;
    }
}