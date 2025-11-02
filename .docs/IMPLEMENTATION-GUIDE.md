# PromptStash Implementation Guide for Skills

**Date**: 11/02/2025
**Version**: 1.0.0

Practical implementation guidance for building skill support in PromptStash, with code examples and architectural patterns.

---

## Quick Overview

Skills in Claude Code require subdirectory structure, making them fundamentally different from agents and commands. This guide explains how to implement skill support in PromptStash.

**Key Constraint**: Skills MUST be directories, not files.

---

## Architecture Overview

### File Type Hierarchy

```
Claude Code Files
├── Agents
│   └── .claude/agents/AGENT_NAME.md (flat file)
├── Commands
│   └── .claude/commands/COMMAND_NAME.md (flat file)
└── Skills
    └── .claude/skills/skill-name/
        ├── SKILL.md (mandatory)
        ├── docs/ (optional)
        ├── examples/ (optional)
        └── templates/ (optional)
```

### Validation Flow

```
User Input
    ↓
Type Detection (Agent/Command/Skill?)
    ↓
Structure Validation
    ├─→ For Skills: Check directory structure, SKILL.md presence
    ├─→ For Agents: Check file format, location
    └─→ For Commands: Check file format, location
    ↓
Frontmatter Validation
    └─→ YAML parsing, required fields, type checking
    ↓
Content Validation
    └─→ Markdown syntax, length requirements
    ↓
Success/Error Response
```

---

## Database Schema Considerations

### Skill Storage

Consider how to store skill metadata:

```typescript
// Pseudo-code for database schema
interface Skill {
  id: string;
  name: string;                    // From frontmatter
  description: string;             // From frontmatter
  slug: string;                    // kebab-case directory name
  category?: string;              // Optional
  tags: string[];                 // Optional
  author?: string;                // Optional
  version?: string;               // Optional
  dependencies: string[];         // Optional: other skill slugs

  // File system paths
  rootPath: string;               // .claude/skills/skill-slug/
  skillMdPath: string;            // Full path to SKILL.md

  // Content
  frontmatter: Record<string, any>;
  content: string;               // Markdown content of SKILL.md

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastValidated: Date;
  isValid: boolean;
  validationErrors: ValidationError[];

  // Organization
  scope: "user" | "project" | "plugin";  // Where skill is stored
  referenceFiles: ReferenceFile[];       // Optional docs, examples, etc.
}

interface ReferenceFile {
  path: string;                  // Relative to skill root
  name: string;
  type: "doc" | "example" | "template" | "sample" | "config";
  description?: string;
}
```

---

## Core Implementation Components

### 1. File Type Detector

Determine if an uploaded file/directory is a skill, agent, or command.

```typescript
// File type detection logic
type FileType = "agent" | "command" | "skill";

function detectFileType(path: string, stats: FileStats): FileType {
  // Is it a directory?
  if (stats.isDirectory()) {
    // Check if it has SKILL.md
    const skillMdPath = join(path, "SKILL.md");
    if (existsSync(skillMdPath)) {
      return "skill";  // It's a skill directory
    }
    // Otherwise, not a valid Claude Code file
    throw new Error("Directory must contain SKILL.md to be a skill");
  }

  // Is it a file?
  if (stats.isFile()) {
    // Check if it's .md
    if (!path.endsWith(".md")) {
      throw new Error("Must be .md file");
    }

    // Could be agent or command - check by location
    if (path.includes(".claude/agents")) {
      return "agent";
    } else if (path.includes(".claude/commands")) {
      return "command";
    }

    throw new Error("Unknown file type");
  }

  throw new Error("Not a file or directory");
}
```

### 2. Structure Validator

Validate skill directory structure.

