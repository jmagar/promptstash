# Documentation Guidelines

**Last Updated:** 2025-11-03 09:53 EST

Guidelines for AI assistants working with the `/docs` directory.

## Key Distinction

- `/docs/` = **Published documentation** (polished, user-facing)
- `.docs/` = **Development journal** (AI session notes, working docs)

## Directory Structure

- `guides/` - Step-by-step tutorials and setup instructions
- `reference/` - API docs, quick references, specifications
- `architecture/` - Technical decisions and design patterns
- `demos/` - Mockups and examples
- `archived/` - Historical docs (don't delete, just move here)
- `development/` - Active development docs

## Documentation Standards

### Before Creating/Updating Docs

- ✅ Test all commands and code examples
- ✅ Use `time___get_current_time({ timezone: "America/New_York" })` for dates
- ✅ Verify branch with `git branch --show-current`
- ✅ Use actual project paths and values
- ✅ Read existing docs to match style
- ❌ Don't assume paths or configurations
- ❌ Don't use outdated examples

### Writing Guidelines

1. **Clear & Concise** - Simple language, define jargon
2. **Actionable** - Concrete examples with working code
3. **Accurate** - Test everything before documenting
4. **Maintainable** - Include dates, versions, context

### When to Create New Docs

- Adding major feature
- Establishing pattern/convention
- Creating public API
- Complex architecture
- Frequently asked questions

### When to Archive

Move to `archived/` when:

- Feature removed/replaced
- Document superseded
- Implementation changed significantly
- Outdated but historically valuable

## Promoting from .docs/ to /docs/

Promote AI session notes when:

1. Decision is finalized
2. Information is user-valuable
3. Content is polished and tested

**Workflow:**

```bash
# During session → .docs/session-summary.md
# After session → Extract to /docs/appropriate-section/
# Polish, test, format
# Update README.md if major addition
```

## Markdown Standards

- One H1 per document
- Specify language in code blocks
- Use relative paths for internal links
- Show expected output for commands
- Include troubleshooting sections

## Date/Time

Always use EST/EDT (America/New_York):

```javascript
time___get_current_time({ timezone: "America/New_York" });
```

---

**Quality Standards:** Accuracy • Completeness • Clarity • Consistency • Maintainability
