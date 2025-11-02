# Skills Subdirectory Structure Guide

**Date**: 11/02/2025
**Version**: 1.0.0

## Overview

Skills in Claude Code require a **subdirectory structure**, not flat files like agents and commands. This is a critical architectural requirement that must be enforced during validation and file management.

Unlike agents (`.claude/agents/YOUR_AGENT.md`) and commands (`.claude/commands/YOUR_COMMAND.md`), which are single files, skills require a dedicated directory with a mandatory `SKILL.md` file inside.

---

## Correct Structure

### User-Level Skills

```
.claude/
└── skills/
    ├── data-processor/
    │   ├── SKILL.md
    │   ├── examples.md (optional)
    │   └── reference.md (optional)
    │
    ├── code-analyzer/
    │   ├── SKILL.md
    │   └── templates/
    │       └── typescript-template.ts (optional)
    │
    └── document-formatter/
        ├── SKILL.md
        └── samples/ (optional)
            ├── input-sample.txt
            └── output-sample.txt
```

### Project-Level Skills

```
my-project/
└── .claude/
    └── skills/
        ├── project-specific-linter/
        │   ├── SKILL.md
        │   └── rules.json (optional)
        │
        └── custom-test-runner/
            ├── SKILL.md
            └── presets/ (optional)
                └── jest-preset.js
```

### Plugin-Level Skills

```
marketplace/
└── my-plugin/
    └── .claude-plugin/
        └── skills/
            ├── ai-summarizer/
            │   ├── SKILL.md
            │   └── templates/
            │       └── summary-template.md (optional)
            │
            └── code-reviewer/
                ├── SKILL.md
                └── checks/ (optional)
                    └── review-checklist.md
```

---

## Incorrect Structure (Do NOT Use)

### ❌ Flat File in Skills Directory

```
.claude/
└── skills/
    ├── data-processor.md        # WRONG - Should be in subdirectory
    ├── code-analyzer.md         # WRONG - Should be in subdirectory
    └── document-formatter.md    # WRONG - Should be in subdirectory
```

**Problem**: Skills placed directly in the skills directory will not be recognized by Claude Code.

### ❌ Wrong File Names in Subdirectory

```
.claude/
└── skills/
    ├── data-processor/
    │   └── skill.md             # WRONG - Should be SKILL.md (uppercase)
    │
    ├── code-analyzer/
    │   └── CODE_ANALYZER.md     # WRONG - Should be SKILL.md
    │
    └── document-formatter/
        └── index.md             # WRONG - Should be SKILL.md
```

**Problem**: The file must be named exactly `SKILL.md` (uppercase). Claude Code will not recognize variations.

### ❌ Multiple SKILL.md Files

```
.claude/
└── skills/
    └── data-processor/
        ├── SKILL.md             # OK
        └── SKILL_v2.md          # WRONG - Conflicting skill definitions
```

**Problem**: Each skill subdirectory must have exactly one `SKILL.md` file at the root level of that subdirectory.

---

## SKILL.md File Structure

The `SKILL.md` file is a markdown file with YAML frontmatter that defines the skill's capabilities, parameters, and behavior.

### Minimal Example

```markdown
---
name: "Data Processor"
description: "Process and transform data structures"
category: "data"
tags: ["data", "transformation", "processing"]
---

# Data Processor Skill

This skill provides utilities for processing and transforming various data structures.

## Capabilities

- Parse CSV and JSON data
- Apply transformations
- Validate data integrity
- Export to multiple formats

## Usage

```

### Complete Example

```markdown
---
name: "Code Analyzer"
description: "Analyzes code for quality, security, and performance issues"
category: "development"
tags: ["code-analysis", "quality", "security", "performance"]
author: "Your Name"
version: "1.0.0"
dependencies: []
---

# Code Analyzer Skill

Comprehensive code analysis skill for identifying issues and improvements.

## Overview

Analyzes code written in JavaScript, TypeScript, Python, and Go for:
- Security vulnerabilities
- Performance anti-patterns
- Code quality issues
- Best practice violations

## Capabilities

### Security Analysis
- SQL injection detection
- XSS vulnerability identification
- Credential leakage detection

### Performance Analysis
- Inefficient loops
- Memory leak detection
- N+1 query patterns

### Code Quality
- Complexity metrics
- Dead code detection
- Naming convention violations

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| code | string | Yes | Source code to analyze |
| language | string | Yes | Programming language (js, ts, py, go) |
| checks | array | No | Specific checks to run (default: all) |

## Examples

### Basic Usage

Input:
```javascript
function analyze(code) {
  // Implementation
}
```

Output:
```json
{
  "issues": [
    {
      "type": "security",
      "severity": "high",
      "message": "Potential SQL injection"
    }
  ]
}
```

## Best Practices

1. Always specify the language before analysis
2. Run security checks first
3. Review performance issues for your specific use case
4. Document all custom checks

## Limitations

- Supports JavaScript, TypeScript, Python, Go only
- Requires valid syntax (cannot parse incomplete code)
- Performance analysis is heuristic-based
```

