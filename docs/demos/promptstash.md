# PromptStash

**Version:** 1.0.0
**Last Updated:** 2025-01-02
**Repository:** https://github.com/jmagar/promptstash

**Description:** Manage and organize your Claude Code prompts, agents, skills, commands, hooks, and settings in a centralized web app with validation, documentation integration, templates, and smart enhancements via the Claude Agent SDK.

## Relevant Documentation

- [build-elevate monorepo template](https://github.com/vijaysingh2219/build-elevate)
- [Claude Code: Sub-Agents](https://docs.claude.com/en/docs/claude-code/sub-agents.md)
- [Claude Code: Skills](https://docs.claude.com/en/docs/claude-code/skills.md)
- [Claude Code: Hooks Guide](https://docs.claude.com/en/docs/claude-code/hooks-guide.md)
- [Claude Code: Settings](https://docs.claude.com/en/docs/claude-code/settings.md)
- [Claude Code: Memory](https://docs.claude.com/en/docs/claude-code/memory.md)
- [Claude Code: Slash Commands](https://docs.claude.com/en/docs/claude-code/slash-commands.md)
- [Claude Code: Hooks](https://docs.claude.com/en/docs/claude-code/hooks.md)
- [Claude Code: GitHub Actions](https://docs.claude.com/en/docs/claude-code/github-actions.md)
- [Claude Code: MCP](https://docs.claude.com/en/docs/claude-code/mcp.md)
- [Claude Code: Plugins Reference](https://docs.claude.com/en/docs/claude-code/plugins-reference.md)
- [Claude Code: Plugins](https://docs.claude.com/en/docs/claude-code/plugins.md)
- [Claude Code: Plugin Marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces.md)
- [Claude Code: Common Workflows](https://docs.claude.com/en/docs/claude-code/common-workflows.md)
- [Claude Code: IAM](https://docs.claude.com/en/docs/claude-code/iam.md)
- [Claude Code: Statusline](https://docs.claude.com/en/docs/claude-code/statusline.md)
- [Claude Code: CLI Reference](https://docs.claude.com/en/docs/claude-code/cli-reference.md)
- [Claude Code: Security](https://docs.claude.com/en/docs/claude-code/security.md)
- [Claude Code: Headless](https://docs.claude.com/en/docs/claude-code/headless.md)
- [Claude Code: SDK Migration Guide](https://docs.claude.com/en/docs/claude-code/sdk/migration-guide.md)
- [Agent SDK: Overview](https://docs.claude.com/en/api/agent-sdk/overview.md)
- [Agent SDK: TypeScript](https://docs.claude.com/en/api/agent-sdk/typescript.md)
- [Agent SDK: Python](https://docs.claude.com/en/api/agent-sdk/python.md)

## Project Overview

When working with LLMs, you will often find yourself repeating yourself quite often. Whether it's creating similar prompts, agents, skills, or commands, the process can become tedious and error-prone. Not to mention IDE's are a bit on the clunkier side when it comes to just doing simple Markdown editing. Factor in multiple projects across multiple machines, and it becomes even more challenging to keep everything organized and consistent.

PromptStash aims to solve this problem by providing a centralized web app that acts as a tool to compose and manage all your Claude Code files (prompts, agents, skills, commands, hooks, etc) in a nice UI, with validation and tips/hints from the docs to help you create valid files.

Think of it as Google Drive + Github specifically for managing your Claude Code files (prompts, agents, skills, commands, hooks, etc) in `.md` format with `YAML` frontmatter or `.json`/`.jsonl` files. With built-in validation, guidance, tips, documentation integration, templates, and smart enhancements via the Claude Agent SDK.

PromptStash will help you stay organized, consistent, and efficient when working with Claude Code across multiple projects and machines.

## Table of Contents

- [Core Features](#core-features)
  - [Validation & Guidance](#validation--guidance)
  - [Hooks System](#hooks-system)
  - [Validation Requirements](#validation-requirements)
  - [Documentation Integration](#documentation-integration)
  - [Templates](#templates)
  - [Smart Enhancements via Claude Agent SDK](#smart-enhancements-via-claude-agent-sdk)
  - [Settings Management](#settings-management)
  - [Claude Code Session Viewer](#claude-code-session-viewer)
  - [Stash Scopes](#stash-scopes)
  - [Tagging System](#tagging-system)
  - [Search](#search)
  - [Claude Code Marketplace Integration](#claude-code-marketplace-integration)
  - [Versioning](#versioning)
  - [Sharing](#sharing)
  - [Statusline Configuration](#statusline-configuration)
  - [Deployment](#deployment)
  - [GitHub Actions Integration](#github-actions-integration)
- [User Interface](#user-interface)
  - [User Stories](#user-stories)
- [System Architecture](#system-architecture)
  - [Stash Structure](#stash-structure)
  - [Plugin Creation](#plugin-creation)
  - [Marketplace Creation](#marketplace-creation)
  - [MCP Server Configuration](#mcp-server-configuration)
- [Development](#development)
  - [Project Scaffolding](#project-scaffolding)
  - [Project Structure](#project-structure)
  - [Getting Started](#getting-started)
  - [Docker Setup](#docker-setup)
  - [Root-Level Scripts](#root-level-scripts)
  - [UI Components (shadcn/ui)](#ui-components-shadcnui)

## Key Features

- Beautiful Session Viewer for `.jsonl` files
- Deployment of files to your project environment
- GitHub Actions workflow generation
- Lightweight and fast Next.js + TailwindCSS v4 + ShadCN/UI web app
- Markdown/JSON editor with syntax highlighting and validation
- Marketplace browser and installation
- MCP Server Configuration management
- Plugin and Marketplace manifest creation tools
- Plugin installation and management
- Plugin integration from the Claude Code Plugin Marketplace
- Search functionality
- Sharing files/folders with other users
- Status Line Builder
- Tagging system for better organization and searching
- User, Project, Plugin, and Marketplace scoped stashes
- Versioning of files

## Technical Stack

- Next.js 16
- TailwindCSS v4
- ShadCN/UI
- Claude Agent SDK
- build-elevate monorepo template
- OAUTH authentication (GitHub, Google, etc)

---

# Core Features

## Validation & Guidance

Validation of YAML frontmatter and file contents for:

- `.claude/agents/YOUR_AGENT.md` - Agents
- `.claude/skills/YOUR_SKILL/SKILL.md` - Skills

**Note:** Skills require subdirectories with `SKILL.md` inside (e.g., `.claude/skills/code-review/SKILL.md`), not flat markdown files like agents or commands. The skill directory can also contain optional `reference.md` and `scripts/` subdirectory.

- `.claude/commands/YOUR_COMMAND.md` - Custom Slash Commands

Schema Validation for:

- MCP server configuration `.mcp.json`
- Claude Settings `settings.json`
- Hooks, also in `settings.json`
- Plugin manifest in `plugin.json`
- Marketplace manifest in `marketplace.json`

Tips, hints, and guidance for creating valid files based on Claude Code documentation.

## Hooks System

### Overview

Hooks are event-driven callbacks that execute at specific points in Claude Code's workflow. They enable advanced customization, security validation, and workflow automation. PromptStash provides a comprehensive UI and validation system for managing hooks.

### Hook Events

#### 11 Hook Event Types

**Tool Execution Hooks:**

- `PreToolUse` - Before any tool executes (requires matcher)
- `PostToolUse` - After tool completes (requires matcher)
- `PostCustomToolCall` - After MCP tools complete (requires matcher)

**Session Hooks:**

- `SessionStart` - When session begins
- `SessionEnd` - When session ends (reason: clear, logout, exit)

**User Interaction Hooks:**

- `UserPromptSubmit` - After user submits message
- `Notification` - On notification events

**Completion Hooks:**

- `Stop` - When main agent stops
- `SubagentStop` - When subagent completes

**System Hooks:**

- `PreCompact` - Before context compaction (requires matcher: manual, auto)

### Hook Configuration

**Location:** `settings.json` or plugin `hooks/hooks.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/validate-bash.sh",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

### Matchers

Matchers determine which tools trigger the hook. Multiple pattern types are supported:

**Pattern Types:**

- Exact: `"Bash"`, `"Edit"`
- Regex: `"Edit|Write"` (pipe-separated alternation)
- Wildcard: `"Bash(**)"` (suffix wildcard only)
- MCP Tools: `"mcp__server__tool"` (exact match, no wildcards supported)

**Matcher Validation:**

- Required for: `PreToolUse`, `PostToolUse`, `PostCustomToolCall`, `PreCompact`
- Optional for: All other hook types
- Must produce at least one valid match pattern

### Hook Output Schema

**Standard Response Format:**

All hooks must return a JSON object with the following required fields:

```json
{
  "continue": boolean,           // Continue execution? (true/false)
  "stopReason": string,         // Why stopped (required if continue=false)
  "suppressOutput": boolean,     // Hide hook output from user (true/false)
  "decision": "approve" | "block" | "ask",
  "hookSpecificOutput": {
    "permissionDecision": "allow" | "deny" | "ask",
    "updatedInput": {},         // Modify tool input (PreToolUse)
    "updatedOutput": {},        // Modify tool output (PostToolUse only)
    "additionalContext": ""     // Inject context into session
  }
}
```

**Validation Rules:**

- `continue` must be boolean
- If `continue=false`, `stopReason` must be non-empty string
- `decision` must be one of three exact values
- `hookSpecificOutput` fields depend on hook type

### Language Support

**TypeScript SDK:** All 11 hook event types fully supported

**Python SDK:** Limited support for 7 event types

- Supported: PreToolUse, PostToolUse, PostCustomToolCall, UserPromptSubmit, Stop, SubagentStop, PreCompact
- NOT Supported: SessionStart, SessionEnd, Notification

### PromptStash Implementation

#### 1. Hook Builder UI

**Event Type Selection:**

- Dropdown showing all 11 hook event types
- Descriptions for each event type
- Language-specific warnings (Python SDK limitations)
- Visual indicator for matcher requirement

**Matcher Configuration:**

- Pattern type selector (Exact, Regex, Wildcard, MCP)
- Text input with live validation
- Pattern preview showing matched tools
- Validator for regex syntax and wildcard placement
- Warning: "MCP tools do not support wildcards"

**Hook Payload Configuration:**

- Command vs Prompt type selector
- For commands: file path with autocomplete
- For prompts: Inline editor with syntax highlighting
- Timeout configuration (milliseconds, default 5000)
- Preview of hook execution flow

**Output Validation Preview:**

- Live validation against hook output schema
- Warnings for missing required fields
- Field autocomplete suggestions
- Example outputs for reference

#### 2. Validation Engine

**Comprehensive Checks:**

- Language detection (Python/TypeScript based on file location)
- Warn when using unsupported Python SDK events
- Validate matcher patterns against regex syntax rules
- Verify matcher produces at least one match
- Test hook output against schema
- Check timeout is positive integer

**Error Categories:**

- Configuration errors (missing matcher for PreToolUse)
- Language incompatibility (SessionStart in Python)
- Invalid patterns (malformed regex)
- Schema violations (missing continue field)
- Execution errors (timeout too low)

**Validation UI:**

- Real-time error highlights
- Inline fix suggestions
- "Run Validation" button for full check
- Validation report panel with severity levels

#### 3. Hook Templates

Pre-built templates for common use cases:

**Security Validation Template:**

- Block dangerous Bash commands (rm -rf, truncate)
- Whitelist approved command patterns
- Log attempts to blocked commands
- Ask user for confirmation on suspicious operations

**Code Formatting Template:**

- Trigger on PostToolUse for Edit tool
- Auto-format modified files
- Log formatting changes
- Inject style guide context

**Context Injection Template:**

- Trigger on UserPromptSubmit
- Inject project-specific context
- Add relevant documentation references
- Pre-populate with code snippets

**Notification Routing Template:**

- Trigger on completion hooks (Stop, SubagentStop)
- Route to Slack/Discord/Email
- Include job status, duration, artifacts
- Format messages for different channels

**Rate Limiting Template:**

- Prevent tool spam
- Track tool usage per session
- Ask for confirmation after N uses
- Log rate limit violations

#### 4. Hook Management Features

**CRUD Operations:**

- Create new hooks from templates or blank
- View all hooks with filter/search
- Edit hooks with live validation
- Delete hooks with confirmation
- Duplicate hooks for quick variants

**Organization:**

- Group hooks by event type
- Tag hooks with labels (security, productivity, custom)
- Enable/disable individual hooks
- Reorder hooks within event type
- Bulk actions (enable all, delete all)

**Testing & Debugging:**

- Mock tool inputs for preview
- Simulate hook execution
- View hook execution logs
- Test matcher patterns against tool names
- Dry-run before deployment

**Version History:**

- Track changes to hook definitions
- Revert to previous versions
- Compare versions side-by-side
- Annotate changes with descriptions

#### 5. Integration Points

**Settings Integration:**

- Export hooks to `settings.json`
- Import hooks from `settings.json`
- Validate full settings file with hooks
- Merge user/project/local hook definitions

**Plugin Hooks:**

- Manage hooks in `plugin.json` manifest
- Separate UI for plugin-scoped hooks
- Link to plugin documentation
- Validate against plugin hook schema

**Deployment:**

- Include hooks in deployment package
- Test hooks before deployment
- Rollback on validation failure
- Document hook changes in deployment notes

## Validation Requirements

### YAML Frontmatter Schemas

#### Agents (`/agents/YOUR_AGENT.md`)

```yaml
---
description: string (required, max 500 chars)
tools: string[] (optional, array of tool names)
model: 'sonnet' | 'opus' | 'haiku' | 'inherit' (optional)
allowed-tools: string[] (optional, alternative to tools)
disable-model-invocation: boolean (optional)
argument-hint: string (optional, usage hint for arguments)
---
```

**Validation Rules:**

- Description required, 500 character limit
- Tool names must be exact (case-sensitive)
- Model must be one of 4 values: 'sonnet', 'opus', 'haiku', or 'inherit'
- File name must be kebab-case (e.g., `security-reviewer.md`)
- Cannot use both `tools` and `allowed-tools` simultaneously

### Skills (`/skills/SKILL_NAME/SKILL.md`)

```yaml
---
description: string (required, max 500 chars)
---
```

**Directory Structure:**

- Must be in subdirectory: `.claude/skills/skill-name/SKILL.md`
- Can include optional `reference.md` file
- Can include optional `scripts/` subdirectory for supporting scripts
- Directory name must be kebab-case

### Commands (`/commands/COMMAND.md`)

```yaml
---
# Command schemas vary - validation required for content structure
---
```

**File Name Convention:**

- File: `fix-pr.md` → Command: `/fix-pr`
- Must be kebab-case (e.g., `deploy-prod.md`, `code-review.md`)
- File name directly maps to slash command name

## Special Syntax Support

### In Prompts & Agent Descriptions

**Arguments:**

- `$ARGUMENTS` - User-provided command arguments
- `@filename` - Reference files in prompt content
- `!\`command\`` - Execute shell commands inline

**Environment Variables:**

- `${CLAUDE_PLUGIN_ROOT}` - Plugin root directory path
- `${CLAUDE_PROJECT_DIR}` - Project directory path
- `$CLAUDE_ENV_FILE` - Session environment file path

## Naming Conventions

**Files:**

- Agents: `kebab-case.md` (e.g., `security-reviewer.md`, `code-formatter.md`)
- Skills: `kebab-case/` directories (e.g., `code-review/SKILL.md`, `documentation/SKILL.md`)
- Commands: `kebab-case.md` (e.g., `deploy-prod.md`, `test-coverage.md`)
- Plugin names: `kebab-case`, no spaces, 100 character limit
- Marketplace names: kebab-case, 100 character limit

**Character Limits:**

- Agent description: 500 characters maximum
- Skill description: 500 characters maximum
- Plugin name: 100 characters maximum
- Marketplace name: 100 characters maximum
- Argument hint: Brief usage hint (recommended under 200 chars)

## Permission Patterns

**Permission Modes:**

- `default` - Standard permission prompts for sensitive operations
- `acceptEdits` - Auto-accept file modifications (use with caution)
- `plan` - Planning mode, no code execution
- `bypassPermissions` - Bypass all permission checks (DANGEROUS - use sparingly)

**Path Patterns in Permissions:**

- `//path` - Absolute paths (e.g., `//home/user/project`)
- `~/path` - Home directory paths (e.g., `~/documents/file.md`)
- `/path` - Relative to settings location
- `path` - Relative to current working directory

**Tool Patterns in Permissions:**

- Exact match: `Bash(npm test)` - Allows exact command only
- Prefix wildcard: `Bash(npm run:*)` - Allows npm run with any target
- Domain wildcard: `WebFetch(domain:example.com)` - Allows requests to specified domain
- MCP servers: `mcp__server__tool` - Wildcards NOT supported for MCP tools

## MCP Server Validation

**Server Definition Types:**

**stdio (local execution):**

```json
{
  "command": "string (required)",
  "args": ["string"] (optional),
  "env": {"KEY": "value"} (optional)
}
```

**sse / http (remote server):**

```json
{
  "url": "string (required, must be valid URL)",
  "headers": {"KEY": "value"} (optional, for authentication)
}
```

**sdk:**

- Programmatic creation only
- Cannot be defined in JSON configuration file
- Used only in TypeScript/Python applications

**Validation Rules:**

- Command must exist in PATH (for stdio)
- URL must be valid HTTP/HTTPS endpoint (for sse/http)
- Environment variables must use valid names
- At least one of command or url required

## Plugin Manifest Validation

**File Location:** `plugin.json` (required)

**Required Fields:**

- `name` - kebab-case, max 100 characters, must be unique per marketplace

**Recommended Fields:**

- `version` - Semantic version (e.g., "1.0.0", "2.1.0-beta")
- `description` - Clear purpose statement (recommended under 500 chars)
- `author` - Object with: name, email, url
- `license` - SPDX identifier (e.g., "MIT", "Apache-2.0", "GPL-3.0")
- `homepage` - URL to plugin homepage or repository

**Component Paths:**

- Must start with `./` (e.g., `./agents/`, `./skills/code-review/`)
- Use `${CLAUDE_PLUGIN_ROOT}` for internal relative references
- Paths must be valid relative to plugin root directory

**Optional Fields:**

- `keywords` - Array of searchable keywords
- `repository` - Repository URL object or string
- `bugs` - Bug tracking URL or object
- `icon` - Path to plugin icon image (max 256x256)

## Marketplace Manifest Validation

**File Location:** `marketplace.json` (required)

**Plugin Sources Configuration:**

```json
// Relative path (local file)
{"source": "./plugins/my-plugin"}

// GitHub repository
{"source": {"type": "github", "repo": "owner/repo", "path": "plugins/my-plugin"}}

// Git URL
{"source": {"type": "url", "url": "https://github.com/owner/repo/tree/main/plugins/my-plugin"}}
```

**Marketplace Manifest Structure:**

```json
{
  "name": "my-marketplace",
  "description": "Marketplace description",
  "version": "1.0.0",
  "plugins": [
    {
      "name": "plugin-one",
      "source": "./plugins/plugin-one"
    }
  ]
}
```

**Validation Rules:**

- All plugin names must be unique within marketplace
- Source types must be valid (github, url, or relative path)
- GitHub repos must be accessible (valid owner/repo format)
- URLs must be valid HTTP/HTTPS endpoints
- Relative paths must point to valid directories
- Version must follow semantic versioning

**File Structure Validation:**

- `strict: false` only if `plugin.json` optional in plugins
- All referenced plugins must have discoverable manifests
- No circular dependencies between plugins
- Path references must be resolvable from marketplace root

## Documentation Integration

Full Claude Code documentation integrated into the app for reference while creating/editing files:

`docs/claude-code/` - Claude Code Docs

## Templates

Quickly create:

- `.claude/agents/YOUR_AGENT.md` - Creating Agents
- `.claude/skills/YOUR_SKILL/SKILL.md` - Creating Skills
- `.claude/commands/YOUR_COMMAND.md` - Creating Custom Slash Commands
- `marketplace/YOUR_MARKETPLACE/YOUR_PLUGIN/.claude-plugin/plugin.json` - Plugin Manifest
- `marketplace/YOUR_MARKETPLACE/marketplace.json` - Marketplace Manifest
- `.mcp.json` - MCP Server Configuration

## Smart Enhancements via Claude Agent SDK

Use the Claude Agent SDK to provide smart enhancements to the files in the stash.

## Settings Management

The app should have a JSON editor to edit/view any `.json` files in the stash, including the `.mcp.json` file for MCP server configurations.

### Settings Sources Configuration (SDK v0.1.0+)

#### Breaking Change Alert

**CRITICAL:** SDK v0.1.0 requires explicit `settingSources` configuration. Without this, `CLAUDE.md` files will be silently ignored.

#### Configuration

Settings sources control which locations the Claude Agent SDK searches for configuration files:

1. **`user`** - `~/.claude/CLAUDE.md` (global settings)
2. **`project`** - `<repo-root>/CLAUDE.md` (project settings, committed)
3. **`local`** - `.claude/CLAUDE.md` (local overrides, gitignored)

#### SDK Usage

**TypeScript:**

```typescript
settingSources: ["user", "project", "local"]; // Camel case
```

**Python:**

```python
setting_sources=["user", "project", "local"]  # Snake case
```

#### PromptStash Implementation

**UI Requirements:**

- Checkbox selection for which sources to enable
- Default: All three enabled (`['user', 'project', 'local']`)
- Warning when `CLAUDE.md` exists but no sources configured

**Validation:**

- Require at least one source if `CLAUDE.md` files exist
- Language-specific field names (camelCase vs snake_case)
- Valid values: only 'user', 'project', 'local'

## Claude Code Session Viewer

Beautiful, clean, modern conversation viewer for Claude Code `.jsonl` files located in `~/.claude/sessions` that shows the conversation in a readable format with messages, tool calls, etc. Built with SHADCN/UI + TailwindCSS v4.

## Stash Scopes

The app should support three levels of stashes:

1. User scoped stash
2. Project scoped stash
3. Plugin scoped stash
4. Marketplace scoped stash

Quickly swap between User, Project, Plugin, and Marketplace scoped stashes.

I'm thinking maybe a collapsible component in the sidebar that lets you switch between User, Individual Projects, and Plugins.

## Tagging System

There should also be a tags/labels system to tag files with custom tags/labels for better organization and searching. Tags like: frontend, backend, python, javascript, database, cache, optimization, typescript, react, testing, deployment, devops, ui/ux, performance, security, etc.

This way we could easily surface any files related to a specific topic or technology.

## Search

We should have a search bar (`ctrl + k`) to quickly search through your stash of files.

## Claude Code Marketplace Integration

Browse and install plugins and/or specific files from plugins from Claude Code Marketplaces directly into your stash.

## Versioning

We also need to devise a way to handle versioning of the files in the stash, maybe a simple version history for each file that shows previous versions and allows user to revert to a previous version. These files are just text files after all, so we can easily store previous versions as separate files or in a database.

## Sharing

We also need a share feature to share files/folders with other users of the app. Maybe generate a shareable link that others can use to access the shared files/folders. Options to set permissions (view only, edit, comment) on the shared files/folders.

## Statusline Configuration

### Overview

The statusline is a customizable status display in Claude Code that shows contextual information (model, workspace, cost, etc.) at the bottom of the interface. It enables users to create dynamic, script-based status displays that automatically update based on Claude Code context.

### Configuration Location

Statusline is configured in `settings.json` at the root of the user's workspace or project:

```json
{
  "statusLine": {
    "type": "command",
    "command": "path/to/script.sh",
    "padding": 0
  }
}
```

**Configuration Fields:**

- `type` - Must be `"command"` (future types may include static strings)
- `command` - Absolute or relative path to executable script/binary
- `padding` - Optional integer for display padding (0 for edge-to-edge, default varies)

### Script Requirements

Scripts receive environment context via stdin as JSON and output formatted text to stdout.

#### Input Format

Scripts receive a single JSON object via stdin containing:

```json
{
  "model": "claude-3.5-sonnet",
  "workspace": "/Users/developer/projects/myapp",
  "workspaceName": "myapp",
  "cost": "0.00127",
  "costCurrency": "USD",
  "tokensUsed": 2847,
  "tokensRemaining": 1000000,
  "apiUsagePercent": 0.2847,
  "sessionDuration": "00:15:32",
  "environment": "development",
  "timestamp": "2024-11-02T14:30:45Z",
  "additionalContext": {}
}
```

#### Output Format

Scripts must output a single line of text to stdout:

- ANSI color codes are fully supported for colorized output
- Maximum recommended length: 80 characters (display-dependent)
- Should be human-readable and fit in status bar width
- No trailing newlines required (will be stripped)

#### Script Requirements Checklist

- Must be executable (chmod +x)
- Must read from stdin
- Must output to stdout only (use stderr for debugging)
- Single line of text output
- Exit code 0 for success
- Exit code non-zero for errors (statusline will show error indicator)
- Must handle invalid JSON gracefully
- Should be fast (< 100ms execution time)
- Must not modify system state or have side effects

### PromptStash Implementation

#### Features

**1. Script Editor & Management**

- Full syntax highlighting for bash, python, node.js, typescript, and more
- Integrated script validation before saving
- Version history tracking with ability to revert
- Export/import script templates
- Real-time test execution with mock JSON input
- Error and output preview pane

**2. Script Template Library**

**Bash Example:**

```bash
#!/bin/bash
# Simple status line: model | workspace
read -r input
echo "$input" | jq -r '.model + " | " + .workspaceName' -
```

**Bash with Colors:**

```bash
#!/bin/bash
read -r input
model=$(echo "$input" | jq -r '.model')
cost=$(echo "$input" | jq -r '.cost')
# ANSI color codes: 32 = green, 33 = yellow, 31 = red
echo -e "\033[32m${model}\033[0m | \033[33m\$${cost}\033[0m"
```

**Python Example:**

```python
#!/usr/bin/env python3
import json
import sys

data = json.load(sys.stdin)
output = f"{data['model']} | {data['workspaceName']}"
print(output)
```

**Python with Colors:**

```python
#!/usr/bin/env python3
import json
import sys

data = json.load(sys.stdin)
model = data['model']
cost = float(data['cost'])

# Color based on cost
color = '\033[32m' if cost < 0.01 else '\033[33m' if cost < 0.05 else '\033[31m'
reset = '\033[0m'

output = f"{color}{model}{reset} | ${cost:.5f}"
print(output)
```

**Node.js Example:**

```javascript
#!/usr/bin/env node
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", (line) => {
  const data = JSON.parse(line);
  console.log(`${data.model} | ${data.workspaceName}`);
  process.exit(0);
});
```

**Go Example (Compiled Binary):**

```go
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
)

type Status struct {
	Model        string `json:"model"`
	WorkspaceName string `json:"workspaceName"`
	Cost         string `json:"cost"`
}

func main() {
	data, _ := io.ReadAll(os.Stdin)
	var status Status
	json.Unmarshal(data, &status)
	fmt.Printf("%s | $%s", status.Model, status.Cost)
}
```

**3. Validation System**

- Syntax validation for script syntax
- Executability check (file must have execute permissions)
- Test execution with mock JSON input
- Error handling and graceful fallbacks
- Input/output specification validation
- Performance check (warn if script exceeds 200ms execution)

**Validation Checklist UI:**

- [ ] File is executable
- [ ] Script reads from stdin
- [ ] Script outputs single line to stdout
- [ ] Test execution succeeds with mock data
- [ ] Output fits in status bar width
- [ ] Exit code is 0

**4. Live Preview & Testing**

- Interactive test panel showing:
  - Mock JSON input structure
  - Editable fields for testing different scenarios
  - Real-time script execution output
  - Colored output preview with ANSI rendering
  - Execution time measurement
  - Error messages and stack traces

- Test Scenarios:
  - Default state
  - High cost scenario
  - Low tokens remaining
  - Long session duration
  - Custom input modifications

**5. Configuration Panel**

- Script path selector with file browser
- Script editor with syntax highlighting
- Padding configuration slider (0-20 pixels)
- Color preview area (displays actual ANSI-rendered output)
- Validation status indicator
- Test/preview button
- Save and activate button
- Reset to default button

**6. Script Library & Sharing**

- Built-in template library with common statusline scripts
- One-click template installation
- Community script sharing via GitHub Gists
- Rating and review system for community scripts
- Fork/customize template functionality

#### UI Components Required

1. **Statusline Editor Modal**
   - Form with path input, script content area, padding slider
   - ShadCN/UI CodeEditor or similar with syntax highlighting
   - Real-time validation feedback
   - Save/cancel buttons

2. **Test Panel**
   - Collapsible section below editor
   - Mock JSON input editor
   - Test button with execute spinner
   - Output preview with ANSI color rendering
   - Execution time display
   - Error alert box

3. **Template Browser**
   - Grid or list of available templates
   - Language tag filters (bash, python, node, etc.)
   - Search by name/description
   - One-click copy to editor
   - Preview button

4. **Color Preview Component**
   - Renders ANSI-colored text in real DOM
   - Shows exactly how statusline will appear in Claude Code
   - Dark mode support for accurate preview

#### User Workflow

1. User opens Statusline Configuration from Settings
2. Selects script language from template library (or uploads custom)
3. Edits script in syntax-highlighted editor
4. Uses Test Panel to execute with mock data
5. Adjusts script based on test results
6. Configures padding option
7. Saves configuration to `settings.json`
8. Claude Code reads config and activates statusline
9. User sees live statusline updates in Claude Code interface

#### Integration with Settings Editor

The statusline configuration should be accessible from:

- Dedicated "Statusline" section in Settings modal
- Or as part of broader JSON editor for `settings.json`
- With visual UI abstraction over raw JSON for ease of use

#### Error Handling

- If script path invalid: Show error, fall back to default statusline
- If script crashes: Display error message in statusline, log to stderr
- If script times out (> 200ms): Skip update, show warning
- If stdout not single line: Use first line only, log warning
- If invalid JSON in stdin: Script should handle gracefully

## Deployment

We need to develop a way to quickly deploy the files to your project environment. Initial thoughts/flow:

1. User selects files/folders
2. User clicks "Deploy" button
3. App zips up the selected files/folders
4. App generates a URL to download the zip file
5. Bash script to download and unzip the files into the correct location in the user's project environment.

## GitHub Actions Integration

### Overview

Generate GitHub Actions workflows for automating Claude Code tasks triggered by repository events. Enable seamless automation of AI-powered development tasks directly within GitHub workflows.

### Workflow Types

#### 1. @claude Mention Responder

**Trigger:** PR/Issue comments mentioning `@claude`

**Actions:**

- Parse comment for instructions
- Execute Claude Code agent
- Post results as comment
- Update PR status

#### 2. Slash Command Automation

**Trigger:** Comment commands like `/claude implement`, `/claude review`, `/claude generate-docs`

**Actions:**

- Parse command and arguments
- Run corresponding Claude skill/agent
- Commit changes to PR branch
- Notify user of completion

#### 3. Scheduled Tasks

**Trigger:** Cron schedule (e.g., daily, weekly)

**Actions:**

- Run maintenance agents
- Generate reports
- Update documentation
- Create PRs for updates

### Cloud Provider Support

#### AWS Bedrock

**Authentication:** OIDC with GitHub Actions

**Setup:**

```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::ACCOUNT:role/GitHubAction
    aws-region: us-east-1
```

#### Google Vertex AI

**Authentication:** Workload Identity Federation

**Setup:**

```yaml
- uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: "projects/PROJECT/locations/global/..."
    service_account: "github-actions@PROJECT.iam.gserviceaccount.com"
```

#### Anthropic Claude API

**Authentication:** API Key via GitHub Secrets

**Setup:**

```yaml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### PromptStash Implementation

#### Features Required

1. **Workflow Generator**
   - Template selection (mention responder, slash command, scheduled)
   - Event configuration (issue comments, PR comments, schedule)
   - Agent/skill selection with preview
   - Cloud provider setup wizard
   - Trigger configuration (branches, paths, etc.)

2. **Workflow Templates**
   - Basic @claude responder for comments
   - PR review automation with suggestions
   - Issue implementation with branch creation
   - Scheduled documentation generation
   - Scheduled maintenance and cleanup tasks
   - Code generation from requirements
   - Test generation automation

3. **Validation**
   - YAML syntax validation
   - GitHub Actions schema validation
   - Cloud credentials testing
   - Secret detection and warnings
   - Workflow syntax linting

4. **Deployment**
   - Generate `.github/workflows/*.yml` files
   - Download generated workflows as ZIP
   - Direct commit to repository (with user authorization)
   - Setup instructions for cloud provider authentication
   - Environment variable checklist

#### Workflow Template Structure

Each template includes:

- Trigger configuration (events, filters)
- Step-by-step job definitions
- Input validation and error handling
- Result formatting and reporting
- Secret management best practices

#### Example Generated Workflow

```yaml
name: Claude PR Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  claude-review:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Claude
        run: npm install @anthropic-ai/sdk

      - name: Run Claude Review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: node scripts/pr-review.js

      - name: Post Review as Comment
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            // Post review results as PR comment
```

---

# User Interface

## User Stories

### Initial Load

After the user logs in, the landing page shows a layout similar to a cloud storage service, like Google drive. Main content area showing your files/folders in the root of your stash. Sidebar showing a tree of your stash, the root dir should be .claude. and a toolbar at the top with buttons to create new files/folders, upload/download, sort, filter, bulk edit the files in your stash.

### New File

User clicks "New file" button in the toolbar, a modal appears asking for file type (prompt, agent, command) and file name. After user fills out the form and submits, a new markdown file is created in the main content area with appropriate YAML frontmatter template based on file type selected. User can then edit the file in a markdown editor.

### New Folder

User clicks "New folder" button in the toolbar, a modal appears asking for folder name. After user fills out the form and submits, a new folder is created in the main content area and sidebar tree.

### File/Folder Interactions

User clicks a file in the main content area or sidebar tree, the file opens in a markdown editor in the main content area. User can edit the file and save changes.

User clicks a folder in the main content area or sidebar tree, the folder opens in the main content area showing its contents.

### Upload/Download

User clicks "Upload" button in the toolbar, a file picker appears allowing user to select markdown files from their local machine. After user selects files and confirms, the files are uploaded to the main content area and sidebar tree. User clicks "Download" button in the toolbar, a file picker appears allowing user to select markdown files from their stash. After user selects files and confirms, the files are downloaded to their local machine. Multiple files can be selected for bulk download.

### Sort/Filter

User clicks "Sort" button in the toolbar, a dropdown appears allowing user to select sort criteria (name, date created, date modified, file type). After user selects criteria, the files/folders in the main content area are sorted accordingly.

User clicks "Filter" button in the toolbar, a dropdown appears allowing user to select filter criteria (file type, date created, date modified). After user selects criteria, the files/folders in the main content area are filtered accordingly.

### File Type Specific Interactions

User clicks any `.json` file in their stash, the file opens in a JSON editor in the main content area with syntax highlighting and validation.

User clicks any `.jsonl` file in their stash, the file opens in a conversation viewer in the main content area. `.jsonl` files are Claude Code session files, so the viewer should be pretty much a conversation viewer showing the messages, tool calls, etc. in a pretty and readable format.

### Bulk Edit, Settings, Help

User clicks bulk edit button in the toolbar, a modal appears allowing user to select multiple files/folders in the main content area using checkmarks. After user selects files/folders and confirms, the selected items are highlighted and user can perform bulk actions (delete, move, copy, rename) on them.

User clicks settings Cog in the toolbar, a settings panel appears in the sidebar allowing user to configure app settings (theme, editor preferences, default file templates, etc.)

User clicks ? button in the toolbar, a help panel appears in the sidebar showing app documentation.

### Sharing

User selects a file/folder in the main content area or sidebar tree, clicks share button in the toolbar, a modal appears allowing user to set sharing options (view only, edit, comment) and generate a shareable link. After user sets options and confirms, a shareable link is generated that user can copy and share with others.

### Plugin Creation

User clicks Create -> Plugin

---

# System Architecture

## Stash Structure

The stash directory structure should be modeled after a normal Linux home directory structure. So we would have a `.claude` directory at the root of the stash, which would act as the User scoped Claude configuration at `~/.claude`.

Then we would have project scoped stashes located in the root of the user's project directory as a `.claude` directory. For example, I have a project named `promptstash`, so the project scoped stash would be located at `promptstash/.claude`.

Plugin scoped stashes would be located in `marketplace/YOUR_MARKETPLACE/YOUR_PLUGIN/.claude-plugin/` directory.

Marketplace scoped stashes would be located in `marketplace/YOUR_MARKETPLACE/` directory.

Structured exactly like a normal `~/.claude` the user's stash mimicking a real `.claude` folder with a few small changes, a `prompts` folder and an `AGENTS.md`. The structure would look like this:

**Note on AGENTS.md:** This is an open standard created by OpenAI, Google, Cursor, and Factory (not Claude-specific) for providing instructions to ANY AI coding agent. It sits alongside README.md (for humans) and CLAUDE.md (for Claude). Over 20,000+ GitHub repositories use AGENTS.md to guide AI coding assistants across multiple platforms.

```text
Stash Root
├── User Scope (~/.claude/)
│   ├── agents/
│   ├── commands/
│   ├── docs/
│   │   └── claude-code/
│   ├── hooks/
│   ├── plugins/
│   ├── prompts/
│   ├── sessions/
│   ├── skills/
│   ├── CLAUDE.md                # Official: Claude-specific instructions
│   ├── AGENTS.md                # Official: Multi-platform AI agent instructions
│   ├── .mcp.json
│   ├── marketplace.json
│   ├── settings.local.json
│   └── settings.json
│
├── Project Scopes
│   ├── promptstash/.claude/
│   │   ├── agents/
│   │   ├── commands/
│   │   ├── docs/
│   │   │   └── claude-code/
│   │   ├── hooks/
│   │   ├── plugins/
│   │   ├── prompts/
│   │   ├── sessions/
│   │   ├── skills/
│   │   ├── CLAUDE.md            # Official: Claude-specific instructions
│   │   ├── AGENTS.md            # Official: Multi-platform AI agent instructions
│   │   ├── .mcp.json
│   │   ├── marketplace.json
│   │   ├── settings.local.json
│   │   └── settings.json
│   │
│   └── taboot/.claude/
│       ├── agents/
│       ├── commands/
│       ├── docs/
│       │   └── claude-code/
│       ├── hooks/
│       ├── plugins/
│       ├── prompts/
│       ├── sessions/
│       ├── skills/
│       ├── CLAUDE.md            # Official: Claude-specific instructions
│       ├── AGENTS.md            # Official: Multi-platform AI agent instructions
│       ├── .mcp.json
│       ├── marketplace.json
│       ├── settings.local.json
│       └── settings.json
│
├── Plugin Scopes
│   └── marketplace/
│       └── YOUR_MARKETPLACE/
│           └── YOUR_PLUGIN/
│               ├── .claude-plugin/
│               │   └── plugin.json
│               ├── agents/
│               ├── commands/
│               ├── skills/
│               ├── hooks/
│               │   └── hooks.json
│               └── .mcp.json
│
└── Marketplace Scopes
    └── marketplace/
        └── YOUR_MARKETPLACE/
            └── marketplace.json
```

## Plugin Creation

User can create Claude Code plugins from their stash of files, with a plugin manifest generator to help create valid `plugin.json` files.

## Marketplace Creation

User can create Claude Code plugin marketplaces from their stash of files, with a marketplace manifest generator to help create valid `marketplace.json` files.

## MCP Server Configuration

User can configure MCP servers with validation and tips from the docs when editing the `.mcp.json` file.

---

# Development

## Project Scaffolding

Using the [build-elevate monorepo template](https://github.com/vijaysingh2219/build-elevate).

This template is for creating a monorepo with:

- Turborepo for monorepo management
- Next.js (with Turbopack) for the web application
- Express for the API server
- TypeScript for type safety
- Docker for containerization
- Prisma as the ORM for database access
- PostgreSQL as the database
- shadcn/ui for UI components
- Tailwind CSS for styling
- Better Auth for authentication
- React Email for email templates
- Resend for sending emails
- Tanstack Query for data fetching and state management
- ESLint for linting
- Prettier for code formatting
- Jest for testing
- GitHub Actions for CI/CD
- pnpm as the package manager

### Project Structure

This monorepo is structured into the following applications and packages:

**Applications:**

- `apps/web`: Next.js web application
- `apps/api`: Express API server

**Packages:**

- `packages/eslint-config`: Centralized ESLint config
- `packages/jest-presets`: Shared Jest configuration for Node.js and React
- `packages/prettier-config`: Shared Prettier formatting rules
- `packages/typescript-config`: Base TypeScript configuration
- `packages/auth`: Authentication package using Better Auth
- `packages/db`: Shared Prisma-based database access layer
- `packages/email`: Email features with React Email & Resend
- `packages/ui`: Reusable UI components built with shadcn/ui
- `packages/utils`: Common utilities and shared TypeScript types

### Getting Started

**Setting up `apps/web`:**
To set up and run the web application (`apps/web`), follow the instructions in `apps/web/README.md`.

**Setting up `apps/api`:**
To set up and run the API server (`apps/api`), follow the instructions in `apps/api/README.md`.

### Docker Setup

This project includes multiple `Dockerfile` and a production `docker-compose` setup for the apps.

**Production:**

```bash
pnpm docker:prod
```

This will:

- Build the Docker image using `docker-compose.prod.yml`
- Start the web container on `localhost:3000`
- Start the API container on `localhost:4000`
- Start the PostgreSQL database container on `localhost:5432`

Make sure you have `.env.production` in `apps/web`, `apps/api`, `packages/db`.

**Notes:**

- The `Dockerfile` uses a multi-stage build for minimal image size
- The containers run as a non-root user (nextjs, expressjs) for security
- The Docker build context includes the whole monorepo, and Turbo prunes the workspace to include only the necessary dependencies, ensuring PNPM and workspaces are resolved correctly

### Root-Level Scripts

The following scripts are available at the root of the monorepo:

| Script             | Description                                                      |
| ------------------ | ---------------------------------------------------------------- |
| `pnpm build`       | Runs turbo build to build all apps and packages                  |
| `pnpm clean`       | Clears the Turborepo cache and outputs                           |
| `pnpm dev`         | Runs turbo dev to start development servers concurrently         |
| `pnpm docker:prod` | Builds production Docker images and runs containers for all apps |
| `pnpm lint`        | Lints all workspaces using the shared ESLint configuration       |
| `pnpm format`      | Formats code using Prettier across the monorepo                  |
| `pnpm check-types` | Checks TypeScript types across all workspaces                    |
| `pnpm start`       | Starts the production servers for all apps                       |
| `pnpm test`        | Runs tests across all workspaces using Jest                      |

### UI Components (shadcn/ui)

**Usage:**

```bash
pnpm dlx shadcn@latest init
```

**Adding components:**
To add components to your app, run the following command at the root directory:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

**Tailwind:**
Your `tailwind.config.ts` and `globals.css` are already set up to use the components from the ui package.

**Using components:**
To use the components in your app, import them from the ui package.

```typescript
import { Button } from "@workspace/ui/components/button";
```
