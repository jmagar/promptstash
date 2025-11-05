# Skills Quick Reference Card

**Date**: 11/02/2025
**Purpose**: One-page reference for the most critical information

---

## The Golden Rule

**Skills are DIRECTORIES with subdirectory structure, not flat files.**

```
✓ CORRECT:
  .claude/skills/
  └── my-skill/
      └── SKILL.md

✗ WRONG:
  .claude/skills/
  └── my-skill.md
```

---

## Directory Structure

### Minimal Skill

```
my-skill/
└── SKILL.md
```

### Organized Skill

```
my-skill/
├── SKILL.md
├── docs/
│   ├── getting-started.md
│   └── examples.md
├── examples/
│   └── sample.json
└── templates/
    └── template.txt
```

---

## SKILL.md File Requirements

### Required Frontmatter

```yaml
---
name: "Skill Name"
description: "Brief description"
---
```

### Optional Frontmatter

```yaml
category: "category"
tags: ["tag1", "tag2"]
author: "Author Name"
version: "1.0.0"
dependencies: []
```

### Content

- At least 50 characters of meaningful content
- At least one markdown heading
- Code blocks must specify language (e.g., ```javascript)
- No script tags

---

## Naming Conventions

| Item       | Format     | Example                      |
| ---------- | ---------- | ---------------------------- |
| Directory  | kebab-case | `my-skill`, `data-processor` |
| File       | SKILL.md   | SKILL.md (exactly)           |
| Skill name | PascalCase | "My Skill", "Data Processor" |

---

## What PromptStash Must Validate

### Structure Checks

- [ ] Is it a directory (not a file)?
- [ ] Directory name is kebab-case?
- [ ] Contains exactly one SKILL.md?
- [ ] SKILL.md filename is exact (not skill.md, index.md)?

### Frontmatter Checks

- [ ] Has valid YAML frontmatter?
- [ ] Has `name` field (2-200 characters)?
- [ ] Has `description` field (10-500 characters)?
- [ ] All optional fields have correct types?

### Content Checks

- [ ] Has meaningful markdown content (50+ chars)?
- [ ] Has at least one heading?
- [ ] No script tags or raw HTML?
- [ ] Code blocks specify language?

### Organization Checks

- [ ] No loose .md files at root (except SKILL.md)?
- [ ] Reference files in subdirectories (docs/, examples/)?
- [ ] Nested directories properly organized?

---

## Common Mistakes

### Mistake 1: File Instead of Directory

```
❌ .claude/skills/my-skill.md
✓ .claude/skills/my-skill/SKILL.md
```

### Mistake 2: Wrong Filename

```
❌ .claude/skills/my-skill/skill.md
❌ .claude/skills/my-skill/index.md
✓ .claude/skills/my-skill/SKILL.md
```

### Mistake 3: Wrong Directory Name

```
❌ .claude/skills/MySkill/
❌ .claude/skills/my_skill/
✓ .claude/skills/my-skill/
```

### Mistake 4: Files at Root

```
❌ .claude/skills/my-skill/
   ├── SKILL.md
   ├── examples.md      (loose at root)
   └── advanced.md      (loose at root)

✓ .claude/skills/my-skill/
  ├── SKILL.md
  └── docs/
      ├── examples.md
      └── advanced.md
```

---

## Validation Error Codes

| Code                | Meaning                        | Fix                            |
| ------------------- | ------------------------------ | ------------------------------ |
| NOT_DIRECTORY       | Skill is a file, not directory | Create directory structure     |
| INVALID_DIR_NAME    | Directory name not kebab-case  | Rename to kebab-case           |
| MISSING_SKILL_MD    | SKILL.md not found             | Create SKILL.md file           |
| WRONG_FILENAME      | File named incorrectly         | Rename to SKILL.md (uppercase) |
| MISSING_NAME        | 'name' field missing           | Add name to frontmatter        |
| MISSING_DESCRIPTION | 'description' missing          | Add description to frontmatter |
| INVALID_YAML        | Frontmatter syntax error       | Fix YAML syntax                |
| EMPTY_CONTENT       | No markdown content            | Add content after frontmatter  |

---

## File Comparison

| Aspect               | Agents             | Commands             | Skills                    |
| -------------------- | ------------------ | -------------------- | ------------------------- |
| **Type**             | File               | File                 | Directory                 |
| **Path**             | `.claude/agents/`  | `.claude/commands/`  | `.claude/skills/`         |
| **Filename**         | `ANY_NAME.md`      | `ANY_NAME.md`        | `SKILL.md`                |
| **Location**         | Root of agents dir | Root of commands dir | Subdirectory (kebab-case) |
| **Can have subdirs** | No                 | No                   | Yes                       |
| **Naming**           | Any                | Any                  | kebab-case required       |

---

## Creating a Skill (3 Steps)

### Step 1: Create Directory

```bash
mkdir .claude/skills/my-skill
```

### Step 2: Create SKILL.md

```markdown
---
name: "My Skill"
description: "What this skill does"
---

# My Skill

Content here...
```

### Step 3: Add Content

- Add overview section
- List capabilities
- Provide examples
- Document limitations

---

## Reference Files Organization

### Recommended Subdirectories

```
my-skill/
├── docs/           # Documentation files
├── examples/       # Example files
├── templates/      # Template files
├── samples/        # Sample input/output
└── presets/        # Configuration presets
```

### What Goes Where

- **docs/**: Additional documentation (guides, troubleshooting)
- **examples/**: Usage examples and demonstrations
- **templates/**: Reusable templates users can copy
- **samples/**: Sample data or input/output examples
- **presets/**: Configuration or setup files

---

## Frontmatter Field Limits

| Field        | Min | Max | Type   | Required |
| ------------ | --- | --- | ------ | -------- |
| name         | 2   | 200 | string | Yes      |
| description  | 10  | 500 | string | Yes      |
| category     | -   | 50  | string | No       |
| tags         | -   | 20  | array  | No       |
| author       | -   | 100 | string | No       |
| version      | -   | 20  | string | No       |
| dependencies | -   | -   | array  | No       |

---

## Content Quality Checklist

Before publishing a skill:

- [ ] Directory name is kebab-case
- [ ] SKILL.md exists with correct name
- [ ] Frontmatter has name and description
- [ ] Content is at least 50 characters
- [ ] Content has at least one heading
- [ ] Code blocks specify language
- [ ] No script tags or raw HTML
- [ ] Reference files in subdirectories
- [ ] Overview section explains purpose
- [ ] At least one example provided
- [ ] Limitations documented (if any)
- [ ] Valid YAML frontmatter

---

## PromptStash Implementation Priorities

1. **Must Have (MVP)**
   - Detect skill directories
   - Create skill with correct structure
   - Validate SKILL.md presence
   - Validate frontmatter
   - Show validation errors

2. **Should Have (Phase 1)**
   - Validate directory naming
   - Provide templates
   - Upload skill handling
   - Edit skill content
   - Deploy to project

3. **Nice to Have (Phase 2)**
   - Reference file management
   - Skill dependencies
   - Skill tagging/search
   - Version history
   - Auto-formatting

---

## Key Resource Files

| File                             | Purpose             | Best For              |
| -------------------------------- | ------------------- | --------------------- |
| SKILLS-README.md                 | Master index        | Quick orientation     |
| skills-subdirectory-structure.md | Architecture detail | Understanding design  |
| validation-rules-reference.md    | Technical specs     | Building validation   |
| skill-template-guidelines.md     | Writing guides      | Creating skills       |
| IMPLEMENTATION-GUIDE.md          | Code examples       | Building PromptStash  |
| DOCUMENTATION-SUMMARY.md         | Package overview    | Package understanding |

---

## Common Questions

**Q: Can skills be .md files?**
A: No. Skills MUST be directories with SKILL.md inside.

**Q: Can SKILL.md be in a subdirectory?**
A: No. SKILL.md must be at the root of the skill directory.

**Q: Can I use different names like skill.md or index.md?**
A: No. File must be exactly named SKILL.md (uppercase).

**Q: What should directory names look like?**
A: Use kebab-case: `my-skill`, `data-processor`, `code-analyzer`

**Q: Can I have multiple SKILL.md files?**
A: No. Each skill directory must have exactly one SKILL.md.

**Q: Where do reference files go?**
A: In subdirectories like `docs/`, `examples/`, `templates/`

**Q: What if I have multiple markdown files?**
A: Move them to subdirectories, not at the skill root.

**Q: Is frontmatter required?**
A: Yes. SKILL.md must have YAML frontmatter with `name` and `description`.

---

**Last Updated**: 11/02/2025
**Status**: Ready to Use
**Quick Reference Version**: 1.0.0
