import {
  validateAgentFile,
  validateHookOutput,
  validateHooksConfig,
  validateMCPFile,
  validateSkillFile,
} from '@workspace/utils';
import { Request, Response, Router } from 'express';

const router: Router = Router();

/**
 * POST /api/validate/agent
 * Validate an agent file
 */
router.post('/agent', async (req: Request, res: Response) => {
  try {
    const { content, filename } = req.body;

    if (!content || !filename) {
      return res.status(400).json({
        error: 'Content and filename are required',
      });
    }

    const validation = validateAgentFile(content, filename);

    res.json(validation);
  } catch (error) {
    console.error('Error validating agent:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

/**
 * POST /api/validate/skill
 * Validate a skill file
 */
router.post('/skill', async (req: Request, res: Response) => {
  try {
    const { content, path } = req.body;

    if (!content || !path) {
      return res.status(400).json({
        error: 'Content and path are required',
      });
    }

    const validation = validateSkillFile(content, path);

    res.json(validation);
  } catch (error) {
    console.error('Error validating skill:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

/**
 * POST /api/validate/mcp
 * Validate MCP configuration
 */
router.post('/mcp', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        error: 'Content is required',
      });
    }

    const validation = validateMCPFile(content);

    res.json(validation);
  } catch (error) {
    console.error('Error validating MCP config:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

/**
 * POST /api/validate/hooks
 * Validate hooks configuration
 */
router.post('/hooks', async (req: Request, res: Response) => {
  try {
    const { config, language } = req.body;

    if (!config) {
      return res.status(400).json({
        error: 'Config is required',
      });
    }

    const validation = validateHooksConfig(config, language || 'typescript');

    res.json(validation);
  } catch (error) {
    console.error('Error validating hooks:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

/**
 * POST /api/validate/hook-output
 * Validate hook output schema
 */
router.post('/hook-output', async (req: Request, res: Response) => {
  try {
    const { output } = req.body;

    if (!output) {
      return res.status(400).json({
        error: 'Output is required',
      });
    }

    const validation = validateHookOutput(output);

    res.json(validation);
  } catch (error) {
    console.error('Error validating hook output:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

export default router;
