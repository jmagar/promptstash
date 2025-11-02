# Skill Template Guidelines

**Date**: 11/02/2025
**Version**: 1.0.0

Template guidelines and examples for creating well-structured skill files in PromptStash.

---

## Quick Start Template

Use this template when creating a new skill:

```markdown
---
name: "Skill Name"
description: "Brief description of what this skill does"
category: "category-name"
tags: ["tag1", "tag2"]
---

# Skill Name

## Overview

Concise description of the skill and its main purpose.

## Capabilities

- Capability 1
- Capability 2
- Capability 3

## Usage

How to use this skill.

## Examples

Example usage and output.
```

---

## Minimal Template

For simple skills, use this minimal structure:

**Directory Structure**:
```
skill-name/
└── SKILL.md
```

**SKILL.md Content**:
```markdown
---
name: "Simple Skill"
description: "What this skill does"
---

# Simple Skill

## Overview

Description of the skill.

## How to Use

Instructions for using this skill.
```

---

## Full-Featured Template

For comprehensive skills with multiple sections:

**Directory Structure**:
```
complex-skill/
├── SKILL.md
├── docs/
│   ├── getting-started.md
│   ├── api-reference.md
│   ├── examples.md
│   └── troubleshooting.md
├── templates/
│   ├── basic.txt
│   └── advanced.txt
├── samples/
│   ├── input.json
│   └── output.json
└── presets.json
```

**SKILL.md Content**:
```markdown
---
name: "Complex Skill"
description: "Comprehensive description of the skill"
category: "category"
tags: ["tag1", "tag2", "tag3"]
author: "Author Name"
version: "1.0.0"
dependencies: ["other-skill"]
---

# Complex Skill

## Overview

Comprehensive overview of what this skill does, who should use it,
and what problems it solves.

## Features

- Feature 1: Description
- Feature 2: Description
- Feature 3: Description

## Getting Started

Quick start guide. See [Getting Started Guide](./docs/getting-started.md) for details.

### Installation

Any setup required.

### Basic Usage

Simple example to get started.

```javascript
// Example code
const result = skill.process(input);
```

## Capabilities

Detailed list of what the skill can do:

### Data Processing
- Parse various formats
- Transform data structures
- Validate schemas

### Analysis
- Generate reports
- Identify patterns
- Provide recommendations

### Integration
- Connect to external services
- Stream data
- Support webhooks

## Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `input` | string | Yes | Input data to process | `"raw data"` |
| `format` | enum | No | Output format | `"json"` or `"csv"` |
| `options` | object | No | Additional options | `{ verbose: true }` |

## Examples

### Basic Example

Input:
```json
{
  "data": "sample data"
}
```

Output:
```json
{
  "result": "processed data"
}
```

See [Examples](./docs/examples.md) for more.

## Advanced Usage

For advanced patterns and techniques, see [Advanced Usage](./docs/api-reference.md).

## Best Practices

1. Always validate input before processing
2. Use the recommended parameter values
3. Handle errors gracefully
4. Document custom configurations

See [Best Practices](./docs/getting-started.md#best-practices) for details.

## Limitations

- Works with inputs up to 1MB
- Requires supported data formats
- Some features require additional configuration

See [Limitations](./docs/troubleshooting.md#limitations) for details.

## Troubleshooting

Common issues and solutions. See [Troubleshooting Guide](./docs/troubleshooting.md) for detailed help.

### Issue: Processing fails on large inputs

**Solution**: Split input into smaller chunks and process separately.

## Dependencies

This skill depends on:
- `other-skill`: Required for extended functionality

## Configuration

Optional configuration via `presets.json`:

```json
{
  "default": {
    "timeout": 5000,
    "retries": 3
  }
}
```

## Support & Contributing

For questions or issues, see the troubleshooting guide or open an issue.

## Version History

- **1.0.0** (2025-11-02): Initial release
```

---

## Section-by-Section Guide

### Frontmatter Section

```yaml
---
name: "Display Name"              # How it appears in UI
description: "Brief description"  # One-line summary
category: "development"           # Primary category
tags: ["tag1", "tag2"]           # For searching/filtering
author: "Your Name"              # Optional: who created it
version: "1.0.0"                 # Optional: semantic version
dependencies: []                 # Optional: other skills needed
---
```

**Guidelines**:
- `name`: 2-50 characters, should be clear and descriptive
- `description`: 10-500 characters, explains the main purpose
- `category`: One primary category (e.g., "development", "data", "analysis")
- `tags`: 2-5 most relevant tags, lowercase
- `version`: Use semantic versioning if tracking versions

### Overview Section

