# PromptStash Validation Rules Reference

**Date**: 11/02/2025
**Version**: 1.0.0

This document provides a comprehensive reference for validation rules that PromptStash should enforce when managing Claude Code files.

---

## File Type Definitions

### Agents

**Definition**: Reusable AI prompt frameworks with specific capabilities and behavior patterns.

**Structure**:
```
.claude/agents/
└── AGENT_NAME.md
```

**File Requirements**:
- Single `.md` file per agent
- File name: `AGENT_NAME.md` (any case)
- YAML frontmatter required
- Markdown content required

**Validation Rules**:

| Rule | Severity | Check |
|------|----------|-------|
| Must be `.md` file | Error | `file.endsWith(".md")` |
| Must be in agents directory | Error | `path.includes(".claude/agents")` |
| Cannot be in subdirectory | Error | `dirname(agentFile) === ".claude/agents"` |
| Must have YAML frontmatter | Error | `frontmatterExists && isValidYAML` |
| Must have `name` in frontmatter | Error | `frontmatter.name !== undefined` |
| Must have `description` in frontmatter | Error | `frontmatter.description !== undefined` |
| File name cannot start with dot | Error | `!basename.startsWith(".")` |

### Commands

**Definition**: Custom slash commands for Claude Code that extend available functionality.

**Structure**:
```
.claude/commands/
└── COMMAND_NAME.md
```

**File Requirements**:
- Single `.md` file per command
- File name: `COMMAND_NAME.md` (any case)
- YAML frontmatter required
- Markdown content required

**Validation Rules**:

| Rule | Severity | Check |
|------|----------|-------|
| Must be `.md` file | Error | `file.endsWith(".md")` |
| Must be in commands directory | Error | `path.includes(".claude/commands")` |
| Cannot be in subdirectory | Error | `dirname(commandFile) === ".claude/commands"` |
| Must have YAML frontmatter | Error | `frontmatterExists && isValidYAML` |
| Must have `name` in frontmatter | Error | `frontmatter.name !== undefined` |
| File name cannot start with dot | Error | `!basename.startsWith(".")` |

### Skills

**Definition**: Reusable capabilities that can be invoked during Claude Code sessions, organized with optional reference files.

**Structure**:
```
.claude/skills/
└── skill-name/
    ├── SKILL.md
    ├── examples.md (optional)
    ├── docs/ (optional)
    │   └── *.md
    └── templates/ (optional)
        └── *.*
```

**File Requirements**:
- Directory per skill (NOT a file)
- Directory name: `kebab-case`
- Mandatory: `SKILL.md` in root of skill directory
- Optional: Reference files in subdirectories
- File name must be exactly `SKILL.md` (uppercase)

**Validation Rules**:

| Rule | Severity | Check |
|------|----------|-------|
| Must be directory, not file | Error | `isDirectory(skillPath)` |
| Directory must be in skills folder | Error | `path.includes(".claude/skills")` |
| Directory name must be kebab-case | Error | `isKebabCase(dirname)` |
| Must contain SKILL.md | Error | `exists(join(skillPath, "SKILL.md"))` |
| File must be named exactly SKILL.md | Error | `basename === "SKILL.md"` |
| Cannot have multiple SKILL.* files | Error | `count(skillFiles matching SKILL.*) === 1` |
| Must have YAML frontmatter in SKILL.md | Error | `frontmatterExists && isValidYAML` |
| Must have `name` in frontmatter | Error | `frontmatter.name !== undefined` |
| Must have `description` in frontmatter | Error | `frontmatter.description !== undefined` |
| Cannot have .md files at root (except SKILL.md) | Warning | `!rootFiles.filter(f => f.endsWith(".md") && f !== "SKILL.md").length > 0` |

---

## YAML Frontmatter Validation

### Agents & Commands

**Required Fields**:
```yaml
---
name: string              # (Required) Display name of the agent/command
description: string       # (Required) Brief description
---
```

**Optional Fields**:
```yaml
---
name: string
description: string
tags: string[]           # Array of tags for organization
author: string           # Author name
version: string          # Version (semantic versioning recommended)
category: string         # Category classification
---
```

