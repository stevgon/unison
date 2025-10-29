import { Hono } from "hono";
import { Env } from './core-utils';
import type { DemoItem, ApiResponse, Message } from '@shared/types';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.get('/api/test', (c) => c.json({ success: true, data: { name: 'CF Workers Demo' }}));
    // Demo items endpoint using Durable Object storage
    app.get('/api/demo', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.getDemoItems();
        return c.json({ success: true, data } satisfies ApiResponse<DemoItem[]>);
    });
    // Counter using Durable Object
    app.get('/api/counter', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.getCounterValue();
        return c.json({ success: true, data } satisfies ApiResponse<number>);
    });
    app.post('/api/counter/increment', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.increment();
        return c.json({ success: true, data } satisfies ApiResponse<number>);
    });
    // Demo item management endpoints
    app.post('/api/demo', async (c) => {
        const body = await c.req.json() as DemoItem;
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.addDemoItem(body);
        return c.json({ success: true, data } satisfies ApiResponse<DemoItem[]>);
    });
    app.put('/api/demo/:id', async (c) => {
        const id = c.req.param('id');
        const body = await c.req.json() as Partial<Omit<DemoItem, 'id'>>;
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.updateDemoItem(id, body);
        return c.json({ success: true, data } satisfies ApiResponse<DemoItem[]>);
    });
    app.delete('/api/demo/:id', async (c) => {
        const id = c.req.param('id');
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.deleteDemoItem(id);
        return c.json({ success: true, data } satisfies ApiResponse<DemoItem[]>);
    });
    // New routes for Unison message board
    app.get('/api/messages', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const messages = await durableObjectStub.getMessages();
        return c.json({ success: true, data: messages } satisfies ApiResponse<Message[]>);
    });
    app.post('/api/messages', async (c) => {
        try {
            const { text } = await c.req.json() as { text: string };
            if (!text || text.trim() === '') {
                return c.json({ success: false, error: 'Message text cannot be empty.' }, 400);
            }
            const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
            const messages = await durableObjectStub.addMessage(text.trim());
            return c.json({ success: true, data: messages } satisfies ApiResponse<Message[]>);
        } catch (error) {
            console.error('Error adding message:', error);
            return c.json({ success: false, error: 'Failed to add message.' }, 500);
        }
    });
}