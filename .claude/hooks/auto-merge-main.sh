#!/usr/bin/env bash
# Auto-merge the current working branch into `main` on every Stop.
#
# Safety rules (per user request):
#   - never merges when already on main
#   - only acts when the branch has commits beyond main (else skips silently)
#   - fast-forwards main when the branch is strictly ahead
#   - otherwise merges via a throwaway worktree, and ABORTS on conflict
#     (never --force, never leaves the main checkout on a different branch)
#
# Output: a single JSON object with a `systemMessage` shown in the UI, only
# when something actually happened or failed. Silent skips print nothing.
set -uo pipefail

root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$root" || exit 0

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
[ -z "$branch" ] && exit 0
[ "$branch" = "HEAD" ] && exit 0   # detached HEAD
[ "$branch" = "main" ] && exit 0   # never merge main into itself

ERR=/tmp/cc-automerge.err
msg() { printf '{"systemMessage":"%s"}\n' "$1"; }

# Refresh the remote-tracking ref for main.
git fetch origin main --quiet 2>/dev/null || exit 0

base=$(git merge-base origin/main HEAD 2>/dev/null) || exit 0
# Nothing new on this branch since it left main -> skip cleanly (no output).
[ "$(git rev-list --count "$base"..HEAD 2>/dev/null)" = "0" ] && exit 0

# Case 1: branch strictly ahead of origin/main -> fast-forward push.
if git merge-base --is-ancestor origin/main HEAD 2>/dev/null; then
  if git push origin "HEAD:main" --quiet 2>"$ERR"; then
    msg "auto-merge: $branch -> main (fast-forward) ok"
  else
    msg "auto-merge: push para main rejeitado (sem forcar). Veja $ERR"
  fi
  exit 0
fi

# Case 2: diverged -> real merge inside a throwaway worktree; abort on conflict.
wt=$(mktemp -d /tmp/cc-automerge.XXXXXX) || exit 0
if ! git worktree add --quiet --detach "$wt" origin/main 2>"$ERR"; then
  rm -rf "$wt"; msg "auto-merge: falhou ao criar worktree. Veja $ERR"; exit 0
fi

ok=0
if git -C "$wt" merge --no-ff "$branch" \
     -m "Merge branch '$branch' into main" --quiet 2>"$ERR"; then
  git -C "$wt" push origin HEAD:main --quiet 2>"$ERR" && ok=1
else
  git -C "$wt" merge --abort 2>/dev/null
fi

git worktree remove --force "$wt" 2>/dev/null
rm -rf "$wt"

if [ "$ok" = "1" ]; then
  msg "auto-merge: $branch -> main (merge commit) ok"
else
  msg "auto-merge: CONFLITO/push rejeitado ao mesclar em main — nada alterado (sem forcar). Veja $ERR"
fi
exit 0