```typescript
interface ValidationError {
  code: string;
  message: string;
  severity: "error" | "warning" | "info";
  path?: string;
  suggestion?: string;
}

function validateSkillStructure(skillPath: string): {
  valid: boolean;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];

  // Rule 1: Must be a directory
  if (!isDirectory(skillPath)) {
    errors.push({
      code: "NOT_DIRECTORY",
      message: "Skill must be a directory",
      severity: "error",
      suggestion: "Create a directory structure"
    });
    return { valid: false, errors };
  }

  // Rule 2: Directory name must be kebab-case
  const dirName = basename(skillPath);
  if (!isKebabCase(dirName)) {
    errors.push({
      code: "INVALID_DIR_NAME",
      message: `Directory name must be kebab-case, got: ${dirName}`,
      severity: "error",
      suggestion: `Rename directory to: ${toKebabCase(dirName)}`
    });
  }

  // Rule 3: Must contain SKILL.md
  const skillMdPath = join(skillPath, "SKILL.md");
  if (!existsSync(skillMdPath)) {
    errors.push({
      code: "MISSING_SKILL_MD",
      message: "Missing SKILL.md file",
      severity: "error",
      suggestion: "Create SKILL.md file in skill directory"
    });
    return { valid: false, errors };
  }

  // Rule 4: Cannot have other SKILL.* files
  const skillFiles = listFiles(skillPath)
    .filter(f => f.startsWith("SKILL."));

  if (skillFiles.length > 1) {
    errors.push({
      code: "MULTIPLE_SKILL_DEFINITIONS",
      message: `Found ${skillFiles.length} SKILL files, need exactly 1`,
      severity: "error",
      suggestion: `Remove: ${skillFiles.filter(f => f !== "SKILL.md").join(", ")}`
    });
  }

  // Rule 5: No loose .md files at root (except SKILL.md)
  const rootMarkdownFiles = listFiles(skillPath)
    .filter(f => f.endsWith(".md") && f !== "SKILL.md");

  if (rootMarkdownFiles.length > 0) {
    errors.push({
      code: "LOOSE_MARKDOWN_FILES",
      message: `Found ${rootMarkdownFiles.length} markdown files at root`,
      severity: "warning",
      suggestion: `Move to subdirectories: docs/, examples/, etc.`
    });
  }

  return {
    valid: errors.some(e => e.severity === "error").length === 0,
    errors
  };
}

// Helper functions
function isKebabCase(str: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str);
}

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
```

### 3. Frontmatter Validator

Validate SKILL.md frontmatter.

```typescript
interface FrontmatterSchema {
  name: { type: "string"; required: true; min: 2; max: 200 };
  description: { type: "string"; required: true; min: 10; max: 500 };
  category?: { type: "string"; max: 50 };
  tags?: { type: "string[]"; max: 20 };
  author?: { type: "string"; max: 100 };
  version?: { type: "string"; pattern: "X.Y.Z" };
  dependencies?: { type: "string[]" };
}

function validateFrontmatter(
  frontmatter: Record<string, any>
): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Required: name
  if (!frontmatter.name || typeof frontmatter.name !== "string") {
    errors.push({
      code: "MISSING_NAME",
      message: "'name' is required and must be a string",
      severity: "error"
    });
  } else if (frontmatter.name.length < 2 || frontmatter.name.length > 200) {
    errors.push({
      code: "INVALID_NAME_LENGTH",
      message: "'name' must be 2-200 characters",
      severity: "error"
    });
  }

  // Required: description
  if (!frontmatter.description || typeof frontmatter.description !== "string") {
    errors.push({
      code: "MISSING_DESCRIPTION",
      message: "'description' is required and must be a string",
      severity: "error"
    });
  } else if (
    frontmatter.description.length < 10 ||
    frontmatter.description.length > 500
  ) {
    errors.push({
      code: "INVALID_DESCRIPTION_LENGTH",
      message: "'description' must be 10-500 characters",
      severity: "error"
    });
  }

  // Optional: tags validation
  if (frontmatter.tags !== undefined) {
    if (!Array.isArray(frontmatter.tags)) {
      errors.push({
        code: "INVALID_TAGS_TYPE",
        message: "'tags' must be an array of strings",
        severity: "error"
      });
    } else if (frontmatter.tags.length > 20) {
      errors.push({
        code: "TOO_MANY_TAGS",
        message: "Maximum 20 tags allowed",
        severity: "warning"
      });
    }
  }

  // Optional: version validation
  if (frontmatter.version !== undefined) {
    const semverPattern = /^\d+\.\d+\.\d+$/;
    if (typeof frontmatter.version !== "string" || !semverPattern.test(frontmatter.version)) {
      errors.push({
        code: "INVALID_VERSION_FORMAT",
        message: "Version should follow semantic versioning (X.Y.Z)",
        severity: "warning"
      });
    }
  }

  // Optional: dependencies validation
  if (frontmatter.dependencies !== undefined) {
    if (!Array.isArray(frontmatter.dependencies)) {
      errors.push({
        code: "INVALID_DEPENDENCIES_TYPE",
        message: "'dependencies' must be an array of skill names",
        severity: "error"
      });
    }
  }

  return {
    valid: errors.filter(e => e.severity === "error").length === 0,
    errors
  };
}
```

