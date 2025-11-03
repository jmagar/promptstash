/**
 * Shared YAML Parser for Frontmatter
 * 
 * Provides a simple YAML parser for agent and skill frontmatter validation.
 * This eliminates code duplication and improves type safety.
 */

type YamlValue = string | number | boolean | string[];
type YamlObject = Record<string, YamlValue>;

/**
 * Simple YAML parser for frontmatter (basic implementation)
 * 
 * @param yaml - YAML string to parse
 * @returns Parsed YAML object with proper types
 */
export function parseSimpleYaml(yaml: string): YamlObject {
  const result: YamlObject = {};
  const lines = yaml.split("\n").filter((line) => line.trim());

  let currentKey: string | null = null;
  let arrayMode = false;
  let currentArray: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith("#")) continue;

    // Array item
    if (trimmed.startsWith("- ")) {
      if (arrayMode && currentKey) {
        const value = trimmed.substring(2).trim().replace(/['"]/g, "");
        currentArray.push(value);
      }
      continue;
    }

    // Key-value pair
    if (trimmed.includes(":")) {
      // Save previous array if exists
      if (arrayMode && currentKey) {
        result[currentKey] = currentArray;
        arrayMode = false;
        currentArray = [];
      }

      const [key, ...valueParts] = trimmed.split(":");
      const value = valueParts.join(":").trim();

      if (key) {
        currentKey = key.trim();

        if (value === "") {
          // Array starts on next line
          arrayMode = true;
        } else {
          // Inline value
          result[currentKey] = parseYamlValue(value);
        }
      }
    }
  }

  // Save final array if exists
  if (arrayMode && currentKey) {
    result[currentKey] = currentArray;
  }

  return result;
}

/**
 * Parse a YAML value with proper type inference
 * 
 * @param value - String value to parse
 * @returns Parsed value as string, number, or boolean
 */
export function parseYamlValue(value: string): string | number | boolean {
  const trimmed = value.trim();

  // Boolean
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  // Number - only parse if it matches numeric pattern
  if (trimmed !== "" && /^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  // String (remove quotes)
  return trimmed.replace(/^["']|["']$/g, "");
}
