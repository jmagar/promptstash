# Skills Documentation Index

**Date**: 11/02/2025
**Version**: 1.0.0

Complete documentation reference for understanding and working with Claude Code skills in PromptStash.

---

## Overview

**Skills are NOT flat files.** This is the most critical architectural requirement when working with Claude Code skills.

- **Agents** (`.claude/agents/YOUR_AGENT.md`) - Single files
- **Commands** (`.claude/commands/YOUR_COMMAND.md`) - Single files
- **Skills** (`.claude/skills/skill-name/SKILL.md`) - **Directories with subdirectory structure**

---

## Quick Reference

### Correct Skill Structure

```
.claude/skills/
└── my-skill/
    ├── SKILL.md
    ├── examples.md (optional)
    └── docs/ (optional)
```

### Wrong Skill Structure

```
.claude/skills/
└── my-skill.md                    ❌ WRONG - Should be directory
```

---

## Documentation Files

### 1. Skills Subdirectory Structure Guide

**File**: `/home/jmagar/code/promptstash/.docs/skills-subdirectory-structure.md`

**Purpose**: Comprehensive guide explaining why skills require subdirectory structure and how to organize them correctly.

**Contents**:

- Correct vs. incorrect structures (with visual examples)
- Directory naming conventions
- SKILL.md file requirements
- Optional reference file organization
- Validation rules for PromptStash to enforce
- Common mistakes and solutions
- Migration guide for fixing existing skills

**Best For**: Understanding the architecture, fixing structural issues, creating PromptStash validation logic

---

### 2. Validation Rules Reference

**File**: `/home/jmagar/code/promptstash/.docs/validation-rules-reference.md`

**Purpose**: Technical reference for all validation rules PromptStash should enforce.

**Contents**:

- File type definitions (Agents, Commands, Skills)
- YAML frontmatter validation rules
- Content validation requirements
- Error codes and categories
- Validation workflow for different scenarios
- Integration patterns for PromptStash implementation

**Best For**: Building validation logic, understanding error handling, implementing the validation UI

---

### 3. Skill Template Guidelines

**File**: `/home/jmagar/code/promptstash/.docs/skill-template-guidelines.md`

**Purpose**: Practical templates and examples for creating well-structured skill files.

**Contents**:

- Quick start template
- Minimal template for simple skills
- Full-featured template for complex skills
- Section-by-section writing guide
- Common patterns (data transformation, code analysis, utilities)
- Frontmatter field reference
- Documentation organization patterns
- Quality checklist
- Writing and formatting tips

**Best For**: Creating new skills, writing skill documentation, providing templates in PromptStash UI

---

## Key Concepts

### What Makes Skills Different

| Aspect                | Agents            | Commands            | Skills                      |
| --------------------- | ----------------- | ------------------- | --------------------------- |
| **File Structure**    | Single .md file   | Single .md file     | Directory tree              |
| **Location**          | `.claude/agents/` | `.claude/commands/` | `.claude/skills/`           |
| **Entry Point**       | Filename          | Filename            | `SKILL.md` in subdirectory  |
| **Naming Convention** | Any format        | Any format          | kebab-case for directory    |
| **Reference Files**   | Not supported     | Not supported       | Supported in subdirectories |
| **Complexity**        | Simpler           | Simpler             | More structured             |

### Why Subdirectories?

Skills use subdirectories because they:

1. **Support documentation**: Can include examples, guides, templates alongside SKILL.md
2. **Organize related files**: Group configuration, presets, samples together
3. **Scale better**: Handle complex skills with multiple reference documents
4. **Maintain consistency**: Clear structure mirrors project organization patterns
5. **Enable validation**: Subdirectory structure is explicitly defined and enforceable

### Critical Naming Rules

```
Directory name:  kebab-case    (my-skill, data-processor, code-analyzer)
File name:       SKILL.md      (exactly uppercase)
Skill name:      PascalCase    (My Skill, Data Processor)
                 in frontmatter
```