**Validation Rules**:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `name` | string | Yes | Must not be empty; max 200 chars |
| `description` | string | Yes | Must not be empty; max 500 chars |
| `tags` | string[] | No | Array of strings; max 20 tags; max 50 chars per tag |
| `author` | string | No | Max 100 chars |
| `version` | string | No | Should follow semantic versioning (X.Y.Z) |
| `category` | string | No | Max 50 chars |

### Skills

**Required Fields**:
```yaml
---
name: string              # (Required) Display name of the skill
description: string       # (Required) Brief description
---
```

**Recommended Fields**:
```yaml
---
name: string
description: string
category: string         # Recommended: Category classification
tags: string[]           # Recommended: Tags for organization
---
```

**Optional Fields**:
```yaml
---
name: string
description: string
category: string
tags: string[]
author: string           # Author name
version: string          # Version (semantic versioning recommended)
dependencies: string[]   # Other skills this skill depends on
---
```

**Validation Rules**:

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `name` | string | Yes | Must not be empty; max 200 chars; should match directory name |
| `description` | string | Yes | Must not be empty; max 500 chars |
| `category` | string | No | Max 50 chars |
| `tags` | string[] | No | Array of strings; max 20 tags; max 50 chars per tag |
| `author` | string | No | Max 100 chars |
| `version` | string | No | Should follow semantic versioning (X.Y.Z) |
| `dependencies` | string[] | No | Array of skill names that are required |

---

## Content Validation

### Markdown Content

