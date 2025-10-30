import { Hono } from "hono";
import { Env } from './core-utils';
import type { ApiResponse, Message } from '@shared/types';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // New routes for Unison message board
    app.get('/api/messages', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const messages = await durableObjectStub.getMessages();
        return c.json({ success: true, data: messages } satisfies ApiResponse<Message[]>);
    });
    app.post('/api/messages', async (c) => {
        try {
            const { text, mockSenderId } = await c.req.json() as { text: string; mockSenderId?: string }; // Extract mockSenderId
            if (!text || text.trim() === '') {
                return c.json({ success: false, error: 'Message text cannot be empty.' }, 400);
            }
            const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
            const messages = await durableObjectStub.addMessage(text.trim(), mockSenderId); // Pass mockSenderId to DO
            return c.json({ success: true, data: messages } satisfies ApiResponse<Message[]>);
        } catch (error) {
            console.error('Error adding message:', error);
            return c.json({ success: false, error: 'Failed to add message.' }, 500);
        }
    });
}