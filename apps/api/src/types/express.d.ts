import { type Session } from '@workspace/auth';
import type { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      session?: Session | null;
      user?: Session['user'] | null;
    }
  }
}

/**
 * Type for Request objects after requireAuth middleware
 * This ensures TypeScript knows that user is guaranteed to exist
 */
export interface AuthenticatedRequest extends Request {
  user: NonNullable<Session['user']>;
  session: Session;
}
