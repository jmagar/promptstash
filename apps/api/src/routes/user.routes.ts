import express, { type Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router: Router = express.Router();

/**
 * @openapi
 * /api/user/session:
 *   get:
 *     tags:
 *       - User
 *     summary: Get current authenticated user session
 *     description: |
 *       Retrieves the current authenticated user's session information.
 *
 *       Security layers:
 *       1. Global rate limit (100 req/min by IP) - Applied at /api level
 *       2. Authentication check - Validates session
 *
 *       Note: Rate limiting is applied at the /api level BEFORE this route,
 *       which protects against brute force and DoS attacks on auth endpoints.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved session information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too Many Requests - Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/session', requireAuth, (req, res) => {
  res.json({
    user: req.user,
    session: req.session,
  });
});

export default router;
