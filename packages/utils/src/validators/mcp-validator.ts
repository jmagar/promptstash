import { z } from "zod";

/**
 * MCP Server Configuration Schema
 * 
 * Validates .mcp.json configuration files for Model Context Protocol servers
 * 
 * @see https://docs.claude.com/en/docs/claude-code/mcp.md
 */

// Stdio server configuration (local execution)
const stdioServerSchema = z.object({
  command: z.string().min(1, "Command is required for stdio servers"),
  args: z.array(z.string()).optional().describe("Command-line arguments"),
  env: z
    .record(z.string())
    .optional()
    .describe("Environment variables for the command"),
});

// SSE/HTTP server configuration (remote server)
const remoteServerSchema = z.object({
  url: z.string().url("Must be a valid HTTP/HTTPS URL"),
  headers: z
    .record(z.string())
    .optional()
    .describe("HTTP headers for authentication"),
});

// Union of server types
const mcpServerConfigSchema = z.union([stdioServerSchema, remoteServerSchema]);

// Full MCP configuration
export const mcpConfigSchema = z.object({
  mcpServers: z.record(mcpServerConfigSchema),
});

export type MCPServerConfig = z.infer<typeof mcpServerConfigSchema>;
export type MCPConfig = z.infer<typeof mcpConfigSchema>;

/**
 * Validates MCP configuration object
 */
export function validateMCPConfig(config: unknown): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const result = mcpConfigSchema.safeParse(config);

    if (!result.success) {
      errors.push(
        ...result.error.errors.map(
          (e) => `${e.path.join(".")}: ${e.message}`
        )
      );
      return { valid: false, errors, warnings };
    }

    // Additional validation checks
    const servers = result.data.mcpServers;

    for (const [serverName, serverConfig] of Object.entries(servers)) {
      // Check for stdio servers
      if ("command" in serverConfig) {
        // Warn if command might not exist in PATH
        if (
          !serverConfig.command.startsWith("/") &&
          !serverConfig.command.startsWith("./")
        ) {
          warnings.push(
            `Server '${serverName}': Command '${serverConfig.command}' should be in PATH or use absolute/relative path`
          );
        }

        // Warn about environment variables
        if (serverConfig.env) {
          const sensitiveKeys = Object.keys(serverConfig.env).filter(
            (key) =>
              key.includes("KEY") ||
              key.includes("SECRET") ||
              key.includes("TOKEN") ||
              key.includes("PASSWORD")
          );

          if (sensitiveKeys.length > 0) {
            warnings.push(
              `Server '${serverName}': Sensitive environment variables detected (${sensitiveKeys.join(", ")}). Ensure these are not hardcoded.`
            );
          }
        }
      }

      // Check for remote servers
      if ("url" in serverConfig) {
        // Warn if URL is http (not https)
        if (serverConfig.url.startsWith("http://")) {
          warnings.push(
            `Server '${serverName}': Using HTTP instead of HTTPS may be insecure`
          );
        }

        // Warn about authentication
        if (!serverConfig.headers || !serverConfig.headers.Authorization) {
          warnings.push(
            `Server '${serverName}': No Authorization header configured`
          );
        }
      }
    }

    return { valid: true, errors, warnings };
  } catch (error) {
    errors.push(
      `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return { valid: false, errors, warnings };
  }
}

/**
 * Validates MCP JSON file content
 */
export function validateMCPFile(content: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  config?: MCPConfig;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Parse JSON
    const config = JSON.parse(content);

    // Validate structure
    const validation = validateMCPConfig(config);

    return {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      config: validation.valid ? config : undefined,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      errors.push(`Invalid JSON: ${error.message}`);
    } else {
      errors.push(
        `Failed to parse: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
    return { valid: false, errors, warnings };
  }
}

/**
 * Generate example MCP configuration
 */
export function generateMCPExample(): MCPConfig {
  return {
    mcpServers: {
      filesystem: {
        command: "npx",
        args: [
          "-y",
          "@modelcontextprotocol/server-filesystem",
          "/path/to/allowed/files",
        ],
      },
      "brave-search": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-brave-search"],
        env: {
          BRAVE_API_KEY: "your_api_key_here",
        },
      },
      postgres: {
        command: "npx",
        args: [
          "-y",
          "@modelcontextprotocol/server-postgres",
          "postgresql://localhost/mydb",
        ],
      },
      "remote-api": {
        url: "https://api.example.com/mcp",
        headers: {
          Authorization: "Bearer YOUR_TOKEN",
        },
      },
    },
  };
}