---

## For PromptStash Development

### Validation Implementation

PromptStash must enforce these core rules:

1. **Structure Validation**
   - Check skills are directories, not files
   - Verify directory name is kebab-case
   - Ensure exactly one SKILL.md exists at root
   - Validate SKILL.md uses exact uppercase filename

2. **Frontmatter Validation**
   - Require `name` and `description` fields
   - Validate YAML syntax
   - Check field types match schema
   - Enforce length limits on string fields

3. **Content Validation**
   - Require meaningful markdown content
   - Validate code block syntax highlighting
   - Prevent script tags and raw HTML
   - Suggest minimum content requirements

4. **Organization Validation**
   - Recommend subdirectories for multiple files
   - Warn about .md files at root (except SKILL.md)
   - Suggest `docs/`, `templates/`, `examples/` directories
   - Check for nested skill directories

### UI/UX Considerations

**File Creation**:

- Prompt user for skill name
- Auto-convert to kebab-case directory name
- Create directory structure automatically
- Pre-fill SKILL.md with template

**File Upload**:

- Detect if upload is skill (has SKILL.md)
- Validate complete structure before import
- Suggest fixes for common issues
- Preserve directory organization

**File Editor**:

- Highlight SKILL.md as primary file
- Show optional reference files in secondary styling
- Recommend organizing multiple files in subdirectories
- Display validation status in real-time

**Deployment**:

- Validate structure before export
- Preserve complete directory tree
- Generate deployment packages with correct structure
- Provide validation report

---

## Step-by-Step: Creating a Skill

### Manual Creation

1. Create directory with kebab-case name

   ```bash
   mkdir .claude/skills/my-skill
   ```

2. Create SKILL.md (uppercase) with frontmatter

   ```markdown
   ---
   name: "My Skill"
   description: "What this skill does"
   ---

   # My Skill

   Content here...
   ```

3. Add optional reference files in subdirectories

   ```bash
   mkdir .claude/skills/my-skill/docs
   mkdir .claude/skills/my-skill/examples
   ```

4. Validate structure matches patterns in documentation

### Using PromptStash

1. Click "Create New Skill"
2. Enter skill name and description
3. PromptStash creates directory and SKILL.md
4. Edit content in editor
5. (Optional) Add reference files to subdirectories
6. Save and deploy

---

## Validation Checklists

### Directory Structure

- [ ] Is a directory (not a file)
- [ ] Located in `.claude/skills/`
- [ ] Directory name is kebab-case
- [ ] Contains exactly one SKILL.md
- [ ] SKILL.md is at root of skill directory

### SKILL.md File

- [ ] File name is exactly `SKILL.md` (uppercase)
- [ ] Contains valid YAML frontmatter
- [ ] Has `name` field (2-200 characters)
- [ ] Has `description` field (10-500 characters)
- [ ] Contains meaningful markdown content
- [ ] No other `SKILL.*` files present

### Optional Files

- [ ] Reference files in subdirectories (docs/, examples/, templates/)
- [ ] No loose .md files at skill root (except SKILL.md)
- [ ] Subdirectory names are kebab-case
- [ ] Related files grouped logically

### Content Quality

- [ ] Overview section explains purpose
- [ ] At least one example included
- [ ] Code blocks specify language
- [ ] No script tags or raw HTML
- [ ] Limitations documented
- [ ] Troubleshooting section (if applicable)

---

## Common Issues & Solutions

### Issue 1: Skill Not Recognized

**Symptom**: Skill appears in file browser but Claude Code doesn't recognize it

**Likely Cause**: Structure is incorrect

**Check**:

1. Is it a directory or file? (Should be directory)
2. Is SKILL.md named correctly? (Must be uppercase)
3. Is SKILL.md at root of skill directory? (Not in subdirectory)
4. Is directory name kebab-case? (Check for spaces, capitals)

**Fix**: Review structure section of this guide

