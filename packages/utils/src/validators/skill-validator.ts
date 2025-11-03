import { z } from 'zod';
import { parseSimpleYaml } from './yaml-parser';

/**
 * Skill YAML Frontmatter Schema
 *
 * Validates YAML frontmatter for Claude Code skill files (.claude/skills/SKILL_NAME/SKILL.md)
 *
 * Skills require a subdirectory structure with SKILL.md file inside
 * Optional: reference.md and scripts/ subdirectory
 *
 * @see https://docs.claude.com/en/docs/claude-code/skills.md
 */

export const skillFrontmatterSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less'),
});

export type SkillFrontmatter = z.infer<typeof skillFrontmatterSchema>;

/**
 * Validates skill directory name (must be kebab-case)
 */
export function validateSkillDirectoryName(dirName: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check kebab-case
  const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!kebabCaseRegex.test(dirName)) {
    errors.push(
      'Skill directory name must be kebab-case (lowercase with hyphens, e.g., code-review)',
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates skill file structure
 * Skills must be in a subdirectory: .claude/skills/skill-name/SKILL.md
 */
export function validateSkillPath(path: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if path ends with SKILL.md
  if (!path.endsWith('SKILL.md')) {
    errors.push('Skill file must be named SKILL.md (uppercase)');
  }

  // Check if in a subdirectory
  const pathParts = path.split('/');
  if (pathParts.length < 2) {
    errors.push('Skill file must be in a subdirectory (e.g., .claude/skills/code-review/SKILL.md)');
  } else {
    // Validate directory name
    const dirName = pathParts[pathParts.length - 2] || '';
    const dirValidation = validateSkillDirectoryName(dirName);
    if (!dirValidation.valid) {
      errors.push(...dirValidation.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates full skill file (frontmatter + content)
 */
export function validateSkillFile(
  content: string,
  path: string,
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  frontmatter?: SkillFrontmatter;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate path
  const pathValidation = validateSkillPath(path);
  if (!pathValidation.valid) {
    errors.push(...pathValidation.errors);
  }
  warnings.push(...pathValidation.warnings);

  // Extract YAML frontmatter
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    errors.push('Skill file must start with YAML frontmatter (--- ... ---)');
    return { valid: false, errors, warnings };
  }

  try {
    // Parse YAML (simple implementation)
    const yamlContent = match[1] || '';
    const frontmatter = parseSimpleYaml(yamlContent);

    // Validate against schema
    const result = skillFrontmatterSchema.safeParse(frontmatter);

    if (!result.success) {
      errors.push(...result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`));
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      frontmatter: result.success ? result.data : undefined,
    };
  } catch (error) {
    errors.push(
      `Failed to parse YAML: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    return { valid: false, errors, warnings };
  }
}

/**
 * Validates skill directory structure
 * Required: SKILL.md
 * Optional: reference.md, scripts/ subdirectory
 */
export function validateSkillStructure(files: string[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  hasReference: boolean;
  hasScripts: boolean;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const hasSkillMd = files.some((f) => f.endsWith('SKILL.md'));
  const hasReference = files.some((f) => f.endsWith('reference.md'));
  const hasScripts = files.some((f) => f.includes('/scripts/'));

  if (!hasSkillMd) {
    errors.push('Skill directory must contain SKILL.md file');
  }

  if (!hasReference) {
    warnings.push('Consider adding reference.md for additional documentation');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    hasReference,
    hasScripts,
  };
}
