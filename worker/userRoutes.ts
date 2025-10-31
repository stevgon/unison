import { Hono } from "hono";
import { Env } from './core-utils';
import type { ApiResponse, Message, UserSession, PaginatedMessagesResponse } from '@shared/types';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // New routes for Unison message board
    app.get('/api/messages', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const limit = parseInt(c.req.query('limit') || '20', 10); // Default limit to 20
        const cursorTimestamp = c.req.query('cursorTimestamp');
        const cursorId = c.req.query('cursorId');
        const paginatedResponse = await durableObjectStub.getMessages(limit, cursorTimestamp, cursorId);
        return c.json({ success: true, data: paginatedResponse } satisfies ApiResponse<PaginatedMessagesResponse>);
    });
    app.post('/api/messages', async (c) => {
        try {
            const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
            // 1. Extract and validate token
            const authHeader = c.req.header('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return c.json({ success: false, error: 'Authorization token required.' }, 401);
            }
            const token = authHeader.substring(7); // Remove "Bearer " prefix
            const isTokenValid = await durableObjectStub.validateToken(token);
            if (!isTokenValid) {
                return c.json({ success: false, error: 'Invalid or expired token. Please refresh your session.' }, 401);
            }
            // 2. Rate limiting (only if token is valid)
            const clientIp = c.req.raw.headers.get('CF-Connecting-IP');
            if (!clientIp) {
                console.warn('CF-Connecting-IP header missing.');
                return c.json({ success: false, error: 'Could not determine client IP for rate limiting.' }, 400);
            }
            const isAllowed = await durableObjectStub.checkAndApplyRateLimit(clientIp);
            if (!isAllowed) {
                console.warn(`Rate limit hit for IP: ${clientIp}`);
                return c.json({ success: false, error: 'Too many requests. Please wait a moment before posting again.' }, 429);
            }
            // 3. Process message submission
            const { text, mockSenderId } = await c.req.json() as { text: string; mockSenderId?: string };
            if (!text || text.trim() === '') {
                return c.json({ success: false, error: 'Message text cannot be empty.' }, 400);
            }
            const messages = await durableObjectStub.addMessage(text.trim(), mockSenderId);
            return c.json({ success: true, data: messages } satisfies ApiResponse<Message[]>);
        } catch (error) {
            console.error('Error adding message:', error);
            return c.json({ success: false, error: 'Failed to add message.' }, 500);
        }
    });
    // New endpoint to request a user token
    app.post('/api/token', async (c) => {
        try {
            const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
            const session = await durableObjectStub.createSession();
            if (session) {
                return c.json({ success: true, data: session } satisfies ApiResponse<UserSession>);
            } else {
                return c.json({ success: false, error: 'Maximum active sessions reached. Please try again later.' }, 429);
            }
        } catch (error) {
            console.error('Error creating session:', error);
            return c.json({ success: false, error: 'Failed to create session.' }, 500);
        }
    });
    // New endpoint to refresh a user token
    app.post('/api/token/refresh', async (c) => {
        try {
            const { token } = await c.req.json() as { token: string };
            if (!token) {
                return c.json({ success: false, error: 'Token is required for refresh.' }, 400);
            }
            const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
            const updatedSession = await durableObjectStub.refreshToken(token);
            if (updatedSession) {
                return c.json({ success: true, data: updatedSession } satisfies ApiResponse<UserSession>);
            } else {
                return c.json({ success: false, error: 'Invalid or expired token. Please request a new session.' }, 401);
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
            return c.json({ success: false, error: 'Failed to refresh token.' }, 500);
        }
    });
}