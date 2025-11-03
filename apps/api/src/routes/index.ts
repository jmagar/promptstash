import { Router } from 'express';
import { globalRateLimit } from '../middleware/rate-limit';
import webVitalsRoutes from './analytics/web-vitals.routes';
import fileRoutes from './file.routes';
import folderRoutes from './folder.routes';
import stashRoutes from './stash.routes';
import tagRoutes from './tag.routes';
import userRoutes from './user.routes';
import validateRoutes from './validate.routes';

/**
 * Main API Router
 * All routes defined here are prefixed with /api
 */
const router: Router = Router();

/**
 * Apply global rate limiting to all API routes
 * This prevents abuse and ensures fair usage across all endpoints
 */
router.use(globalRateLimit);

/**
 * User Routes
 * Mounted at: /api/users
 * Handles all user-related endpoints
 */
router.use('/users', userRoutes);

/**
 * File Routes
 * Mounted at: /api/files
 * Handles file CRUD operations
 */
router.use('/files', fileRoutes);

/**
 * Stash Routes
 * Mounted at: /api/stashes
 * Handles stash (container) operations
 */
router.use('/stashes', stashRoutes);

/**
 * Folder Routes
 * Mounted at: /api/folders
 * Handles folder CRUD operations
 */
router.use('/folders', folderRoutes);

/**
 * Validation Routes
 * Mounted at: /api/validate
 * Handles validation for various file types
 */
router.use('/validate', validateRoutes);

/**
 * Tag Routes
 * Mounted at: /api/tags
 * Handles tag CRUD operations
 */
router.use('/tags', tagRoutes);

/**
 * Analytics Routes
 * Mounted at: /api/analytics
 * Handles analytics and metrics collection
 */
router.use('/analytics', webVitalsRoutes);

export default router;