### 4. Content Validator

Validate markdown content.

```typescript
function validateContent(content: string): {
  valid: boolean;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];

  // Rule 1: Must have meaningful content
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    errors.push({
      code: "EMPTY_CONTENT",
      message: "File has no content",
      severity: "error"
    });
    return { valid: false, errors };
  }

  // Rule 2: Minimum content length
  if (trimmed.length < 50) {
    errors.push({
      code: "CONTENT_TOO_SHORT",
      message: "Content is too short (minimum 50 characters)",
      severity: "warning"
    });
  }

  // Rule 3: Check for script tags
  if (content.includes("<script")) {
    errors.push({
      code: "SCRIPT_TAG_FOUND",
      message: "Script tags are not allowed",
      severity: "error"
    });
  }

  // Rule 4: Check for headings
  if (!content.match(/^#{1,6}\s/m)) {
    errors.push({
      code: "NO_HEADINGS",
      message: "Should contain at least one markdown heading",
      severity: "warning"
    });
  }

  // Rule 5: Validate code blocks have language
  const codeBlockPattern = /```(\w*)\n/g;
  const matches = content.match(codeBlockPattern) || [];
  const emptyLang = matches.filter(m => m === "```\n");

  if (emptyLang.length > 0) {
    errors.push({
      code: "CODE_BLOCK_NO_LANGUAGE",
      message: `${emptyLang.length} code block(s) missing language specification`,
      severity: "warning",
      suggestion: "Add language to code blocks: ```javascript"
    });
  }

  return {
    valid: errors.filter(e => e.severity === "error").length === 0,
    errors
  };
}
```

### 5. Skill Creation Workflow

Handle skill creation with proper structure generation.

```typescript
interface CreateSkillRequest {
  name: string;              // User-provided name
  description: string;       // User-provided description
  category?: string;
  tags?: string[];
  scope: "user" | "project" | "plugin";
}

async function createSkill(request: CreateSkillRequest): Promise<Skill> {
  // Step 1: Validate input
  if (!request.name?.trim()) {
    throw new Error("Name is required");
  }
  if (!request.description?.trim()) {
    throw new Error("Description is required");
  }

  // Step 2: Generate kebab-case directory name
  const slug = toKebabCase(request.name);

  // Step 3: Check for conflicts
  const skillPath = getSkillPath(slug, request.scope);
  if (existsSync(skillPath)) {
    throw new Error(`Skill '${slug}' already exists`);
  }

  // Step 4: Create directory structure
  const fs = require("fs");
  fs.mkdirSync(skillPath, { recursive: true });

  // Step 5: Create SKILL.md with template
  const frontmatter = {
    name: request.name,
    description: request.description,
    ...(request.category && { category: request.category }),
    ...(request.tags && { tags: request.tags })
  };

  const skillMdContent = generateSkillTemplate(frontmatter);
  const skillMdPath = join(skillPath, "SKILL.md");
  fs.writeFileSync(skillMdPath, skillMdContent, "utf-8");

  // Step 6: Validate created skill
  const structureValidation = validateSkillStructure(skillPath);
  if (!structureValidation.valid) {
    // Rollback on validation failure
    fs.rmSync(skillPath, { recursive: true });
    throw new Error(
      `Created skill failed validation: ${structureValidation.errors[0].message}`
    );
  }

  // Step 7: Load and return skill
  return await loadSkill(skillPath);
}

