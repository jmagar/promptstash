import { z } from 'zod';

/**
 * Hooks Configuration Schema
 *
 * Validates hook configurations for Claude Code
 * Hooks are event-driven callbacks that execute at specific points in the workflow
 *
 * @see https://docs.claude.com/en/docs/claude-code/hooks-guide.md
 */

// Hook event types
export const HOOK_EVENT_TYPES = [
  'PreToolUse',
  'PostToolUse',
  'PostCustomToolCall',
  'SessionStart',
  'SessionEnd',
  'UserPromptSubmit',
  'Notification',
  'Stop',
  'SubagentStop',
  'PreCompact',
] as const;

// Events that require a matcher
export const MATCHER_REQUIRED_EVENTS = [
  'PreToolUse',
  'PostToolUse',
  'PostCustomToolCall',
  'PreCompact',
] as const;

// Python SDK supported events (7 out of 11)
export const PYTHON_SUPPORTED_EVENTS = [
  'PreToolUse',
  'PostToolUse',
  'PostCustomToolCall',
  'UserPromptSubmit',
  'Stop',
  'SubagentStop',
  'PreCompact',
] as const;

// Pattern types for matchers
export type MatcherPatternType = 'exact' | 'regex' | 'wildcard' | 'mcp';

// Hook types
export type HookType = 'command' | 'prompt';

// Individual hook configuration
const hookConfigSchema = z.object({
  type: z.enum(['command', 'prompt']).describe('Hook type: command or prompt'),
  command: z.string().optional().describe('Path to executable script (for command type)'),
  prompt: z.string().optional().describe('Inline prompt content (for prompt type)'),
  timeout: z.number().int().positive().optional().default(5000).describe('Timeout in milliseconds'),
});

// Matcher configuration
const matcherConfigSchema = z.object({
  matcher: z.string().describe('Pattern to match tools (exact, regex, wildcard)'),
  hooks: z.array(hookConfigSchema),
});

// Hook output schema (what hooks must return)
export const hookOutputSchema = z.object({
  continue: z.boolean().describe('Whether to continue execution'),
  stopReason: z.string().optional().describe('Reason for stopping (required if continue=false)'),
  suppressOutput: z.boolean().optional().describe('Hide hook output from user'),
  decision: z.enum(['approve', 'block', 'ask']).optional().describe('Permission decision'),
  hookSpecificOutput: z
    .object({
      permissionDecision: z.enum(['allow', 'deny', 'ask']).optional(),
      updatedInput: z.record(z.any()).optional(),
      updatedOutput: z.record(z.any()).optional(),
      additionalContext: z.string().optional(),
    })
    .optional(),
});

// Full hooks configuration
export const hooksConfigSchema = z.record(z.enum(HOOK_EVENT_TYPES), z.array(matcherConfigSchema));

export type HookConfig = z.infer<typeof hookConfigSchema>;
export type MatcherConfig = z.infer<typeof matcherConfigSchema>;
export type HooksConfig = z.infer<typeof hooksConfigSchema>;
export type HookOutput = z.infer<typeof hookOutputSchema>;

/**
 * Validates a matcher pattern
 */
