#!/bin/bash

# Structured Logging Migration Script
# Automates basic console.error -> logError replacements
#
# Usage: ./scripts/migrate-logging.sh [--dry-run]
#
# Options:
#   --dry-run    Preview changes without modifying files

set -e

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Flags
DRY_RUN=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
  esac
done

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}DRY RUN MODE - No files will be modified${NC}\n"
fi

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Structured Logging Migration Tool        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}\n"

# Statistics
total_files=0
total_replacements=0

# Function to add import if not exists
add_import_if_missing() {
  local file=$1
  local import_statement=$2

  if grep -q "$import_statement" "$file"; then
    return 0  # Import already exists
  fi

  echo -e "${YELLOW}  → Adding import to $(basename "$file")${NC}"

  if [ "$DRY_RUN" = false ]; then
    # Find the last import line and add after it
    # This is a simplified approach - may need manual adjustment
    if grep -q "^import" "$file"; then
      # Add after last import
      sed -i "/^import.*from/a\\$import_statement" "$file"
    else
      # No imports found, add at the top
      sed -i "1i\\$import_statement" "$file"
    fi
  fi
}

# Function to replace console.error in API routes
replace_api_console_error() {
  local file=$1
  local count=0

  echo -e "${BLUE}Processing: ${file}${NC}"

  # Check if file contains console.error
  if ! grep -q "console\.error" "$file"; then
    echo -e "${YELLOW}  ✓ No console.error found${NC}"
    return 0
  fi

  # Add import for logError
  add_import_if_missing "$file" "import { logError } from '@workspace/observability';"

  # Pattern 1: Simple error logging in catch blocks
  # Before: console.error('Error creating file:', error);
  # After: logError(error as Error, { operation: 'createFile', requestId: req.requestId, userId: req.user?.id });

  # Count matches
  count=$(grep -c "console\.error" "$file" || true)

  if [ "$count" -gt 0 ]; then
    echo -e "${GREEN}  ✓ Found $count console.error statements${NC}"
    total_replacements=$((total_replacements + count))
  fi

  # Show what would be replaced
  echo -e "${YELLOW}  📝 Preview of changes:${NC}"
  grep -n "console\.error" "$file" | head -5 | while read -r line; do
    echo -e "${YELLOW}     Line $line${NC}"
  done

  if [ "$DRY_RUN" = false ]; then
    echo -e "${RED}  ⚠️  MANUAL REPLACEMENT REQUIRED${NC}"
    echo -e "${RED}     Automated replacement is too complex for this tool.${NC}"
    echo -e "${RED}     Please follow the migration plan for proper context.${NC}"
  fi

  total_files=$((total_files + 1))
}

# Function to replace console.log in startup files
replace_startup_console_log() {
  local file=$1

  echo -e "${BLUE}Processing: ${file}${NC}"

  if ! grep -q "console\.log" "$file"; then
    echo -e "${YELLOW}  ✓ No console.log found${NC}"
    return 0
  fi

  add_import_if_missing "$file" "import { logger } from '@workspace/observability';"

  local count=$(grep -c "console\.log" "$file" || true)

  if [ "$count" -gt 0 ]; then
    echo -e "${GREEN}  ✓ Found $count console.log statements${NC}"
    total_replacements=$((total_replacements + count))
  fi

  if [ "$DRY_RUN" = false ]; then
    echo -e "${RED}  ⚠️  MANUAL REPLACEMENT REQUIRED${NC}"
  fi

  total_files=$((total_files + 1))
}

echo -e "\n${BLUE}═══ Phase 1: API Routes ═══${NC}\n"

# Process API route files
if [ -d "apps/api/src/routes" ]; then
  for file in apps/api/src/routes/*.ts; do
    if [ -f "$file" ]; then
      replace_api_console_error "$file"
    fi
  done
else
  echo -e "${RED}Error: apps/api/src/routes directory not found${NC}"
  exit 1
fi

echo -e "\n${BLUE}═══ Phase 2: Middleware ═══${NC}\n"

# Process middleware files
if [ -d "apps/api/src/middleware" ]; then
  for file in apps/api/src/middleware/*.ts; do
    if [ -f "$file" ] && [ "$(basename "$file")" != "CLAUDE.md" ]; then
      replace_api_console_error "$file"
    fi
  done
fi

echo -e "\n${BLUE}═══ Phase 3: Configuration ═══${NC}\n"

# Process config files
if [ -f "apps/api/src/index.ts" ]; then
  replace_startup_console_log "apps/api/src/index.ts"
fi

if [ -f "apps/api/src/config/env.ts" ]; then
  replace_startup_console_log "apps/api/src/config/env.ts"
fi

echo -e "\n${BLUE}═══ Summary ═══${NC}\n"
echo -e "Files processed:           ${GREEN}${total_files}${NC}"
echo -e "Console statements found:  ${YELLOW}${total_replacements}${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}This was a DRY RUN - no files were modified${NC}"
  echo -e "${BLUE}Run without --dry-run to add imports (manual edits still required)${NC}"
else
  echo -e "${GREEN}✓ Imports added where needed${NC}"
  echo ""
  echo -e "${RED}⚠️  IMPORTANT: Automated replacement is intentionally limited${NC}"
  echo -e "${RED}   Each console statement needs manual review and proper context${NC}"
  echo ""
  echo -e "${BLUE}Next steps:${NC}"
  echo "  1. Review the migration plan: .docs/STRUCTURED_LOGGING_MIGRATION_PLAN.md"
  echo "  2. Follow file-by-file instructions for proper context"
  echo "  3. Run 'pnpm lint' to check for remaining console usage"
  echo "  4. Run 'pnpm test' to verify changes"
fi

echo ""
echo -e "${GREEN}For detailed migration instructions, see:${NC}"
echo -e "${BLUE}.docs/STRUCTURED_LOGGING_MIGRATION_PLAN.md${NC}"
echo ""