function generateSkillTemplate(frontmatter: Record<string, any>): string {
  const yaml = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}:\n${value.map(v => `  - "${v}"`).join("\n")}`;
      }
      return `${key}: "${value}"`;
    })
    .join("\n");

  return `---
${yaml}
---

# ${frontmatter.name}

## Overview

Brief description of what this skill does and why someone would use it.

## Capabilities

- Capability 1
- Capability 2
- Capability 3

## Usage

How to use this skill.

## Examples

Example usage and output.
`;
}
```

### 6. Skill Upload Handler

Handle skill file/directory uploads.

```typescript
interface UploadResult {
  success: boolean;
  skillPath?: string;
  errors: ValidationError[];
  warnings: ValidationError[];
}

async function uploadSkill(
  uploadedPath: string,
  destinationScope: "user" | "project" | "plugin"
): Promise<UploadResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Step 1: Detect what was uploaded
  let skillDirPath: string;
  const stats = fs.statSync(uploadedPath);

  if (stats.isDirectory()) {
    // Uploaded a directory - validate as skill
    const structValidation = validateSkillStructure(uploadedPath);
    errors.push(...structValidation.errors.filter(e => e.severity === "error"));
    warnings.push(...structValidation.errors.filter(e => e.severity === "warning"));

    if (errors.length > 0) {
      return { success: false, errors, warnings };
    }

    skillDirPath = uploadedPath;
  } else if (uploadedPath.endsWith(".md")) {
    // Uploaded a file - check if it's SKILL.md
    if (basename(uploadedPath) === "SKILL.md") {
      // Create directory structure
      const skillName = prompt("Enter skill name:");
      if (!skillName) {
        errors.push({
          code: "CANCELED",
          message: "Upload canceled",
          severity: "error"
        });
        return { success: false, errors, warnings };
      }

      const slug = toKebabCase(skillName);
      skillDirPath = getSkillPath(slug, destinationScope);
      fs.mkdirSync(skillDirPath, { recursive: true });
      fs.copyFileSync(uploadedPath, join(skillDirPath, "SKILL.md"));
    } else {
      errors.push({
        code: "INVALID_UPLOAD",
        message: "Uploaded .md file must be named SKILL.md",
        severity: "error"
      });
      return { success: false, errors, warnings };
    }
  } else {
    errors.push({
      code: "INVALID_FILE_TYPE",
      message: "Must upload skill directory or SKILL.md file",
      severity: "error"
    });
    return { success: false, errors, warnings };
  }

  // Step 2: Validate complete skill
  const contentValidation = validateContent(
    fs.readFileSync(join(skillDirPath, "SKILL.md"), "utf-8")
  );
  warnings.push(...contentValidation.errors);

  // Step 3: Move to final location if needed
  const finalPath = getSkillPath(basename(skillDirPath), destinationScope);
  if (skillDirPath !== finalPath) {
    if (existsSync(finalPath)) {
      errors.push({
        code: "SKILL_EXISTS",
        message: `Skill '${basename(skillDirPath)}' already exists`,
        severity: "error"
      });
      return { success: false, errors, warnings };
    }
    fs.renameSync(skillDirPath, finalPath);
  }

  // Step 4: Return success
  return {
    success: true,
    skillPath: finalPath,
    errors,
    warnings
  };
}
```

### 7. UI Component: Skill Editor

React component for editing skills.

