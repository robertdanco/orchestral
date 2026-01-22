// Chat API routes

import { Router, Request, Response } from 'express';
import { ChatService } from './service.js';
import type { ChatRequest, StreamEvent } from './types.js';

export function createChatRouter(chatService: ChatService): Router {
  const router = Router();

  // POST /api/chat - Send a message and get response
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { sessionId, message } = req.body as ChatRequest;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'message is required' });
        return;
      }

      const response = await chatService.chat(message, sessionId);
      res.json(response);
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Chat failed',
      });
    }
  });

  // POST /api/chat/stream - Send a message and stream response via SSE
  router.post('/stream', async (req: Request, res: Response) => {
    try {
      const { sessionId, message } = req.body as ChatRequest;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'message is required' });
        return;
      }

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Send events as they occur
      const sendEvent = (event: StreamEvent) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      };

      try {
        for await (const event of chatService.chatStream(message, sessionId)) {
          sendEvent(event);
        }
      } catch (streamError) {
        sendEvent({
          type: 'error',
          data: {
            error:
              streamError instanceof Error
                ? streamError.message
                : 'Stream failed',
          },
        });
      }

      res.end();
    } catch (error) {
      console.error('Chat stream error:', error);
      // If headers haven't been sent, send error response
      if (!res.headersSent) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Chat stream failed',
        });
      }
    }
  });

  // GET /api/chat/sources - List available knowledge sources
  router.get('/sources', async (_req: Request, res: Response) => {
    try {
      const sources = await chatService.getAvailableSourcesFiltered();
      res.json({ sources });
    } catch (error) {
      console.error('Sources error:', error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to get sources',
      });
    }
  });

  // GET /api/chat/session/:id - Get session history
  router.get('/session/:id', (req: Request, res: Response) => {
    const session = chatService.getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json(session);
  });

  // DELETE /api/chat/session/:id - Delete a session
  router.delete('/session/:id', (req: Request, res: Response) => {
    const deleted = chatService.deleteSession(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json({ deleted: true });
  });

  return router;
}