```markdown
## Overview

Explain what this skill does and why someone would use it.
Include the main problem it solves or value it provides.
Keep to 2-4 sentences maximum.
```

**Good Example**:
```markdown
## Overview

The Data Transformer skill provides utilities for converting
between multiple data formats (JSON, CSV, XML) with automatic
schema detection and validation. Use this skill when you need
to work with data in different formats or migrate data between systems.
```

**Bad Example**:
```markdown
## Overview

This skill is useful.
```

### Capabilities Section

```markdown
## Capabilities

- Capability 1: Brief description
- Capability 2: Brief description
- Capability 3: Brief description
```

**Guidelines**:
- Use bullet points
- Keep descriptions under 10 words
- Group related capabilities
- List 3-10 main capabilities

### Usage/Getting Started Section

```markdown
## Getting Started

### Quick Start

The fastest way to use this skill:

\`\`\`javascript
// Your quickest example
\`\`\`

### Installation

Any prerequisites or setup steps.

### Basic Usage

Simple example showing how to use the skill.
```

### Parameters Section

```markdown
## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `input` | string | Yes | Description of input |
| `options` | object | No | Optional configuration |

### Input Format

Detailed description of expected input structure.

### Output Format

Detailed description of returned output structure.
```

### Examples Section

```markdown
## Examples

### Example 1: Basic Usage

Description of what this example shows.

Input:
\`\`\`json
{ "data": "sample" }
\`\`\`

Output:
\`\`\`json
{ "result": "processed" }
\`\`\`

### Example 2: Advanced Usage

Description of what this example shows.

\`\`\`python
# Code example
\`\`\`
```

### Limitations Section

```markdown
## Limitations

- Limitation 1: Description
- Limitation 2: Description
- Limitation 3: Description

### Known Issues

- Issue 1: Workaround or expected fix
- Issue 2: Workaround or expected fix
```

**Guidelines**:
- Be honest about limitations
- Provide workarounds if possible
- Note any performance constraints
- Mention platform or version requirements

### Troubleshooting Section

```markdown
## Troubleshooting

### Problem: Error message appears

**Symptom**: When using X, the error "Y" appears

**Cause**: Description of why this happens

**Solution**: Steps to fix or work around

**Prevention**: How to avoid in the future

### Problem: Feature doesn't work as expected

**Symptom**: Description of the problem

**Cause**: Root cause

**Solution**: Steps to resolve
```

---

## Common Patterns

### Data Transformation Skill

```markdown
---
name: "Data Transformer"
description: "Convert between JSON, CSV, and XML formats"
category: "data"
tags: ["transformation", "data-format", "conversion"]
---

# Data Transformer

## Overview

Convert data between JSON, CSV, and XML formats with automatic validation.

## Supported Formats

- JSON: JavaScript Object Notation
- CSV: Comma-Separated Values
- XML: eXtensible Markup Language

## Parameters

| Parameter | Type | Required |
|-----------|------|----------|
| `input` | string | Yes |
| `inputFormat` | enum | Yes |
| `outputFormat` | enum | Yes |
| `options` | object | No |

## Examples

### JSON to CSV

Input:
\`\`\`json
[
  { "name": "Alice", "age": 30 },
  { "name": "Bob", "age": 25 }
]
\`\`\`

Output:
\`\`\`
name,age
Alice,30
Bob,25
\`\`\`
```

### Code Analysis Skill

```markdown
---
name: "Code Analyzer"
description: "Analyze code for quality, security, and performance issues"
category: "development"
tags: ["analysis", "quality", "security"]
---

# Code Analyzer

## Overview

Comprehensive code analysis for identifying issues and improvements.

## Analysis Types

### Security Analysis
Identify potential vulnerabilities and security risks.

### Quality Analysis
Check for code quality issues and anti-patterns.

### Performance Analysis
Find performance bottlenecks and optimization opportunities.

## Supported Languages

- JavaScript
- TypeScript
- Python
- Java
- Go

## Usage

```typescript
const analyzer = new CodeAnalyzer();
const result = analyzer.analyze(code, language, checks);
```

## Output

```json
{
  "issues": [
    {
      "type": "security",
      "severity": "high",
      "line": 42,
      "message": "SQL injection vulnerability"
    }
  ]
}
```
```

### Utility Function Skill