---

## Optional Reference Files

Skills can include optional reference files alongside `SKILL.md` to provide additional context and examples:

### Examples Structure

```
skill-name/
├── SKILL.md
├── examples.md              # Practical usage examples
├── advanced-usage.md        # Advanced techniques
├── troubleshooting.md       # Common issues and solutions
└── faq.md                   # Frequently asked questions
```

### Templates Subdirectory

```
skill-name/
├── SKILL.md
└── templates/
    ├── basic-template.txt
    ├── advanced-template.txt
    └── README.md            # Guide to using templates
```

### Configuration Files

```
skill-name/
├── SKILL.md
├── presets.json             # Preset configurations
├── rules.yaml               # Configuration rules
└── config-schema.json       # Configuration schema
```

### Documentation Structure

```
skill-name/
├── SKILL.md
├── docs/
    ├── getting-started.md
    ├── api-reference.md
    ├── examples.md
    └── troubleshooting.md
└── samples/
    ├── input-sample.txt
    └── output-sample.txt
```

---

## Directory Naming Conventions

### Skill Directory Names

Use `kebab-case` for skill directory names:

```
✅ CORRECT:
  data-processor/
  code-analyzer/
  document-formatter/
  rest-api-client/
  file-validator/

❌ INCORRECT:
  DataProcessor/           # PascalCase
  data_processor/          # snake_case
  dataProcessor/           # camelCase
  data-Processor/          # Mixed case
  processor (data)/        # Spaces and parentheses
```

### Nested Directory Names

For optional subdirectories within skills, use `kebab-case` consistently:

```
✅ CORRECT:
  skill-name/
  ├── reference-docs/
  ├── code-samples/
  ├── pre-built-templates/
  └── config-presets/

❌ INCORRECT:
  skill-name/
  ├── reference_docs/
  ├── codeSamples/
  ├── Pre-Built-Templates/
  └── ConfigPresets/
```

---

## Validation Rules for PromptStash

PromptStash should enforce these validation rules when managing skills:

### Directory Structure Validation

```typescript
// Pseudo-code for validation
function validateSkillStructure(skillPath: string): ValidationResult {
  const errors: ValidationError[] = [];

  // Rule 1: Must be a directory
  if (!isDirectory(skillPath)) {
    errors.push({
      code: "SKILL_NOT_DIRECTORY",
      message: `Skill must be a directory, got file: ${skillPath}`,
      severity: "error"
    });
    return { valid: false, errors };
  }

  // Rule 2: Directory name must be kebab-case
  const dirName = basename(skillPath);
  if (!isKebabCase(dirName)) {
    errors.push({
      code: "INVALID_SKILL_NAME_FORMAT",
      message: `Skill directory name must be kebab-case: ${dirName}`,
      severity: "error"
    });
  }

  // Rule 3: Must contain SKILL.md
  const skillMdPath = join(skillPath, "SKILL.md");
  if (!fileExists(skillMdPath)) {
    errors.push({
      code: "MISSING_SKILL_MD",
      message: `Skill directory must contain SKILL.md file`,
      severity: "error"
    });
    return { valid: false, errors };
  }

  // Rule 4: Cannot contain other SKILL.* files
  const skillFiles = listFiles(skillPath)
    .filter(f => f.startsWith("SKILL."));

  if (skillFiles.length > 1) {
    errors.push({
      code: "MULTIPLE_SKILL_DEFINITIONS",
      message: `Skill directory must contain exactly one SKILL.md file. Found: ${skillFiles.join(", ")}`,
      severity: "error"
    });
  }

  // Rule 5: Cannot have .md files at root (only SKILL.md)
  const rootMarkdownFiles = listFiles(skillPath)
    .filter(f => f.endsWith(".md") && f !== "SKILL.md");

  if (rootMarkdownFiles.length > 0) {
    errors.push({
      code: "MARKDOWN_FILES_IN_ROOT",
      message: `Only SKILL.md should be at root level. Move ${rootMarkdownFiles.join(", ")} to subdirectories`,
      severity: "warning"
    });
  }

  // Rule 6: SKILL.md must be valid
  const skillMdValidation = validateSkillMarkdown(skillMdPath);
  if (!skillMdValidation.valid) {
    errors.push(...skillMdValidation.errors);
  }

  return {
    valid: errors.filter(e => e.severity === "error").length === 0,
    errors
  };
}
```

