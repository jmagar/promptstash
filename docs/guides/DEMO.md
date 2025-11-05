# PromptStash Working Demo Guide

This guide walks you through using PromptStash with real examples.

## Prerequisites

Make sure you've completed the [Quick Start Guide](QUICKSTART.md) and have:

- PromptStash running at http://localhost:3100
- A user account created
- Successfully signed in

## What is PromptStash?

PromptStash is a web application for managing your Claude Code files:

- **Agents**: Custom AI agents for specialized tasks (`.claude/agents/*.md`)
- **Skills**: Reusable capabilities Claude can execute (`.claude/skills/*/SKILL.md`)
- **MCP Configs**: Model Context Protocol configurations (`.mcp.json`)
- **Hooks**: Lifecycle hooks for Claude Code (`.claude/hooks.json`)
- **Commands**: Custom slash commands (`.claude/commands/*.sh`)

All files support **automatic versioning** so you never lose your work!

## Demo Walkthrough

### Part 1: Understanding Stashes

A **Stash** is a container for organizing your files. Think of it like a project workspace.

**When you first sign in:**

1. Navigate to http://localhost:3100/stash
2. You'll see "My PromptStash" (created automatically)
3. It shows file and folder counts

**Stashes have two scopes:**

- **USER**: Personal files, visible only to you
- **GLOBAL**: Shared files (future feature for teams)

### Part 2: Creating Your First Agent

Let's create a custom agent for code review.

**Step 1: Open the Stash**

1. Go to http://localhost:3100/stash
2. Click on "My PromptStash"
3. Click the "New File" button (top right)

**Step 2: Create the Agent File**

Fill in the form:

- **Name**: `Code Reviewer`
- **File Type**: Select "Agent"
- **Content**: Paste this example:

```markdown
# Code Reviewer Agent

You are a senior code reviewer specializing in TypeScript and React.

## Your Role

- Review pull requests for code quality
- Identify potential bugs and security issues
- Suggest performance improvements
- Ensure code follows best practices

## Review Process

1. Read the entire code change carefully
2. Check for common issues:
   - Type safety violations
   - Security vulnerabilities
   - Performance bottlenecks
   - Code duplication
3. Provide constructive feedback
4. Suggest specific improvements with code examples

## Output Format

Structure your review as:

### Summary

Brief overview of the changes

### Issues Found

- **Critical**: Must fix before merge
- **Important**: Should fix before merge
- **Minor**: Nice to have improvements

### Suggestions

Specific code improvements with examples

## Tone

Be constructive, educational, and encouraging.
```

**Step 3: Save**

1. Click "Create File"
2. Your agent is now saved!
3. Notice the path was auto-generated: `.claude/agents/code-reviewer.md`

**Step 4: Verify**

- The agent appears in your file list
- Click on it to view details
- You can edit it by clicking "Edit"

### Part 3: Creating a Skill

Skills are reusable functions that Claude can execute. Let's create a skill for generating test cases.

**Step 1: Create New File**

1. Click "New File"
2. Set **File Type** to "Skill"

**Step 2: Fill in Details**

- **Name**: `Test Generator`
- **Content**: Paste this:

```markdown
# Test Generator Skill

Generate comprehensive test cases for TypeScript code.

## Usage

When invoked, this skill will:

1. Analyze the provided code
2. Identify edge cases
3. Generate Jest test cases
4. Include both happy path and error scenarios

## Example

Input: A TypeScript function
Output: Complete Jest test suite with:

- Setup and teardown
- Happy path tests
- Edge case tests
- Error handling tests
- Type checking tests

## Implementation

This skill uses static analysis to:

- Identify function parameters and return types
- Detect error conditions
- Find edge cases based on types
- Generate comprehensive test coverage
```

**Step 3: Save and Verify**

- Click "Create File"
- Path auto-generated: `.claude/skills/test-generator/SKILL.md`
- View the file in your list

### Part 4: Creating an MCP Configuration

MCP (Model Context Protocol) configs connect Claude to external tools.

**Step 1: Create MCP File**

1. Click "New File"
2. Set **File Type** to "MCP"
3. **Name**: `.mcp.json`

**Step 2: Add Configuration**

Paste this example MCP config:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/yourname/projects"
      ],
      "disabled": false
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      },
      "disabled": true
    }
  }
}
```

**Step 3: Validation**

- PromptStash validates the JSON structure
- If there are errors, you'll see them before saving
- Fix any issues and click "Create File"

**Step 4: Understanding the Config**

This config enables:

- **filesystem**: Access to your project files
- **github**: GitHub API integration (disabled by default)

### Part 5: Working with File Versions

Every time you edit a file, PromptStash creates a new version.

**Step 1: Edit a File**

1. Click on your "Code Reviewer" agent
2. Click "Edit"
3. Make a change (add a new section):

```markdown
## Code Style

- Follow the project's established patterns
- Use consistent naming conventions
- Keep functions small and focused
```

4. Click "Save"

**Step 2: View Version History**

1. Click on the file
2. Look for the "Versions" section
3. You'll see:
   - Version 2 (your edit)
   - Version 1 (original)
4. Each version shows:
   - Version number
   - Created date
   - Created by (your user)

**Step 3: Revert to Previous Version** (API Feature)

While the UI doesn't have a revert button yet, you can use the API:

```bash
# Get version ID from the version list
curl -X POST http://localhost:3300/api/files/{fileId}/revert \
  -H "Content-Type: application/json" \
  -d '{"versionId": "version-id-here"}'
