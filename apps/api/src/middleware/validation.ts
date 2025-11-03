import type { NextFunction, Request, Response } from 'express';
import { body, param, query, validationResult, type ValidationChain } from 'express-validator';
import { type ZodSchema } from 'zod';

/**
 * Validation Middleware Factory
 * Runs express-validator validations and returns errors
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    for (const validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) {
        break;
      }
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Return validation errors
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  };
};

/**
 * Zod Schema Validation Middleware
 * Validates request body, query, or params against a Zod schema
 */
export const validateZod = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof Error && 'errors' in error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error,
        });
      } else {
        res.status(400).json({
          error: 'Validation failed',
          message: error instanceof Error ? error.message : 'Unknown validation error',
        });
      }
    }
  };
};

/**
 * Common Validation Rules
 * Reusable validation chains for common use cases
 */

// Email validation
export const emailValidation = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Must be a valid email address');

// Password validation (strong password)
export const passwordValidation = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage(
    'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  );

// ID validation (UUID)
export const idValidation = (
  field: string = 'id',
  location: 'param' | 'body' | 'query' = 'param',
) => {
  const validator =
    location === 'param' ? param(field) : location === 'body' ? body(field) : query(field);
  return validator.isUUID().withMessage(`${field} must be a valid UUID`);
};

// Pagination validation
export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),
];

// File upload validation
export const fileUploadValidation = (
  maxSize: number = 10 * 1024 * 1024, // 10MB default
  allowedMimeTypes: string[] = ['image/jpeg', 'image/png', 'image/gif'],
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Type guard for multer file properties
    const file =
      (req as any).file ||
      ((req as any).files && Array.isArray((req as any).files)
        ? (req as any).files[0]
        : (req as any).files);

    if (!file) {
      return next();
    }

    // Check file size
    if (file.size && file.size > maxSize) {
      res.status(400).json({
        error: 'File too large',
        message: `File size must not exceed ${maxSize / 1024 / 1024}MB`,
      });
      return;
    }

    // Check MIME type
    if (file.mimetype && !allowedMimeTypes.includes(file.mimetype)) {
      res.status(400).json({
        error: 'Invalid file type',
        message: `File must be one of: ${allowedMimeTypes.join(', ')}`,
      });
      return;
    }

    next();
  };
};

/**
 * Sanitization Middleware
 * Removes potentially dangerous characters from inputs
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Recursively sanitize objects
  const sanitize = (obj: unknown): any => {
    if (typeof obj === 'string') {
      // Remove null bytes and control characters
      return obj.replace(/\0/g, '').replace(/[\x00-\x1F\x7F]/g, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitize(req.body) as any;
  req.query = sanitize(req.query) as any;
  req.params = sanitize(req.params) as any;

  next();
};