```typescript
interface SkillEditorProps {
  skill: Skill;
  onSave: (skill: Skill) => Promise<void>;
  onError: (errors: ValidationError[]) => void;
}

function SkillEditor({ skill, onSave, onError }: SkillEditorProps) {
  const [frontmatter, setFrontmatter] = useState(skill.frontmatter);
  const [content, setContent] = useState(skill.content);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const handleSave = async () => {
    // Validate frontmatter
    const fmErrors = validateFrontmatter(frontmatter);
    if (!fmErrors.valid) {
      setErrors(fmErrors.errors);
      onError(fmErrors.errors);
      return;
    }

    // Validate content
    const contentErrors = validateContent(content);
    if (contentErrors.errors.some(e => e.severity === "error")) {
      setErrors(contentErrors.errors);
      onError(contentErrors.errors);
      return;
    }

    // Save skill
    try {
      const updated: Skill = {
        ...skill,
        frontmatter,
        content
      };
      await onSave(updated);
      setErrors(contentErrors.errors); // Show warnings only
    } catch (error) {
      onError([{
        code: "SAVE_ERROR",
        message: error.message,
        severity: "error"
      }]);
    }
  };

  return (
    <div>
      <FrontmatterEditor
        value={frontmatter}
        onChange={setFrontmatter}
        errors={errors.filter(e => e.path === "frontmatter")}
      />
      <MarkdownEditor
        value={content}
        onChange={setContent}
        errors={errors.filter(e => e.path === "content")}
      />
      <ValidationSummary errors={errors} />
      <button onClick={handleSave}>Save Skill</button>
    </div>
  );
}
```

---

## UI/UX Implementation

### Skill Creation Dialog

```typescript
function CreateSkillDialog() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const handleCreate = async () => {
    const result = await createSkill({
      name,
      description,
      category: category || undefined,
      tags: tags.length > 0 ? tags : undefined,
      scope: "user"
    });

    // Show success and open in editor
    navigateToSkill(result.id);
  };

  return (
    <Dialog>
      <DialogTitle>Create New Skill</DialogTitle>
      <DialogContent>
        <Input
          label="Skill Name"
          value={name}
          onChange={setName}
          placeholder="My Awesome Skill"
          help="Will be converted to kebab-case directory name"
        />
        <Textarea
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder="What does this skill do?"
          maxLength={500}
        />
        <Select
          label="Category"
          value={category}
          onChange={setCategory}
          options={[
            "development",
            "data",
            "analysis",
            "utilities",
            "other"
          ]}
        />
        <TagInput
          label="Tags"
          value={tags}
          onChange={setTags}
          maxTags={5}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCreate}>Create Skill</Button>
      </DialogActions>
    </Dialog>
  );
}
```

### Skill File Browser

Show skills with proper visual hierarchy:

