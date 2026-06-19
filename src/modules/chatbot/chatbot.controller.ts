import { Request, Response, NextFunction } from 'express';
import { chatbotService } from './chatbot.service';
import { ok } from '../../lib/response';
import { ChatMessageInput } from './chatbot.schema';

export const chatbotController = {
  message: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as ChatMessageInput;
      const result = await chatbotService.ask(input);
      ok(res, result);
    } catch (err) {
      next(err);
    }
  },
};
