import { describe, expect, it } from '@jest/globals';
import { validateAgentFile, validateAgentFilename } from '../../validators/agent-validator';

describe('Agent Validator', () => {
  describe('validateAgentFilename', () => {
    it('should validate correct kebab-case filenames', () => {
      const result = validateAgentFilename('security-reviewer.md');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate single-word filenames', () => {
      const result = validateAgentFilename('reviewer.md');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate filenames with numbers', () => {
      const result = validateAgentFilename('agent-v2.md');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject filenames without .md extension', () => {
      const result = validateAgentFilename('security-reviewer.txt');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Agent file must have .md extension');
    });

    it('should reject filenames with uppercase letters', () => {
      const result = validateAgentFilename('SecurityReviewer.md');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('kebab-case');
    });

    it('should reject filenames with underscores', () => {
      const result = validateAgentFilename('security_reviewer.md');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('kebab-case');
    });

    it('should reject filenames with spaces', () => {
      const result = validateAgentFilename('security reviewer.md');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('kebab-case');
    });

    it('should reject filenames starting with hyphen', () => {
      const result = validateAgentFilename('-agent.md');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('kebab-case');
    });

    it('should reject filenames ending with hyphen', () => {
      const result = validateAgentFilename('agent-.md');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('kebab-case');
    });
  });

  describe('validateAgentFile', () => {
    it('should validate correct agent file', () => {
      const content = `---
description: A security-focused code reviewer
model: sonnet
---

# Security Reviewer

This agent reviews code for security vulnerabilities.
`;
      const result = validateAgentFile(content, 'security-reviewer.md');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.frontmatter).toBeDefined();
      expect(result.frontmatter?.description).toBe('A security-focused code reviewer');
    });

    it('should reject file without frontmatter', () => {
      const content = '# Security Reviewer\n\nThis agent reviews code.';
      const result = validateAgentFile(content, 'security-reviewer.md');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Agent file must start with YAML frontmatter (--- ... ---)');
    });

    it('should reject file with missing description', () => {
      const content = `---
model: sonnet
---

# Agent
`;
      const result = validateAgentFile(content, 'agent.md');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('description'))).toBe(true);
    });

    it('should validate agent with tools array', () => {
      const content = `---
description: Test agent
tools:
  - web-search
  - file-system
---

# Agent
`;
      const result = validateAgentFile(content, 'test-agent.md');
      expect(result.valid).toBe(true);
      expect(result.frontmatter?.tools).toEqual(['web-search', 'file-system']);
    });

    it('should reject both tools and allowed-tools', () => {
      const content = `---
description: Test agent
tools:
  - web-search
allowed-tools:
  - file-system
---

# Agent
`;
      const result = validateAgentFile(content, 'test-agent.md');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('both'))).toBe(true);
    });

    it('should validate valid model values', () => {
      const models = ['sonnet', 'opus', 'haiku', 'inherit'];

      for (const model of models) {
        const content = `---
description: Test agent
model: ${model}
---

# Agent
`;
        const result = validateAgentFile(content, 'test-agent.md');
        expect(result.valid).toBe(true);
      }
    });

    it('should reject invalid model values', () => {
      const content = `---
description: Test agent
model: invalid-model
---

# Agent
`;
      const result = validateAgentFile(content, 'test-agent.md');
      expect(result.valid).toBe(false);
    });

    it('should warn if no model is specified', () => {
      const content = `---
description: Test agent
---

# Agent
`;
      const result = validateAgentFile(content, 'test-agent.md');
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain("Consider specifying a 'model' field");
    });

    it('should validate disable-model-invocation field', () => {
      const content = `---
description: Test agent
disable-model-invocation: true
---

# Agent
`;
      const result = validateAgentFile(content, 'test-agent.md');
      expect(result.valid).toBe(true);
      expect(result.frontmatter?.['disable-model-invocation']).toBe(true);
    });

    it('should validate argument-hint field', () => {
      const content = `---
description: Test agent
argument-hint: Use this agent to review security
---

# Agent
`;
      const result = validateAgentFile(content, 'test-agent.md');
      expect(result.valid).toBe(true);
      expect(result.frontmatter?.['argument-hint']).toBe('Use this agent to review security');
    });

    it('should reject argument-hint longer than 200 characters', () => {
      const longHint = 'a'.repeat(201);
      const content = `---
description: Test agent
argument-hint: ${longHint}
---

# Agent
`;
      const result = validateAgentFile(content, 'test-agent.md');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('200'))).toBe(true);
    });

    it('should reject description longer than 500 characters', () => {
      const longDescription = 'a'.repeat(501);
      const content = `---
description: ${longDescription}
---

# Agent
`;
      const result = validateAgentFile(content, 'test-agent.md');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('500'))).toBe(true);
    });

    it('should include filename validation errors', () => {
      const content = `---
description: Test agent
---

# Agent
`;
      const result = validateAgentFile(content, 'Invalid_Filename.md');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('kebab-case'))).toBe(true);
    });
  });
});