---

### Issue 2: Validation Errors in PromptStash

**Symptom**: PromptStash shows validation errors when saving

**Common Errors**:

| Error                           | Cause                     | Fix                              |
| ------------------------------- | ------------------------- | -------------------------------- |
| "Skill must be directory"       | File instead of directory | Create directory structure       |
| "Missing SKILL.md"              | Wrong filename            | Rename to `SKILL.md` (uppercase) |
| "Directory name not kebab-case" | Wrong naming format       | Rename to kebab-case             |
| "Missing 'description' field"   | Incomplete frontmatter    | Add description to YAML          |

---

### Issue 3: Reference Files Not Showing

**Symptom**: Optional files aren't visible or organized

**Solution**:

1. Ensure reference files are in subdirectories (not at root)
2. Use standard subdirectory names: `docs/`, `examples/`, `templates/`
3. Verify file names are descriptive
4. Check that only SKILL.md is at skill root

---

## Integration Points for PromptStash

### File Management

- New skill creation wizard
- Skill import/upload handler
- Skill rename/move operations
- Skill deletion with directory cleanup

### Validation

- Real-time frontmatter validation
- Structure validation on save
- Content quality suggestions
- Pre-deployment validation

### UI Components

- Skill explorer (showing directory tree)
- SKILL.md editor with template
- Reference file organizer
- Validation status indicator

### Deployment

- Package skill with complete directory structure
- Validate before export
- Generate deployment reports
- Provide rollback options

---

## References & Resources

### External Documentation

- [Claude Code Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills.md)
- [Claude Code Overview](https://docs.claude.com/en/docs/claude-code/)

### Related PromptStash Documentation

- [Project Overview](../promptstash.md)
- [Project Architecture](../promptstash2.md)
- [Project CLAUDE.md](../CLAUDE.md)

### Internal Documentation

- [Skills Subdirectory Structure Guide](./skills-subdirectory-structure.md) - Detailed architecture explanation
- [Validation Rules Reference](./validation-rules-reference.md) - Technical validation requirements
- [Skill Template Guidelines](./skill-template-guidelines.md) - Practical templates and examples

---

## Glossary

| Term                | Definition                                                               |
| ------------------- | ------------------------------------------------------------------------ |
| **Skill**           | Reusable capability in Claude Code, organized as directory with SKILL.md |
| **SKILL.md**        | Entry point file for skill, contains frontmatter and documentation       |
| **Subdirectory**    | Directory inside skill directory for organizing reference files          |
| **Frontmatter**     | YAML metadata at top of markdown file between `---` delimiters           |
| **kebab-case**      | Naming format using hyphens (my-skill, data-processor)                   |
| **PascalCase**      | Naming format using capitals (MySkill, DataProcessor)                    |
| **Reference Files** | Optional documentation files alongside SKILL.md (examples, guides)       |
| **Validation**      | Process of checking skill structure and content meet requirements        |

---

## Version History

| Version | Date       | Changes                                                |
| ------- | ---------- | ------------------------------------------------------ |
| 1.0.0   | 2025-11-02 | Initial release with comprehensive skill documentation |

---

## Next Steps

1. **For Learning**: Start with [Skills Subdirectory Structure Guide](./skills-subdirectory-structure.md)
2. **For Creating**: Use [Skill Template Guidelines](./skill-template-guidelines.md)
3. **For Building PromptStash**: Reference [Validation Rules Reference](./validation-rules-reference.md)

---

## Questions & Support

For questions about:

- **Skill structure**: See [Skills Subdirectory Structure Guide](./skills-subdirectory-structure.md)
- **Creating skills**: See [Skill Template Guidelines](./skill-template-guidelines.md)
- **Validation logic**: See [Validation Rules Reference](./validation-rules-reference.md)

For Claude Code questions:

- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code/)

---

**Last Updated**: 11/02/2025
**Maintained By**: PromptStash Documentation Team