export function validateMatcherPattern(pattern: string): {
  valid: boolean;
  errors: string[];
  patternType: MatcherPatternType;
} {
  const errors: string[] = [];
  let patternType: MatcherPatternType = 'exact';

  // Check if MCP tool pattern
  if (pattern.startsWith('mcp__')) {
    patternType = 'mcp';

    // MCP tools don't support wildcards
    if (pattern.includes('*')) {
      errors.push('MCP tool patterns do not support wildcards');
    }

    return { valid: errors.length === 0, errors, patternType };
  }

  // Check if wildcard pattern
  if (pattern.includes('*')) {
    patternType = 'wildcard';

    // Only suffix wildcards allowed (e.g., Bash(**))
    if (!pattern.endsWith('(**)') && !pattern.endsWith('(*)')) {
      errors.push('Wildcard patterns only support suffix wildcards (e.g., Bash(**))');
    }

    return { valid: errors.length === 0, errors, patternType };
  }

  // Check if regex pattern (contains |)
  if (pattern.includes('|')) {
    patternType = 'regex';

    try {
      new RegExp(pattern);
    } catch (error) {
      errors.push(
        `Invalid regex pattern: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return { valid: errors.length === 0, errors, patternType };
  }

  // Exact match
  return { valid: true, errors, patternType: 'exact' };
}

/**
 * Validates hooks configuration
 */
export function validateHooksConfig(
  config: unknown,
  language: 'typescript' | 'python' = 'typescript',
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const result = hooksConfigSchema.safeParse(config);

    if (!result.success) {
      errors.push(...result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`));
      return { valid: false, errors, warnings };
    }

    // Additional validation
    for (const [eventType, matchers] of Object.entries(result.data)) {
      // Check Python SDK compatibility
      if (language === 'python') {
        const isPythonSupported = PYTHON_SUPPORTED_EVENTS.includes(
          eventType as (typeof PYTHON_SUPPORTED_EVENTS)[number],
        );
        if (!isPythonSupported) {
          errors.push(`Event type '${eventType}' is not supported in Python SDK`);
        }
      }

      // Validate matchers
      for (const matcherConfig of matchers) {
        // Check if matcher is required for this event type
        const matcherRequired = MATCHER_REQUIRED_EVENTS.includes(
          eventType as (typeof MATCHER_REQUIRED_EVENTS)[number],
        );

        if (matcherRequired && !matcherConfig.matcher) {
          errors.push(`Event type '${eventType}' requires a matcher`);
        }

        // Validate matcher pattern
        if (matcherConfig.matcher) {
          const patternValidation = validateMatcherPattern(matcherConfig.matcher);
          if (!patternValidation.valid) {
            errors.push(
              `Event '${eventType}', matcher '${matcherConfig.matcher}': ${patternValidation.errors.join(', ')}`,
            );
          }
        }

        // Validate hook configs
        for (const hook of matcherConfig.hooks) {
          if (hook.type === 'command' && !hook.command) {
            errors.push(`Event '${eventType}': Command type hook must have 'command' field`);
          }

          if (hook.type === 'prompt' && !hook.prompt) {
            errors.push(`Event '${eventType}': Prompt type hook must have 'prompt' field`);
          }

          if (hook.timeout && hook.timeout < 100) {
            warnings.push(
              `Event '${eventType}': Timeout ${hook.timeout}ms is very low, may cause issues`,
            );
          }

          if (hook.timeout && hook.timeout > 30000) {
            warnings.push(`Event '${eventType}': Timeout ${hook.timeout}ms is very high (>30s)`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { valid: false, errors, warnings };
  }
}

/**
 * Validates hook output (what a hook script returns)
 */
export function validateHookOutput(output: unknown): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const result = hookOutputSchema.safeParse(output);

    if (!result.success) {
      errors.push(...result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`));
      return { valid: false, errors, warnings };
    }

    // Additional validation
    if (!result.data.continue && !result.data.stopReason) {
      errors.push('stopReason is required when continue=false');
    }

    if (result.data.continue && result.data.stopReason) {
      warnings.push('stopReason provided but continue=true (stopReason will be ignored)');
    }

    return { valid: errors.length === 0, errors, warnings };
  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { valid: false, errors, warnings };
  }
}

/**
 * Generate example hooks configuration
 */
export function generateHooksExample(): HooksConfig {
  return {
    PreToolUse: [
      {
        matcher: 'Bash',
        hooks: [
          {
            type: 'command',
            command: './scripts/validate-bash.sh',
            timeout: 5000,
          },
        ],
      },
    ],
    PostToolUse: [
      {
        matcher: 'Edit',
        hooks: [
          {
            type: 'command',
            command: './scripts/format-code.sh',
            timeout: 10000,
          },
        ],
      },
    ],
    UserPromptSubmit: [
      {
        matcher: '',
        hooks: [
          {
            type: 'prompt',
            prompt: 'Inject project context from documentation',
            timeout: 3000,
          },
        ],
      },
    ],
  };
}