```

This creates a new version with the old content (versions are immutable).

### Part 6: Organizing with Folders (Coming Soon)

Folders help organize your files hierarchically.

**Current Status:** The API supports folders, but the UI is still in development.

**API Example:**

```bash
# Create a folder
curl -X POST http://localhost:3300/api/folders \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Code Review Agents",
    "stashId": "your-stash-id"
  }'

# Move file to folder
curl -X PUT http://localhost:3300/api/files/{fileId} \
  -H "Content-Type: application/json" \
  -d '{"folderId": "folder-id-here"}'
```

### Part 7: Advanced Features

#### Searching Files (API)

Search across all files in a stash:

```bash
# Search by name or content
curl "http://localhost:3300/api/stashes/{stashId}/files?search=code+review"

# Filter by type
curl "http://localhost:3300/api/stashes/{stashId}/files?fileType=MARKDOWN"

# Pagination
curl "http://localhost:3300/api/stashes/{stashId}/files?page=1&limit=20"
```

#### Using Tags (Coming Soon)

Tags will help categorize files:

- `security` - Security-related agents
- `testing` - Test generation tools
- `documentation` - Doc generation helpers

#### Validation

PromptStash validates file content based on type:

**Agent Files** must:

- Be valid Markdown
- Have a clear purpose description

**Skill Files** must:

- Be valid Markdown
- Include usage instructions

**MCP Files** must:

- Be valid JSON
- Follow the MCP schema
- Have valid server configurations

**Hooks Files** must:

- Be valid JSON
- Follow the hooks schema
- Have valid hook configurations

## Real-World Example: Setting Up a Project

Let's create a complete setup for a React project.

**Step 1: Create a Testing Agent**

```markdown
# React Testing Agent

You are an expert in testing React components using Jest and React Testing Library.

## Your Expertise

- Component testing strategies
- Hook testing
- Integration tests
- Accessibility testing
- Mocking strategies

## Testing Approach

1. Test user behavior, not implementation
2. Use semantic queries (getByRole, getByLabelText)
3. Test accessibility
4. Mock external dependencies
5. Test edge cases and error states
```

**Step 2: Create a Test Generator Skill**

```markdown
# React Test Generator

Generate React Testing Library tests for components.

## Features

- Renders component tests
- User interaction tests
- Props validation tests
- Hook behavior tests
- Accessibility checks

## Output

Complete test file with:

- Proper imports
- Describe blocks
- Setup/teardown
- Comprehensive test cases
```

**Step 3: Create an MCP Config for the Project**

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/yourname/my-react-app"
      ],
      "disabled": false
    },
    "browser": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"],
      "disabled": true
    }
  }
}
```

**Step 4: Use Your Setup**

Now you have:

- A specialized testing agent
- A test generation skill
- MCP access to your project files

All versioned and safely stored in PromptStash!

## Tips and Best Practices

### File Naming

- **Agents**: Descriptive names like "API Developer", "Code Reviewer"
- **Skills**: Action-oriented like "Test Generator", "Doc Creator"
- **MCP Configs**: Always use `.mcp.json`
- **Hooks**: Always use `.claude/hooks.json`

### Content Organization

- Keep agents focused on a single role
- Make skills reusable across projects
- Document your MCP configurations
- Version everything (automatic!)

### Version Management

- Each save creates a new version
- Versions are immutable (can't be deleted)
- Revert creates a new version (preserves history)
- Use versions to experiment safely

### Security

- Never commit API keys to version control
- Use environment variables for MCP configs
- Mark sensitive MCP servers as `"disabled": true`
- Review sharing settings before making stashes global

## What's Working vs. Coming Soon

### ✅ Working Now (MVP)

- Create, view, edit files through UI
- Automatic versioning on every save
- File type validation
- Beautiful responsive UI with dark mode
- Stash management
- Real-time updates

### 🔜 Coming Soon

- Syntax-highlighted editor (Monaco/CodeMirror)
- Folder navigation in UI
- Search UI (Cmd+K)
- Version history UI with diff viewer
- Tag management UI
- File sharing
- Export/import functionality
- Keyboard shortcuts

## Troubleshooting

### File Won't Save

**Check:**

1. File validation errors (shown in red)
2. Network connection
3. Authentication (try refreshing)

### Can't See My Files

**Check:**

1. You're in the correct stash
2. Files aren't in a folder (folder UI coming soon)
3. Try refreshing the page

### Validation Errors

Each file type has specific requirements:

- **Agents**: Must be valid Markdown
- **Skills**: Must be valid Markdown
- **MCP**: Must be valid JSON matching schema
- **Hooks**: Must be valid JSON matching schema

## Next Steps

- **[API Documentation](API.md)**: Learn about the REST API
- **[Database Setup](DATABASE_SETUP.md)**: Advanced database configuration
- **[Full Documentation](CLAUDE.md)**: Complete technical reference

Enjoy using PromptStash! 🎉
