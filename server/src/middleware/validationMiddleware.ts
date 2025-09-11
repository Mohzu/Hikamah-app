import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodTypeAny) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      const errorMessage = error.errors.map((err: any) => err.message).join(', ');
      return res.status(400).json({ message: errorMessage });
    }
  };