```typescript
function SkillBrowser({ skills }: { skills: Skill[] }) {
  return (
    <div className="skill-browser">
      {skills.map(skill => (
        <SkillCard key={skill.id} skill={skill}>
          <SkillName>{skill.name}</SkillName>
          <SkillDescription>{skill.description}</SkillDescription>

          <SkillDetails>
            <Badge>{skill.category}</Badge>
            {skill.tags?.map(tag => <Badge key={tag}>{tag}</Badge>)}
          </SkillDetails>

          <FileTree>
            {/* Show SKILL.md as main file */}
            <FileNode
              name="SKILL.md"
              icon="document-primary"
              isMain={true}
              onOpen={() => editSkill(skill)}
            />

            {/* Show reference files organized by type */}
            {skill.referenceFiles
              .filter(f => f.type === "doc")
              .map(f => (
                <FileNode
                  key={f.path}
                  name={basename(f.path)}
                  icon="document-secondary"
                  onOpen={() => viewFile(f)}
                />
              ))}

            {/* Show other reference file types in collapsible groups */}
            <CollapsibleGroup title="Examples" defaultOpen={false}>
              {skill.referenceFiles
                .filter(f => f.type === "example")
                .map(f => (
                  <FileNode key={f.path} name={basename(f.path)} />
                ))}
            </CollapsibleGroup>
          </FileTree>

          <SkillActions>
            <Button onClick={() => editSkill(skill)}>Edit</Button>
            <Button onClick={() => deploySkill(skill)}>Deploy</Button>
            <Button onClick={() => deleteSkill(skill)}>Delete</Button>
          </SkillActions>
        </SkillCard>
      ))}
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe("validateSkillStructure", () => {
  it("should pass valid skill structure", () => {
    const result = validateSkillStructure("/path/to/my-skill");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail if not a directory", () => {
    const result = validateSkillStructure("/path/to/my-skill.md");
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("NOT_DIRECTORY");
  });

  it("should fail if directory name is not kebab-case", () => {
    const result = validateSkillStructure("/path/to/MySkill");
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("INVALID_DIR_NAME");
  });

  it("should fail if SKILL.md is missing", () => {
    const result = validateSkillStructure("/path/to/my-skill");
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("MISSING_SKILL_MD");
  });
});

describe("validateFrontmatter", () => {
  it("should pass valid frontmatter", () => {
    const result = validateFrontmatter({
      name: "My Skill",
      description: "A useful skill for doing things"
    });
    expect(result.valid).toBe(true);
  });

  it("should fail if name is missing", () => {
    const result = validateFrontmatter({
      description: "A useful skill"
    });
    expect(result.valid).toBe(false);
  });

  it("should reject name that's too short", () => {
    const result = validateFrontmatter({
      name: "A",
      description: "Valid description"
    });
    expect(result.valid).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe("Skill Workflow", () => {
  it("should create, edit, and save skill", async () => {
    // Create
    const skill = await createSkill({
      name: "Test Skill",
      description: "A test skill",
      scope: "user"
    });

    expect(skill).toBeDefined();
    expect(skill.name).toBe("Test Skill");
    expect(skill.slug).toBe("test-skill");

    // Verify directory structure
    expect(existsSync(skill.rootPath)).toBe(true);
    expect(existsSync(skill.skillMdPath)).toBe(true);

    // Edit
    skill.frontmatter.tags = ["tag1", "tag2"];
    skill.content = `# Test Skill\n\nUpdated content`;

    // Save
    await saveSkill(skill);

    // Verify changes persisted
    const reloaded = await loadSkill(skill.skillMdPath);
    expect(reloaded.frontmatter.tags).toEqual(["tag1", "tag2"]);
  });
});
```

---

## Deployment Considerations

### Export/Deployment

```typescript
async function deploySkill(skill: Skill): Promise<DeploymentPackage> {
  // Step 1: Validate before export
  const validation = validateSkillStructure(skill.rootPath);
  if (!validation.valid) {
    throw new Error("Skill failed validation before deployment");
  }

  // Step 2: Create deployment package
  const package = {
    name: skill.slug,
    version: skill.version || "1.0.0",
    files: []
  };

  // Step 3: Include all files
  const files = walkDirectory(skill.rootPath);
  for (const file of files) {
    package.files.push({
      path: relative(skill.rootPath, file),
      content: readFileSync(file, "utf-8")
    });
  }

  // Step 4: Create deployment artifact
  const zip = new ZipFile();
  for (const file of package.files) {
    zip.addFile(file.path, file.content);
  }

  return zip.toBuffer();
}
```

---

## Performance Considerations

### Caching

- Cache validation results for skills that haven't changed
- Cache file structure for large skills with many reference files
- Invalidate cache when skill is modified

### Lazy Loading

- Don't load all reference files immediately
- Load on-demand when user expands file tree
- Cache loaded reference files

---

## Security Considerations

### File Validation

- Validate file paths to prevent directory traversal
- Restrict file types in reference directories
- Scan for malicious content

### YAML Parsing

- Use safe YAML parsing (no code execution)
- Validate field types strictly
- Set limits on array/object sizes

---

## Resources

- [Skills Subdirectory Structure Guide](./skills-subdirectory-structure.md)
- [Validation Rules Reference](./validation-rules-reference.md)
- [Skill Template Guidelines](./skill-template-guidelines.md)
- [SKILLS-README.md](./SKILLS-README.md)

---

**Last Updated**: 11/02/2025
