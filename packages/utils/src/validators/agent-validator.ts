import { z } from "zod";
import { parseSimpleYaml } from "./yaml-parser";

/**
 * Agent YAML Frontmatter Schema
 * 
 * Validates YAML frontmatter for Claude Code agent files (.claude/agents/*.md)
 * 
 * @see https://docs.claude.com/en/docs/claude-code/sub-agents.md
 */

const MODEL_OPTIONS = ["sonnet", "opus", "haiku", "inherit"] as const;

export const agentFrontmatterSchema = z
  .object({
    description: z
      .string()
      .min(1, "Description is required")
      .max(500, "Description must be 500 characters or less"),
    tools: z
      .array(z.string())
      .optional()
      .describe("Array of tool names the agent can use"),
    "allowed-tools": z
      .array(z.string())
      .optional()
      .describe("Alternative to 'tools' field"),
    model: z
      .enum(MODEL_OPTIONS)
      .optional()
      .describe("Model to use: sonnet, opus, haiku, or inherit"),
    "disable-model-invocation": z
      .boolean()
      .optional()
      .describe("Disable automatic model invocation"),
    "argument-hint": z
      .string()
      .max(200, "Argument hint should be under 200 characters")
      .optional()
      .describe("Usage hint for command arguments"),
  })
  .refine(
    (data) => {
      // Cannot have both 'tools' and 'allowed-tools'
      return !(data.tools && data["allowed-tools"]);
    },
    {
      message: "Cannot use both 'tools' and 'allowed-tools' simultaneously",
    }
  );

export type AgentFrontmatter = z.infer<typeof agentFrontmatterSchema>;

/**
 * Validates kebab-case filename
 */
export function validateAgentFilename(filename: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if filename ends with .md
  if (!filename.endsWith(".md")) {
    errors.push("Agent file must have .md extension");
  }

  const baseName = filename.replace(/\.md$/, "");

  // Check kebab-case
  const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!kebabCaseRegex.test(baseName)) {
    errors.push(
      "Filename must be kebab-case (lowercase with hyphens, e.g., security-reviewer.md)"
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates full agent file (frontmatter + content)
 */
export function validateAgentFile(content: string, filename: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  frontmatter?: AgentFrontmatter;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate filename
  const filenameValidation = validateAgentFilename(filename);
  if (!filenameValidation.valid) {
    errors.push(...filenameValidation.errors);
  }

  // Extract YAML frontmatter
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    errors.push("Agent file must start with YAML frontmatter (--- ... ---)");
    return { valid: false, errors, warnings };
  }

  try {
    // Parse YAML (simple implementation - in production use js-yaml)
    const yamlContent = match[1] || "";
    const frontmatter = parseSimpleYaml(yamlContent);

    // Validate against schema
    const result = agentFrontmatterSchema.safeParse(frontmatter);

    if (!result.success) {
      errors.push(...result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`));
    } else if (result.data && !result.data.model) {
      warnings.push("Consider specifying a 'model' field");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      frontmatter: result.success ? result.data : undefined,
    };
  } catch (error) {
    errors.push(`Failed to parse YAML: ${error instanceof Error ? error.message : "Unknown error"}`);
    return { valid: false, errors, warnings };
  }
}