**Requirements**:
- Valid markdown syntax
- At least one heading (## or lower)
- Meaningful content (not just YAML frontmatter)

**Validation Rules**:

| Rule | Severity | Check |
|------|----------|-------|
| Must have markdown content | Error | `contentAfterFrontmatter.length > 0` |
| Must have at least one heading | Warning | `content.includes(/^#{1,6}\s/m)` |
| Markdown must be valid | Warning | `parseMarkdown(content).isValid` |
| No script tags allowed | Error | `!content.includes("<script")` |
| No raw HTML tags | Warning | `!content.match(/<(?!br|p|a|b|i|em|strong|code)/)` |

### Code Blocks

**Requirements**:
- Language specified when including code examples
- Valid syntax highlighting language specified

**Examples**:
```markdown
✅ CORRECT:
\`\`\`javascript
function example() {
  return true;
}
\`\`\`

\`\`\`python
def example():
    return True
\`\`\`

❌ INCORRECT:
\`\`\`
function example() {
  return true;
}
\`\`\`
```

---

## Specific Type Validations

### Agent Validation Rules

```javascript
// Agents-specific rules
const agentRules = {
  // Structure
  isFile: true,
  isInAgentsDirectory: true,
  noSubdirectories: true,

  // Frontmatter
  hasFrontmatter: true,
  requiredFields: ["name", "description"],

  // Content
  hasMarkdownContent: true,
  minContentLength: 50,  // At least 50 chars of meaningful content

  // Security
  noScriptTags: true,
  noExternalScripts: true
};
```

### Command Validation Rules

```javascript
// Commands-specific rules
const commandRules = {
  // Structure
  isFile: true,
  isInCommandsDirectory: true,
  noSubdirectories: true,

  // Frontmatter
  hasFrontmatter: true,
  requiredFields: ["name", "description"],

  // Additional validation
  nameFormat: "Can include alphanumeric and hyphens",
  maxNameLength: 50,

  // Content
  hasMarkdownContent: true,
  minContentLength: 50
};
```

### Skill Validation Rules

```javascript
// Skills-specific rules
const skillRules = {
  // Structure
  isDirectory: true,
  isInSkillsDirectory: true,
  directoryNameFormat: "kebab-case",
  containsSKILLmd: true,
  exactFileName: "SKILL.md",
  oneSKILLmdPerSkill: true,

  // Frontmatter
  hasFrontmatter: true,
  requiredFields: ["name", "description"],
  recommendedFields: ["category", "tags"],

  // Content
  hasMarkdownContent: true,
  minContentLength: 50,

  // Reference files
  canHaveSubdirectories: true,
  recommendedSubdirectories: [
    "docs/",
    "templates/",
    "examples/",
    "samples/"
  ],
  noMarkdownInRootExceptSKILLmd: true,

  // Security
  noScriptTags: true
};
```

---

## Validation Error Categories

### Error Levels

| Level | Meaning | Action |
|-------|---------|--------|
| **Error** | Critical validation failure | Block save/upload until fixed |
| **Warning** | Non-critical issue | Allow save but display warning |
| **Info** | Suggestion for improvement | Display tip/hint |

### Error Codes

#### Structure Errors

| Code | Message | Severity | Fix |
|------|---------|----------|-----|
| `INVALID_FILE_TYPE` | File must be .md | Error | Rename file to .md |
| `INVALID_LOCATION` | File not in correct directory | Error | Move to correct location |
| `NOT_A_DIRECTORY` | Skill must be a directory | Error | Create directory and move SKILL.md inside |
| `MISSING_SKILL_MD` | Skill missing SKILL.md | Error | Create SKILL.md in skill directory |
| `WRONG_FILENAME` | File must be named SKILL.md | Error | Rename to SKILL.md (uppercase) |
| `MULTIPLE_SKILL_DEFINITIONS` | Multiple SKILL.* files found | Error | Keep only one SKILL.md |
| `FILE_IN_SUBDIRECTORY` | Agent/command cannot be in subdirectory | Error | Move file to parent directory |

#### Naming Errors

| Code | Message | Severity | Fix |
|------|---------|----------|-----|
| `INVALID_NAMING_FORMAT` | Skill directory name must be kebab-case | Error | Rename directory to kebab-case |
| `INVALID_NAME_CHARS` | Name contains invalid characters | Error | Use only alphanumeric, hyphens, underscores |
| `EMPTY_NAME` | File/directory name cannot be empty | Error | Provide a name |
| `RESERVED_NAME` | Name is reserved or conflicts | Error | Choose different name |
| `NAMECASE_MISMATCH` | Directory name doesn't match skill name | Warning | Update directory or skill name to match |

#### Frontmatter Errors

| Code | Message | Severity | Fix |
|------|---------|----------|-----|
| `NO_FRONTMATTER` | Missing YAML frontmatter | Error | Add frontmatter with --- delimiters |
| `INVALID_YAML` | YAML frontmatter is invalid | Error | Fix YAML syntax |
| `MISSING_NAME` | Required field 'name' not found | Error | Add 'name' field to frontmatter |
| `MISSING_DESCRIPTION` | Required field 'description' not found | Error | Add 'description' field |
| `INVALID_FIELD_TYPE` | Field has wrong type | Error | Fix field type to match schema |
| `NAME_TOO_LONG` | Name exceeds max length (200 chars) | Warning | Shorten name |
| `DESCRIPTION_TOO_LONG` | Description exceeds max length (500 chars) | Warning | Shorten description |
| `INVALID_TAGS` | Tags must be array of strings | Error | Format tags as array: ["tag1", "tag2"] |
| `TOO_MANY_TAGS` | Exceeds max tag limit (20) | Warning | Remove some tags |

#### Content Errors

| Code | Message | Severity | Fix |
|------|---------|----------|-----|
| `NO_CONTENT` | File has no markdown content | Error | Add content after frontmatter |
| `EMPTY_CONTENT` | Content is too short | Warning | Add more meaningful content |
| `INVALID_MARKDOWN` | Markdown syntax is invalid | Warning | Fix markdown syntax |
| `NO_HEADINGS` | File should have at least one heading | Warning | Add markdown heading (## Title) |
| `SCRIPT_TAG_FOUND` | Script tags not allowed | Error | Remove script tags |
| `HTML_NOT_ALLOWED` | Raw HTML not recommended | Warning | Use markdown formatting instead |

#### Organization Errors

| Code | Message | Severity | Fix |
|------|---------|----------|-----|
| `MARKDOWN_IN_ROOT` | Only SKILL.md should be at root | Warning | Move markdown files to subdirectory (docs/, examples/) |
| `UNORGANIZED_FILES` | Consider organizing reference files in subdirectories | Info | Create docs/ or templates/ subdirectory |
| `NESTED_SKILL_DIRECTORY` | Skill directory found inside another skill | Error | Move skill to correct location |

---

## Validation Workflow

### On File Creation

```
1. Get user input (name, type)
   ↓
2. Validate input format (not empty, valid characters)
   ↓
3. Check for name conflicts
   ↓
4. Create file/directory structure
   ↓
5. Generate template with frontmatter
   ↓
6. Validate generated content
   ↓
7. Save file
   ↓
8. Display success or errors
```

### On File Upload

```
1. Check if single file or directory
   ↓
2. If file: Validate as agent/command
   ↓
3. If directory: Check if skill (has SKILL.md)
   ↓
4. Validate structure completeness
   ↓
5. Validate all frontmatter
   ↓
6. Validate all content
   ↓
7. Check for conflicts with existing files
   ↓
8. Move to correct location
   ↓
9. Report any warnings/errors
```

### On File Edit

```
1. Parse frontmatter and content
   ↓
2. Validate modified frontmatter
   ↓
3. Validate modified content
   ↓
4. Check for structural changes (if renaming)
   ↓
5. Validate against rules for that file type
   ↓
6. Display errors/warnings
   ↓
7. Allow save only if no errors (warnings OK)
```

### On File Deployment

```
1. Validate complete structure
   ↓
2. Check all dependencies exist
   ↓
3. Verify destination path is valid
   ↓
4. Check for conflicts at destination
   ↓
5. Validate post-deployment structure
   ↓
6. Report success or roll back
```

---

## Validation UI/UX Patterns

### Real-Time Validation

Show validation status as user types:

```
✓ Name: "My Skill"
✓ Type: Skill
✗ Description: (Required)
⚠ Category: (Recommended)
```

### Error Display

Show errors prominently with fixes:

```
⚠ Issues Found:

1. ERROR: Missing 'description' field
   Add a brief description in the frontmatter

2. WARNING: Skill name 'my skill' doesn't match directory 'my-skill'
   Update directory name to match skill name

3. INFO: Consider organizing files in subdirectories
   Move reference.md to docs/reference.md
```

### Validation Hints

Provide contextual tips:

```
Tip: Skill names should be PascalCase in frontmatter
but directory names should be kebab-case.

Example:
  Directory: my-data-processor/
  Name in frontmatter: "My Data Processor"
```

---

## Integration with File Management

### When Creating New File

```typescript
async createNewSkill(name: string, description: string) {
  // 1. Validate input
  const errors = validateSkillInput(name, description);
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  // 2. Convert name to kebab-case
  const dirName = toKebabCase(name);

  // 3. Check for conflicts
  if (skillExists(dirName)) {
    throw new ConflictError(`Skill '${dirName}' already exists`);
  }

  // 4. Create structure
  createDirectory(`skills/${dirName}`);
  createFile(`skills/${dirName}/SKILL.md`, template);

  // 5. Validate result
  const validation = validateSkillStructure(`skills/${dirName}`);
  if (!validation.valid) {
    rollback();
    throw validation.errors[0];
  }

  return { path: `skills/${dirName}`, valid: true };
}
```

### When Uploading Files

```typescript
async uploadSkill(file: File | Directory) {
  if (file.isDirectory) {
    // Validate as skill
    const result = validateSkillStructure(file.path);

    if (!result.valid) {
      return {
        success: false,
        errors: result.errors,
        warnings: []
      };
    }
  } else if (file.name.endsWith(".md")) {
    // Validate as agent or command
    const result = validateAgentOrCommand(file);

    if (!result.valid) {
      return {
        success: false,
        errors: result.errors
      };
    }
  }

  // Perform upload if valid
  await moveFile(file, destinationPath);
  return { success: true, path: destinationPath };
}
```

---

## Summary Checklist

### For All Files

- [ ] File/directory name is valid format
- [ ] File is in correct location
- [ ] YAML frontmatter is present and valid
- [ ] Required fields (`name`, `description`) present
- [ ] Markdown content exists and is meaningful

### For Agents

- [ ] Is `.md` file (not directory)
- [ ] Located in `.claude/agents/`
- [ ] Not in subdirectory
- [ ] Has valid YAML frontmatter

### For Commands

- [ ] Is `.md` file (not directory)
- [ ] Located in `.claude/commands/`
- [ ] Not in subdirectory
- [ ] Has valid YAML frontmatter

### For Skills

- [ ] Is directory (not file)
- [ ] Directory name is kebab-case
- [ ] Located in `.claude/skills/`
- [ ] Contains exactly one `SKILL.md` (uppercase)
- [ ] `SKILL.md` has valid YAML frontmatter
- [ ] Optional reference files organized in subdirectories
- [ ] No `.md` files at root except `SKILL.md`

---

## Resources

- [Skills Subdirectory Structure Guide](./skills-subdirectory-structure.md)
- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code/)
- [Style Guide & Naming Conventions](../style-guide.md)