### SKILL.md Frontmatter Validation

```typescript
interface SkillFrontmatter {
  name: string;              // Required: Skill name
  description: string;       // Required: Brief description
  category?: string;         // Optional: Category classification
  tags?: string[];          // Optional: Tags for organization
  author?: string;          // Optional: Author name
  version?: string;         // Optional: Version string
  dependencies?: string[];  // Optional: Skill dependencies
  [key: string]: any;       // Allow additional fields
}

function validateSkillFrontmatter(
  frontmatter: Record<string, any>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!frontmatter.name || typeof frontmatter.name !== "string") {
    errors.push({
      code: "MISSING_REQUIRED_FIELD",
      message: `'name' is required and must be a string`,
      severity: "error"
    });
  }

  if (!frontmatter.description || typeof frontmatter.description !== "string") {
    errors.push({
      code: "MISSING_REQUIRED_FIELD",
      message: `'description' is required and must be a string`,
      severity: "error"
    });
  }

  // Optional field type validation
  if (frontmatter.tags && !Array.isArray(frontmatter.tags)) {
    errors.push({
      code: "INVALID_FIELD_TYPE",
      message: `'tags' must be an array of strings`,
      severity: "error"
    });
  }

  if (frontmatter.dependencies && !Array.isArray(frontmatter.dependencies)) {
    errors.push({
      code: "INVALID_FIELD_TYPE",
      message: `'dependencies' must be an array of strings`,
      severity: "error"
    });
  }

  if (frontmatter.version && typeof frontmatter.version !== "string") {
    errors.push({
      code: "INVALID_FIELD_TYPE",
      message: `'version' must be a string (semantic version recommended)`,
      severity: "warning"
    });
  }

  return {
    valid: errors.filter(e => e.severity === "error").length === 0,
    errors
  };
}
```

---

## File Creation & Management in PromptStash

### Creating a New Skill

When user creates a new skill via PromptStash:

1. **Prompt for skill name**
   - Validate name is not empty
   - Convert to kebab-case automatically
   - Check name doesn't already exist

2. **Create directory structure**
   ```
   .claude/skills/skill-name/
   └── SKILL.md
   ```

3. **Populate SKILL.md with template**
   ```markdown
   ---
   name: "Skill Name"
   description: "Brief description of what this skill does"
   category: "category"
   tags: ["tag1", "tag2"]
   ---

   # Skill Name

   ## Overview

   Detailed description of the skill.

   ## Capabilities

   - Capability 1
   - Capability 2
   - Capability 3
   ```

### Uploading Skills

When uploading skill files:

1. Detect if upload is a skill directory (contains SKILL.md)
2. Validate structure before import
3. Create missing directories if needed
4. Move files to correct locations
5. Report any structural issues

### Displaying Skills in UI

In PromptStash file browser:

- Show skill directories with special icon/badge indicating "Skill"
- When expanding skill directory, highlight SKILL.md with primary icon
- Show optional reference files in secondary styling
- Organize by subdirectories if present

### Deployment Process

When deploying skills to project:

1. Validate complete skill structure
2. Ensure skill name matches directory name
3. Copy entire skill directory (including optional files)
4. Preserve subdirectory structure
5. Validate SKILL.md on destination

---

## Comparison: Skills vs Agents vs Commands

| Aspect | Agents | Commands | Skills |
|--------|--------|----------|--------|
| **File Type** | `.md` file | `.md` file | Directory |
| **Location** | `.claude/agents/` | `.claude/commands/` | `.claude/skills/` |
| **File Name** | `AGENT_NAME.md` | `COMMAND_NAME.md` | `skill-name/SKILL.md` |
| **Naming Style** | Various | Various | kebab-case required |
| **Structure** | Single file | Single file | Directory + subdirectories |
| **Additional Files** | Not supported | Not supported | Optional reference files |
| **File Count** | 1 per agent | 1 per command | 1+ per skill |

---

