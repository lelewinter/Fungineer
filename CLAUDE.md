# Claude Code Game Studios -- Game Studio Agent Architecture

Indie game development managed through 48 coordinated Claude Code subagents.
Each agent owns a specific domain, enforcing separation of concerns and quality.

## Technology Stack

Fungineer is a PixiJS-based web game (PWA) with an optional FastAPI backend.
The Godot prototype that this template was originally configured for has been
removed; the live runtime is everything below. See
`docs/adr/adr-002-web-port.md` for the port rationale.

- **Frontend**: PixiJS v8 + Vite + TypeScript (in `frontend/`)
- **Backend**: FastAPI + SQLite, Python 3.11+ (in `backend/`)
- **PWA**: `vite-plugin-pwa` (injectManifest) + `workbox-window`
- **Deploy**: Cloudflare Pages (frontend) + Railway (backend)
- **Asset Pipeline**: Vite static assets — `frontend/public/assets/` symlinks to top-level `assets/`
- **Version Control**: Git with trunk-based development

## Project Structure

@.claude/docs/directory-structure.md

## Architecture & Decisions

- `docs/technical-architecture.md` — current architecture overview
- `docs/adr/adr-001-engine-choice.md` — original Godot decision (Superseded)
- `docs/adr/adr-002-web-port.md` — port decision (Accepted, supersedes ADR-001)
- `docs/architecture/adr-pwa.md` — PWA + service worker decisions

## Technical Preferences

@.claude/docs/technical-preferences.md

## Coordination Rules

@.claude/docs/coordination-rules.md

## Collaboration Protocol

**User-driven collaboration, not autonomous execution.**
Every task follows: **Question -> Options -> Decision -> Draft -> Approval**

- Agents MUST ask "May I write this to [filepath]?" before using Write/Edit tools
- Agents MUST show drafts or summaries before requesting approval
- Multi-file changes require explicit approval for the full changeset
- No commits without user instruction

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for full protocol and examples.

> **First session?** If the project has no engine configured and no game concept,
> run `/start` to begin the guided onboarding flow.

## Merge Policy

After a fix or feature lands on a working branch and verifies green, **always**
merge it into `main` without asking. Direct push to `main` is blocked, so the
flow is:

1. Commit + push the working branch
2. Open a PR against `main` via the GitHub MCP tools
3. Squash-merge the PR

No "should I merge?" check-in needed — proceed straight to PR + merge.

## Coding Standards

@.claude/docs/coding-standards.md

## Context Management

@.claude/docs/context-management.md
