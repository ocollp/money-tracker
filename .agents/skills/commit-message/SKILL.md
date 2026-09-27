---
name: commit-message
description: Analyzes git changes and suggests a Conventional Commits message in English. Use when the user invokes /commit, asks for a commit message, or wants to know what to write for their next commit.
---

# Commit Message Suggestion

When the user asks for a commit message (e.g. /commit or "write my commit message"):

## Workflow

1. **Inspect changes**
   - Run `git status` to see modified/added/deleted files.
   - Run `git diff --staged` to see staged changes. If nothing is staged, run `git diff` to see working tree changes.
   - Use this to infer the scope and type of the commit.

2. **Choose type and scope**
   - **Type**: `feat`, `fix`, `docs`, `chore`, `refactor`, `style`, `test`, etc.
   - **Scope** (optional): area of the codebase, e.g. `ui`, `sheets`, `auth`, `deps`.

3. **Write the message**
   - **Format**: [Conventional Commits](https://www.conventionalcommits.org/).
   - **Language**: English only (title and body).
   - **Title**: imperative, lowercase after the type/scope. Keep it short: preferably under 50 characters, never over 72. Use a single-line title by default.
   - **Body** (optional): brief explanation if the change is not obvious.

## Output format

Provide the message in a **copy-paste ready** block so the user can run:

```bash
git commit -m "type(scope): subject"
```

If there is a body, offer both one-line and full form:

```bash
git commit -m "type(scope): subject" -m "Body paragraph here."
```

Or show the full message in a fenced block:

```
type(scope): subject

Body paragraph if needed.
```

## Examples

| Change | Message |
|--------|---------|
| New GIF on login | `feat(ui): add piggy GIF to login screen` |
| CSV crash fix | `fix(sheets): handle empty CSV without crashing` |
| Doc update | `docs: update Telegram bot setup guide` |
| Dependency bump | `chore(deps): bump vite to 7.3.1` |

## Olga’s preferences

- Always use a short English Conventional Commit message.
- When asked to commit or push, perform the requested actions, including staging only relevant files. When asked only for a message, provide commands for `git add`, `git commit`, and `git push` without executing them.
- Use Olga Coll <olgacoll94@gmail.com> as both author and committer; verify Git identity first. Do not add assistant co-authorship.
- Push using the user's configured Git credentials; do not change authentication or force-push.
- Run required checks and hooks. If a hook already pushes successfully, do not repeat the push unnecessarily.
- Keep personal files such as Si-sentim-rialles-vindran-de-dalt.md out of commits. Do not stage unrelated files or the entire .agents directory.
- Report the commit hash and whether the push succeeded.