```markdown
---
name: "String Utilities"
description: "Common string manipulation and formatting functions"
category: "utilities"
tags: ["string", "formatting", "text"]
---

# String Utilities

## Overview

Collection of string manipulation utilities for common tasks.

## Functions

### camelCase(string)
Convert string to camelCase format.

### kebabCase(string)
Convert string to kebab-case format.

### snakeCase(string)
Convert string to snake_case format.

### titleCase(string)
Convert string to Title Case format.

## Examples

```javascript
camelCase("hello world")           // "helloWorld"
kebabCase("hello world")           // "hello-world"
snakeCase("hello world")           // "hello_world"
titleCase("hello world")           // "Hello World"
```
```

---

## Frontmatter Field Reference

### Required Fields

| Field | Type | Min/Max | Notes |
|-------|------|---------|-------|
| `name` | string | 2/200 | Display name, PascalCase preferred |
| `description` | string | 10/500 | One-line summary of skill purpose |

### Recommended Fields

| Field | Type | Min/Max | Notes |
|-------|------|---------|-------|
| `category` | string | 3/50 | One primary category |
| `tags` | string[] | 2-5 items | Lowercase tags for searching |

### Optional Fields

| Field | Type | Min/Max | Notes |
|-------|------|---------|-------|
| `author` | string | 1/100 | Creator name |
| `version` | string | 5/20 | Semantic version (X.Y.Z) |
| `dependencies` | string[] | - | Names of required skills |

---

## Documentation Organization Patterns

### For Simple Skills

Single `SKILL.md` file is sufficient.

```
skill-name/
└── SKILL.md
```

### For Skills with Examples

Add examples in subdirectory.

```
skill-name/
├── SKILL.md
└── examples/
    ├── example1.md
    ├── example2.md
    └── README.md
```

### For Skills with Templates

Add reusable templates.

```
skill-name/
├── SKILL.md
├── templates/
│   ├── basic.txt
│   ├── advanced.txt
│   └── README.md
└── samples/
    ├── input.json
    └── output.json
```

### For Complex Skills

Organize into logical sections.

```
skill-name/
├── SKILL.md
├── docs/
│   ├── getting-started.md
│   ├── api-reference.md
│   ├── examples.md
│   ├── troubleshooting.md
│   └── best-practices.md
├── templates/
│   └── ...
└── presets/
    └── configurations.json
```

---

## Quality Checklist

Before submitting a skill, verify:

### Structure
- [ ] Skill is in subdirectory with kebab-case name
- [ ] Contains exactly one `SKILL.md` (uppercase)
- [ ] Optional files organized in subdirectories
- [ ] No loose `.md` files at skill root (except `SKILL.md`)

### Frontmatter
- [ ] Has valid YAML frontmatter
- [ ] Has `name` field (2-200 chars)
- [ ] Has `description` field (10-500 chars)
- [ ] `name` matches directory name (kebab-case dir vs PascalCase name)
- [ ] `tags` is array of lowercase strings
- [ ] `version` follows semantic versioning if present

### Content
- [ ] Has meaningful content beyond frontmatter
- [ ] Includes Overview section
- [ ] Includes at least one example
- [ ] Code blocks have language specified
- [ ] No script tags or raw HTML
- [ ] All links are relative or valid URLs
- [ ] Content is at least 50 characters of meaningful text

### Clarity
- [ ] Overview explains purpose clearly
- [ ] Examples are realistic and runnable
- [ ] Parameter documentation is complete
- [ ] Limitations are clearly stated
- [ ] Troubleshooting section addresses common issues

### Organization
- [ ] Sections follow logical flow
- [ ] Headings are properly formatted (##, ###, etc.)
- [ ] Lists use consistent formatting
- [ ] Tables are properly formatted
- [ ] Code samples are properly indented

---

## Tips & Best Practices

### Writing Tips

1. **Be clear and concise**: Users scan quickly, make it easy
2. **Use examples**: Code examples are worth a thousand words
3. **Be honest**: Document limitations and edge cases
4. **Stay organized**: Use consistent heading hierarchy
5. **Link within docs**: Use internal links for related sections

### Formatting Tips

1. **Code blocks**: Always specify language (javascript, python, json, etc.)
2. **Tables**: Use for structured data (parameters, comparisons)
3. **Lists**: Use for capabilities, steps, guidelines
4. **Emphasis**: Use bold for UI elements, code for technical terms
5. **Consistent style**: Match existing documentation style

### Example Tips

1. **Start simple**: Basic example first, advanced later
2. **Show input and output**: Make expectations clear
3. **Comment code**: Explain non-obvious parts
4. **Real-world**: Use realistic examples when possible
5. **Error handling**: Show what happens when things go wrong

---

## Resources

- [Skills Subdirectory Structure Guide](./skills-subdirectory-structure.md)
- [Validation Rules Reference](./validation-rules-reference.md)
- [Claude Code Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills.md)
