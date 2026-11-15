#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

fail() {
  printf '\n[FAIL] %s\n' "$*" >&2
  exit 1
}
step() {
  printf '\n\n========== %s ==========\n' "$*"
}

command -v git >/dev/null 2>&1 || fail "git is required"
command -v node >/dev/null 2>&1 || fail "Node.js is required"
command -v npm >/dev/null 2>&1 || fail "npm is required"
command -v python3 >/dev/null 2>&1 || fail "Python 3.11+ is required"

step "Toolchain versions"
git --version
node --version
npm --version
python3 --version

step "Repository integrity and whitespace"
git fsck --full
git diff --check

step "Frontend dependency install"
cd "$ROOT_DIR/frontend"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

step "Frontend dependency security audit"
npm audit --audit-level=low

step "Frontend automated tests"
npm test

step "Frontend TypeScript check"
npm run typecheck

step "Frontend production build"
npm run build

step "Backend environment and dependencies"
cd "$ROOT_DIR/backend"
python3 -m venv .venv
# shellcheck disable=SC1091
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"

step "Backend automated tests"
pytest

step "Backend lint"
ruff check .

step "Optional Python dependency audit"
if command -v pip-audit >/dev/null 2>&1; then
  pip-audit
else
  printf '[WARN] pip-audit is not installed; install with: python -m pip install pip-audit\n'
fi

deactivate

step "Final repository status"
cd "$ROOT_DIR"
git status --short
printf '\n[PASS] All configured checks completed. This does not replace manual Android/browser smoke tests.\n'