## Common Mistakes & Solutions

### Mistake 1: Creating Skill as Single File

**❌ Wrong:**
```
.claude/
└── skills/
    └── my-skill.md
```

**✅ Correct:**
```
.claude/
└── skills/
    └── my-skill/
        └── SKILL.md
```

### Mistake 2: Wrong File Naming

**❌ Wrong:**
```
.claude/
└── skills/
    └── my-skill/
        └── skill.md (lowercase)
```

**✅ Correct:**
```
.claude/
└── skills/
    └── my-skill/
        └── SKILL.md (uppercase)
```

### Mistake 3: Putting Markdown Files at Root

**❌ Wrong:**
```
.claude/
└── skills/
    └── my-skill/
        ├── SKILL.md
        ├── examples.md
        ├── advanced.md
        └── faq.md
```

**✅ Correct:**
```
.claude/
└── skills/
    └── my-skill/
        ├── SKILL.md
        └── docs/
            ├── examples.md
            ├── advanced.md
            └── faq.md
```

### Mistake 4: PascalCase Directory Names

**❌ Wrong:**
```
.claude/
└── skills/
    ├── MySkill/
    ├── DataProcessor/
    └── CodeAnalyzer/
```

**✅ Correct:**
```
.claude/
└── skills/
    ├── my-skill/
    ├── data-processor/
    └── code-analyzer/
```

### Mistake 5: Directory Name Doesn't Match Skill Name

**❌ Wrong:**
```
.claude/
└── skills/
    └── processor/
        └── SKILL.md
            ---
            name: "Data Processor"
```

**✅ Correct:**
```
.claude/
└── skills/
    └── data-processor/
        └── SKILL.md
            ---
            name: "Data Processor"
```

---

## Migration Guide

If you have skills in the wrong format, here's how to migrate:

### From Flat File to Subdirectory

**Before:**
```
.claude/
└── skills/
    └── my-skill.md
```

**Steps:**
1. Create directory: `mkdir .claude/skills/my-skill/`
2. Move file: `mv .claude/skills/my-skill.md .claude/skills/my-skill/SKILL.md`
3. Update content if referencing parent directory

**After:**
```
.claude/
└── skills/
    └── my-skill/
        └── SKILL.md
```

### From Wrong File Name to SKILL.md

**Before:**
```
.claude/
└── skills/
    └── my-skill/
        └── skill.md (or index.md, my-skill.md, etc.)
```

**Steps:**
1. Rename file: `mv .claude/skills/my-skill/skill.md .claude/skills/my-skill/SKILL.md`

**After:**
```
.claude/
└── skills/
    └── my-skill/
        └── SKILL.md
```

### From Multiple Markdown Files to Organized Structure

**Before:**
```
.claude/
└── skills/
    └── my-skill/
        ├── SKILL.md
        ├── examples.md
        ├── advanced.md
        ├── faq.md
        └── troubleshooting.md
```

**Steps:**
1. Create docs directory: `mkdir .claude/skills/my-skill/docs/`
2. Move files: `mv .claude/skills/my-skill/{examples,advanced,faq,troubleshooting}.md .claude/skills/my-skill/docs/`

**After:**
```
.claude/
└── skills/
    └── my-skill/
        ├── SKILL.md
        └── docs/
            ├── examples.md
            ├── advanced.md
            ├── faq.md
            └── troubleshooting.md
```

---

## Summary

### Key Points

1. **Skills MUST be directories** - Not flat `.md` files
2. **Directory naming is kebab-case** - Use `skill-name`, not `SkillName`
3. **SKILL.md is mandatory** - Must be in the skill subdirectory root
4. **File name must be uppercase** - `SKILL.md`, not `skill.md`
5. **One SKILL.md per skill** - Exactly one definition per subdirectory
6. **Optional reference files** - Use subdirectories for additional documentation

### Validation Checklist

- [ ] Skill is a directory, not a file
- [ ] Directory name is kebab-case
- [ ] Directory contains `SKILL.md` (uppercase)
- [ ] No other `SKILL.*` files exist
- [ ] Additional markdown files are in subdirectories
- [ ] SKILL.md has valid YAML frontmatter
- [ ] Required fields present: `name`, `description`
- [ ] Optional fields have correct types
- [ ] Directory structure mirrors project best practices

---

## Resources

- [Claude Code Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills.md)
- [PromptStash Project Overview](../../promptstash.md)
- [Style Guide & Naming Conventions](../style-guide.md)
