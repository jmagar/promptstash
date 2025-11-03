# PromptStash API Documentation

Complete REST API reference for the PromptStash Express backend.

## Base URL

```
http://localhost:3300/api
```

**Production:** Replace with your production API URL.

## Authentication

All routes (except validation endpoints) require authentication via session cookies.

**Authentication Method:** Cookie-based sessions managed by Better Auth

**How it works:**

1. Sign in through the web app at http://localhost:3100/sign-in
2. Session cookie is automatically set
3. Subsequent API requests include the session cookie
4. API validates the session and extracts user ID

**Unauthorized Response:**

```json
{
  "error": "Unauthorized"
}
```

## Rate Limiting

All API routes have global rate limiting applied:

- **Limit:** 100 requests per minute per IP address
- **Algorithm:** Sliding window with Upstash Redis

**Rate Limit Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

**Rate Limit Exceeded Response:**

```json
{
  "error": "Too many requests"
}
```

## API Routes

### User Routes

Base: `/api/users`

#### Get Current User Session

```http
GET /api/users/session
```

**Authentication:** Required

**Response:**

```json
{
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": true,
    "image": "https://example.com/avatar.jpg",
    "twoFactorEnabled": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "session": {
    "id": "session_123",
    "token": "...",
    "expiresAt": "2024-01-08T00:00:00.000Z",
    "ipAddress": "127.0.0.1",
    "userAgent": "Mozilla/5.0...",
    "userId": "user_123",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Stash Routes

Base: `/api/stashes`

#### List User Stashes

```http
GET /api/stashes
```

**Authentication:** Required

**Response:**

```json
[
  {
    "id": "stash_123",
    "name": "My PromptStash",
    "scope": "USER",
    "description": "Default stash for organizing prompts",
    "userId": "user_123",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "_count": {
      "files": 15,
      "folders": 3
    }
  }
]
```

**Notes:**

- Automatically creates a default stash if user has none
- Returns stashes ordered by creation date (newest first)

#### Get Stash by ID

```http
GET /api/stashes/:id
```

**Authentication:** Required

**Parameters:**

- `id` (string, required): Stash ID

**Response:**

```json
{
  "id": "stash_123",
  "name": "My PromptStash",
  "scope": "USER",
  "description": "Default stash",
  "userId": "user_123",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "files": [
    {
      "id": "file_123",
      "name": "Code Reviewer",
      "path": ".claude/agents/code-reviewer.md",
      "content": "# Code Reviewer Agent...",
      "fileType": "MARKDOWN",
      "folderId": null,
      "stashId": "stash_123",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "tags": []
    }
  ],
  "folders": [
    {
      "id": "folder_123",
      "name": "Agents",
      "path": "/agents",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Notes:**

- Only returns root-level files (folderId = null)
- Only returns root-level folders (parentId = null)

**Error Responses:**

- `404`: Stash not found
- `403`: Forbidden (not the owner)

#### Create Stash

```http
POST /api/stashes
```

**Authentication:** Required

**Request Body:**

```json
{
  "name": "Project Stash",
  "scope": "USER",
  "description": "Stash for my project"
}
```

**Fields:**

- `name` (string, required): Stash name
- `scope` (string, required): One of: USER, PROJECT, PLUGIN, MARKETPLACE
- `description` (string, optional): Stash description

**Response:**

```json
{
  "id": "stash_456",
  "name": "Project Stash",
  "scope": "USER",
  "description": "Stash for my project",
  "userId": "user_123",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**

- `400`: Missing required fields

#### Update Stash

```http
PUT /api/stashes/:id
```

**Authentication:** Required

**Parameters:**

- `id` (string, required): Stash ID

**Request Body:**

```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "scope": "PROJECT"
}
```

**Fields:** All optional

- `name` (string): New name
- `description` (string): New description
- `scope` (string): New scope

**Response:**

```json
{
  "id": "stash_123",
  "name": "Updated Name",
  "scope": "PROJECT",
  "description": "Updated description",
  "userId": "user_123",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

**Error Responses:**

- `404`: Stash not found
- `403`: Forbidden (not the owner)

#### Delete Stash

```http
DELETE /api/stashes/:id
```

**Authentication:** Required

**Parameters:**

- `id` (string, required): Stash ID

**Response:**

- `204 No Content`

**Error Responses:**

- `404`: Stash not found
- `403`: Forbidden (not the owner)

**Notes:**

- Cascade deletes all folders and files in the stash

#### Get Stash Files (with filtering)

```http
GET /api/stashes/:id/files
```

**Authentication:** Required

**Parameters:**

- `id` (string, required): Stash ID

**Query Parameters:**

- `search` (string, optional): Search in name or content
- `fileType` (string, optional): Filter by type (MARKDOWN, JSON, JSONL, YAML)
- `tags` (string, optional): Comma-separated tag names
- `folderId` (string, optional): Filter by folder ("root" for root level)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 50, max: 100)

**Example:**

```http
GET /api/stashes/stash_123/files?search=agent&fileType=MARKDOWN&page=1&limit=20
```

**Response:**

```json
{
  "files": [
    {
      "id": "file_123",
      "name": "Code Reviewer",
      "path": ".claude/agents/code-reviewer.md",
      "content": "# Code Reviewer Agent...",
      "fileType": "MARKDOWN",
      "folderId": null,
      "stashId": "stash_123",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "tags": [
        {
          "id": "filetag_123",
          "fileId": "file_123",
          "tagId": "tag_123",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "tag": {
            "id": "tag_123",
            "name": "code-review",
            "color": "#3b82f6"
          }
        }
      ],
      "folder": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

**Error Responses:**

- `404`: Stash not found
- `403`: Forbidden (not the owner)

---

### File Routes

Base: `/api/files`

#### Get File by ID

```http
GET /api/files/:id
```

**Authentication:** Required

**Parameters:**

- `id` (string, required): File ID

**Response:**

```json
{
  "id": "file_123",
  "name": "Code Reviewer",
  "path": ".claude/agents/code-reviewer.md",
  "content": "# Code Reviewer Agent\n\nYou are...",
  "fileType": "MARKDOWN",
  "folderId": null,
  "stashId": "stash_123",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "tags": [],
  "folder": null,
  "stash": {
    "userId": "user_123"
  }
}
```

**Error Responses:**

- `404`: File not found
- `403`: Forbidden (not the owner via stash)

#### Create File

```http
POST /api/files
```

**Authentication:** Required

**Request Body:**

```json
{
  "name": "Test Agent",
  "content": "# Test Agent\n\nDescription here...",
  "fileType": "AGENT",
  "stashId": "stash_123",
  "folderId": null,
  "path": ".claude/agents/test-agent.md",
  "tags": ["tag_123", "tag_456"]
}
```

**Fields:**

- `name` (string, required): File name
- `content` (string, required): File content
- `fileType` (string, required): AGENT, SKILL, COMMAND, MCP, HOOKS, SESSION, JSON, MARKDOWN, JSONL, YAML
- `stashId` (string, required): Stash ID
- `folderId` (string, optional): Folder ID (null for root level)
- `path` (string, optional): Auto-generated if not provided
- `tags` (array of strings, optional): Tag IDs to attach

**Response:**

```json
{
  "file": {
    "id": "file_456",
    "name": "Test Agent",
    "path": ".claude/agents/test-agent.md",
    "content": "# Test Agent...",
    "fileType": "MARKDOWN",
    "folderId": null,
    "stashId": "stash_123",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "tags": []
  },
  "validation": {
    "warnings": []
  }
}
```

**Notes:**

- Automatically creates version 1
- Validates content based on file type
- Auto-generates path based on fileType if not provided

**File Type to Path Mapping:**

- `AGENT` → `.claude/agents/{name}.md`
- `SKILL` → `.claude/skills/{name}/SKILL.md`
- `COMMAND` → `.claude/commands/{name}.sh`
- `MCP` → `.mcp.json`
- `HOOKS` → `.claude/hooks.json`
- `SESSION`/`JSONL` → `.docs/sessions/{name}.jsonl`
- `JSON` → `{name}.json`
- `MARKDOWN` → `{name}.md`

**Error Responses:**

- `400`: Missing required fields or validation failed
- `404`: Stash or folder not found
- `403`: Forbidden (not stash owner)

#### Update File

```http
PUT /api/files/:id
```

**Authentication:** Required

**Parameters:**

- `id` (string, required): File ID

**Request Body:**

```json
{
  "name": "Updated Name",
  "content": "# Updated Content...",
  "tags": ["tag_123"]
}
```

**Fields:** All optional

- `name` (string): New name
- `content` (string): New content (creates new version if changed)
- `tags` (array of strings): Tag IDs (replaces all existing tags)

**Response:**

```json
{
  "id": "file_123",
  "name": "Updated Name",
  "path": ".claude/agents/code-reviewer.md",
  "content": "# Updated Content...",
  "fileType": "MARKDOWN",
  "folderId": null,
  "stashId": "stash_123",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z",
  "tags": [
    {
      "id": "filetag_123",
      "fileId": "file_123",
      "tagId": "tag_123",
      "tag": {
        "id": "tag_123",
        "name": "code-review",
        "color": "#3b82f6"
      }
    }
  ]
}
```

**Notes:**

- Creates new version only if content changed
- Validates content based on file type
- Uses transaction for atomicity

**Error Responses:**

- `400`: Validation failed
- `404`: File not found
- `403`: Forbidden (not the owner via stash)

#### Delete File

```http
DELETE /api/files/:id
```

**Authentication:** Required

**Parameters:**

- `id` (string, required): File ID

**Response:**

- `204 No Content`

**Error Responses:**

- `404`: File not found
- `403`: Forbidden (not the owner via stash)

**Notes:**

- Cascade deletes all versions, tags, and shares

#### Get File Versions

```http
GET /api/files/:id/versions
```

**Authentication:** Required

**Parameters:**

- `id` (string, required): File ID

**Response:**

```json
[
  {
    "id": "version_456",
    "fileId": "file_123",
    "content": "# Updated Content...",
    "version": 2,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "createdBy": "user_123"
  },
  {
    "id": "version_123",
    "fileId": "file_123",
    "content": "# Original Content...",
    "version": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "createdBy": "user_123"
  }
]
```

**Notes:**

- Ordered by version descending (newest first)

**Error Responses:**

- `404`: File not found
- `403`: Forbidden (not the owner via stash)

#### Revert File to Version

```http
POST /api/files/:id/revert
```

**Authentication:** Required

**Parameters:**

- `id` (string, required): File ID

**Request Body:**

```json
{
  "versionId": "version_123"
}
```

**Fields:**

- `versionId` (string, required): Version ID to revert to

**Response:**

```json
{
  "id": "file_123",
  "name": "Code Reviewer",
  "path": ".claude/agents/code-reviewer.md",
  "content": "# Original Content...",
  "fileType": "MARKDOWN",
  "folderId": null,
  "stashId": "stash_123",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T13:00:00.000Z"
}
```

**Notes:**

- Creates a new version with the old content
- Versions are immutable (never deleted)
- File is updated with the reverted content

**Error Responses:**

- `400`: Missing versionId
- `404`: File or version not found
- `403`: Forbidden (not the owner via stash)

---

### Folder Routes

Base: `/api/folders`

#### Get Folder by ID

```http
GET /api/folders/:id
```

**Authentication:** Required

**Parameters:**

- `id` (string, required): Folder ID

**Response:**

```json
{
  "id": "folder_123",
  "name": "Agents",
  "path": "/agents",
  "parentId": null,
  "stashId": "stash_123",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "stash": {
    "userId": "user_123"
  },
  "children": [
    {
      "id": "folder_456",
      "name": "Code Review",
      "path": "/agents/code-review",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "files": [
    {
      "id": "file_123",
      "name": "Code Reviewer",
      "path": ".claude/agents/code-reviewer.md",
      "content": "...",
      "fileType": "MARKDOWN",
      "tags": []
    }
  ],
  "parent": null
}
```

**Error Responses:**

- `404`: Folder not found
- `403`: Forbidden (not the owner via stash)

#### Create Folder

```http
POST /api/folders
```

**Authentication:** Required

**Request Body:**

```json
{
  "name": "My Agents",
  "stashId": "stash_123",
  "parentId": null,
  "path": "/my-agents"
}
```

**Fields:**

- `name` (string, required): Folder name
- `stashId` (string, required): Stash ID
- `parentId` (string, optional): Parent folder ID (null for root level)
- `path` (string, optional): Auto-generated if not provided

**Response:**

```json
{
  "id": "folder_789",
  "name": "My Agents",
  "path": "/my-agents",
  "parentId": null,
  "stashId": "stash_123",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Notes:**

- Path is auto-generated from name if not provided
- If parent folder exists, path is built from parent path

**Error Responses:**

- `400`: Missing required fields or parent folder in different stash
- `404`: Stash or parent folder not found
- `403`: Forbidden (not stash owner)

#### Update Folder

```http
PUT /api/folders/:id
```

**Authentication:** Required

**Parameters:**

- `id` (string, required): Folder ID

**Request Body:**

```json
{
  "name": "Updated Name",
  "path": "/updated-path"
}
```

**Fields:** All optional

- `name` (string): New name
- `path` (string): New path

**Response:**

```json
{
  "id": "folder_123",
  "name": "Updated Name",
  "path": "/updated-path",
  "parentId": null,
  "stashId": "stash_123",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

**Error Responses:**

- `404`: Folder not found
- `403`: Forbidden (not the owner via stash)

#### Delete Folder

```http
DELETE /api/folders/:id
```

**Authentication:** Required

**Parameters:**

- `id` (string, required): Folder ID

**Response:**

- `204 No Content`

**Error Responses:**

- `404`: Folder not found
- `403`: Forbidden (not the owner via stash)

**Notes:**

- Cascade deletes all files and subfolders

---

### Validation Routes

Base: `/api/validate`

**Authentication:** NOT required (public endpoints)

#### Validate Agent File

```http
POST /api/validate/agent
```

**Request Body:**

```json
{
  "content": "# My Agent\n\nAgent description...",
  "filename": "my-agent.md"
}
```

**Fields:**

- `content` (string, required): Agent file content
- `filename` (string, required): Filename for validation

**Response:**

```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

**Error Response:**

```json
{
  "valid": false,
  "errors": ["Agent file must be valid Markdown"],
  "warnings": ["Consider adding more detailed instructions"]
}
```

#### Validate Skill File

```http
POST /api/validate/skill
```

**Request Body:**

```json
{
  "content": "# My Skill\n\nSkill description...",
  "path": ".claude/skills/my-skill/SKILL.md"
}
```

**Fields:**

- `content` (string, required): Skill file content
- `path` (string, required): Skill file path

**Response:** Same as agent validation

#### Validate MCP Configuration

```http
POST /api/validate/mcp
```

**Request Body:**

```json
{
  "content": "{\"mcpServers\": {...}}"
}
```

**Fields:**

- `content` (string, required): MCP JSON configuration

**Response:**

```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

**Error Response:**

```json
{
  "valid": false,
  "errors": ["Invalid JSON format", "Missing required field: mcpServers"],
  "warnings": []
}
```

#### Validate Hooks Configuration

```http
POST /api/validate/hooks
```

**Request Body:**

```json
{
  "config": "{\"hooks\": {...}}",
  "language": "typescript"
}
```

**Fields:**

- `config` (string, required): Hooks JSON configuration
- `language` (string, optional): Language (default: "typescript")

**Response:** Same as MCP validation

#### Validate Hook Output

```http
POST /api/validate/hook-output
```

**Request Body:**

```json
{
  "output": "{\"type\": \"text\", \"value\": \"...\"}"
}
```

**Fields:**

- `output` (string, required): Hook output JSON

**Response:** Same as MCP validation

---

## Error Responses

### Standard Error Format

```json
{
  "error": "Error message here"
}
```

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `204 No Content`: Successful deletion
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Data Types

### FileType Enum

```typescript
type FileType = "MARKDOWN" | "JSON" | "JSONL" | "YAML";
```

**Frontend to Backend Mapping:**

- `AGENT`, `SKILL`, `COMMAND`, `MARKDOWN` → `MARKDOWN`
- `MCP`, `HOOKS`, `JSON` → `JSON`
- `SESSION`, `JSONL` → `JSONL`
- `YAML` → `YAML`

### StashScope Enum

```typescript
type StashScope = "USER" | "PROJECT" | "PLUGIN" | "MARKETPLACE";
```

### SharePermission Enum

```typescript
type SharePermission = "VIEW" | "EDIT" | "COMMENT";
```

## Best Practices

### Pagination

Always use pagination for list endpoints:

```http
GET /api/stashes/stash_123/files?page=1&limit=50
```

### Error Handling

Always check HTTP status codes:

```typescript
const response = await fetch("/api/files", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

if (!response.ok) {
  const error = await response.json();
  console.error(error.error);
}
```

### Version Management

Always create a version when updating content:

```typescript
// The API handles this automatically
// Just send the new content
await fetch(`/api/files/${fileId}`, {
  method: "PUT",
  body: JSON.stringify({ content: newContent }),
});
```

### Search and Filtering

Use query parameters for efficient searching:

```http
# Search by text
GET /api/stashes/stash_123/files?search=agent

# Filter by type
GET /api/stashes/stash_123/files?fileType=MARKDOWN

# Combine filters
GET /api/stashes/stash_123/files?fileType=JSON&search=mcp
```

## Example Workflows

### Create an Agent File

```typescript
// 1. Get user's default stash
const stashesRes = await fetch("/api/stashes");
const stashes = await stashesRes.json();
const stashId = stashes[0].id;

// 2. Create agent file
const fileRes = await fetch("/api/files", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Code Reviewer",
    content: "# Code Reviewer\n\nYou are...",
    fileType: "AGENT",
    stashId,
  }),
});

const { file } = await fileRes.json();
console.log("Created:", file.id);
```

### Update and Track Versions

```typescript
// 1. Get file
const fileRes = await fetch(`/api/files/${fileId}`);
const file = await fileRes.json();

// 2. Update content
await fetch(`/api/files/${fileId}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    content: file.content + "\n\nNew section...",
  }),
});

// 3. View version history
const versionsRes = await fetch(`/api/files/${fileId}/versions`);
const versions = await versionsRes.json();
console.log(`File has ${versions.length} versions`);

// 4. Revert to previous version if needed
await fetch(`/api/files/${fileId}/revert`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    versionId: versions[1].id, // Revert to version 1
  }),
});
```

### Search and Filter Files

```typescript
// Search for agent files containing "code"
const url = new URL("/api/stashes/stash_123/files", "http://localhost:3300");
url.searchParams.set("search", "code");
url.searchParams.set("fileType", "MARKDOWN");
url.searchParams.set("page", "1");
url.searchParams.set("limit", "20");

const res = await fetch(url);
const { files, pagination } = await res.json();

console.log(`Found ${pagination.total} files`);
console.log(`Page ${pagination.page} of ${pagination.totalPages}`);
```

## Related Documentation

- **[Quick Start Guide](QUICKSTART.md)**: Get started with PromptStash
- **[Working Demo](DEMO.md)**: Learn by example
- **[Database Setup](DATABASE_SETUP.md)**: Database configuration
- **[Full Documentation](CLAUDE.md)**: Complete technical reference

## Support

For issues or questions:

1. Check this API documentation
2. Review [DEMO.md](DEMO.md) for usage examples
3. Check [CLAUDE.md](CLAUDE.md) for architecture details
4. Open an issue on GitHub
