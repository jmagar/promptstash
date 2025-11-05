# AI Session Documentation Guidelines

This directory (`.docs/`) contains summaries and notes from all AI-assisted development sessions for the PromptStash project.

## Purpose

The `.docs` directory serves as a historical archive of AI chat sessions, providing:

1. **Development History** - Track the evolution of features and architectural decisions
2. **Decision Context** - Understand why specific approaches were chosen
3. **Problem Solutions** - Reference past solutions to similar challenges
4. **Knowledge Transfer** - Help new developers (human or AI) understand the project journey
5. **Session Continuity** - Enable AI assistants to quickly catch up on previous work

## File Naming Conventions

### Session Summaries

Use descriptive names that capture the session's focus:

- `session-[number]-[topic].md` - Sequential session summaries
- `[feature]-implementation-summary.md` - Feature-specific summaries
- `[topic]-completion.md` - Milestone completion summaries

### Progress Tracking

- `implementation-progress.md` - Ongoing progress tracking
- `mvp-completion-summary.md` - Major milestone summaries

### Reference Documents

- `[topic]-guide.md` - Guides created during sessions
- `[feature]-summary.md` - Feature documentation

### Temporary Files

Use the `/tmp/` subdirectory for:

- Work-in-progress notes
- Merge documentation
- Temporary planning documents

## Content Guidelines

### What to Include

Each session summary should capture:

1. **Session Context**
   - Date and AI assistant used (e.g., Claude, GPT-4)
   - Starting point (what branch, what state)
   - Goals for the session

2. **Work Completed**
   - Features implemented
   - Bugs fixed
   - Files created/modified
   - Commands executed

3. **Technical Decisions**
   - Why specific approaches were chosen
   - Alternatives considered
   - Trade-offs made

4. **Challenges & Solutions**
   - Problems encountered
   - How they were resolved
   - Lessons learned

5. **Next Steps**
   - Incomplete work
   - Known issues
   - Recommended follow-ups

### What NOT to Include

- Sensitive credentials or API keys
- Personal information
- Temporary debugging output (unless instructive)
- Duplicate information already in main docs

## Getting Current Date/Time

**IMPORTANT:** AI assistants often have incorrect date/time information. Always retrieve the actual current date/time using:

### Option 1: MCP Time Server (Preferred)

```javascript
// Use the time MCP server tool - ALWAYS use America/New_York (EST/EDT) timezone
time___get_current_time({ timezone: "America/New_York" });
```

### Option 2: Bash Command

```bash
# Get date/time in EST/EDT timezone
TZ="America/New_York" date "+%Y-%m-%d %H:%M:%S %Z"
```

**Always verify the date before creating session summaries!**
**Always use EST/EDT (America/New_York timezone) for all session documentation!**

## Session Summary Template

```markdown
# [Topic/Feature] - Session Summary

**Date:** YYYY-MM-DD (Use time tool or `date` command to get actual date!)
**Time:** HH:MM EST/EDT (Always use America/New_York timezone)
**AI Assistant:** Claude Sonnet 4 / GPT-4 / etc.  
**Branch:** branch-name (Use `git branch --show-current`)
**Starting State:** Brief description

## Goals

- [ ] Goal 1
- [ ] Goal 2
- [ ] Goal 3

## Work Completed

### Feature Implementation

- Implemented X feature in `path/to/file.ts`
- Added Y component for Z purpose
- Integrated A with B

### Bug Fixes

- Fixed issue with X
- Resolved Y error

### Files Modified

- `apps/web/app/page.tsx` - Added new section
- `packages/db/schema.prisma` - Added User model

## Technical Decisions

### Decision: [Title]

**Problem:** What we were trying to solve  
**Options Considered:**

1. Option A - pros/cons
2. Option B - pros/cons

**Chosen:** Option A  
**Rationale:** Why we chose this approach

## Challenges & Solutions

### Challenge: [Description]

**Problem:** Detailed problem description  
**Solution:** How it was resolved  
**Learning:** Key takeaway

## Testing & Validation

- Ran tests: `pnpm test`
- Manual testing performed: X, Y, Z
- Issues found: None / [list]

## Next Steps

- [ ] Complete X feature
- [ ] Address Y issue
- [ ] Refactor Z for better performance

## References

- Related PR: #123
- Related Issues: #456, #789
- Documentation: [Link to relevant docs]
```

## Organization Rules

### Active vs. Archived

**Keep in `.docs/` root:**

- Recent session summaries (last 5-10 sessions)
- Active implementation guides
- Current progress tracking

**Move to `.docs/tmp/` or `.docs/archived/`:**

- Superseded documents
- Completed feature summaries (after feature is done)
- Old session notes (after project milestone)

### When to Create a New Summary

Create a new session summary when:

- Starting a significant new feature
- Major refactoring effort
- Debugging session resolves complex issue
- Architectural decisions are made
- After ~2-4 hours of focused work with AI

Update existing summaries when:

- Continuing work on the same feature
- Making minor tweaks or fixes
- Adding notes about ongoing work

## Integration with Main Documentation

Session summaries in `.docs/` are **working documents**. Important information should be promoted to main documentation:

- **Architectural decisions** → `/docs/architecture/`
- **User guides** → `/docs/guides/`
- **API documentation** → `/docs/reference/`
- **Setup instructions** → `/docs/guides/`

Think of `.docs/` as your development journal, and `/docs/` as the polished documentation.

## Benefits for Future AI Sessions

Well-maintained `.docs/` enables AI assistants to:

1. **Quick Context Loading** - Understand project history without re-reading entire codebase
2. **Decision Awareness** - Know what approaches have been tried and why
3. **Pattern Recognition** - Identify recurring issues or best practices
4. **Continuity** - Pick up where previous sessions left off
5. **Avoid Rework** - Don't suggest solutions that were already tried and rejected

## Example Workflow

```bash
# Start new feature work with AI
1. AI retrieves actual current date/time using time MCP server or date command
2. AI reads relevant .docs files for context
3. Work on feature together
4. Create session summary with CORRECT date: .docs/user-auth-implementation.md
5. Document decisions and progress

# Feature complete
6. Move detailed notes to .docs/archived/
7. Update main docs with polished information
8. Keep high-level summary in .docs/
```

## Critical Reminders for AI Assistants

### Date/Time Verification

- ✅ **DO:** Use `time___get_current_time({ timezone: "America/New_York" })` tool
- ✅ **DO:** Use `TZ="America/New_York" date "+%Y-%m-%d %H:%M:%S %Z"` command
- ✅ **DO:** Always use EST/EDT (America/New_York timezone) for all timestamps
- ✅ **DO:** Verify branch with `git branch --show-current`
- ❌ **DON'T:** Use assumed or internal date/time (it's often wrong!)
- ❌ **DON'T:** Write "Today is [date]" without verification
- ❌ **DON'T:** Use UTC or other timezones - ALWAYS use America/New_York

### Session Documentation

- Always start session by retrieving actual date/time
- Always verify current git branch before documenting
- Always read recent .docs files for context before starting work

## Maintenance

### Regular Cleanup (Every Month)

- Review session summaries in `.docs/` root
- Move old summaries to `.docs/archived/` or `.docs/tmp/`
- Promote important information to main docs
- Update implementation-progress.md with current state

### Keep Only Essential History

- Don't delete summaries (they're your project's memory)
- Archive older summaries for reference
- Keep recent and milestone summaries accessible

---

**Remember:** This directory is for the development team (human and AI). Write for understanding, not perfection. The goal is to preserve context and enable continuity across sessions.
