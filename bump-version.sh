#!/usr/bin/env bash
#
# Bump the project version across all files and create a git tag.
#
# Updates:
#   - package.json        (via npm version)
#   - package-lock.json   (via npm version)
#   - manifest.json       (via the "version" npm script hook -> version-bump.mjs)
#   - versions.json       (via the "version" npm script hook -> version-bump.mjs)
#
# Creates a commit and an annotated git tag (no 'v' prefix; required by Obsidian).
#
# Usage:
#   ./bump-version.sh <patch|minor|major|x.y.z> [--push]
#
# Examples:
#   ./bump-version.sh patch
#   ./bump-version.sh 1.2.3
#   ./bump-version.sh minor --push

set -euo pipefail

usage() {
    cat <<EOF
Usage: $0 <patch|minor|major|x.y.z> [--push]

Arguments:
  patch|minor|major   Bump using semver rules.
  x.y.z               Set an explicit version (e.g. 1.2.3, no 'v' prefix).
  --push              Push the commit and tag to 'origin' after bumping.
EOF
}

if [ $# -lt 1 ] || [ $# -gt 2 ]; then
    usage
    exit 1
fi

BUMP="$1"
PUSH="${2:-}"

if [ -n "$PUSH" ] && [ "$PUSH" != "--push" ]; then
    echo "Error: unknown second argument '$PUSH' (expected --push)."
    usage
    exit 1
fi

# Validate bump argument
case "$BUMP" in
    patch|minor|major) ;;
    v*)
        echo "Error: do not use a 'v' prefix. Obsidian requires '1.0.0', not 'v1.0.0'."
        exit 1
        ;;
    *)
        if ! [[ "$BUMP" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
            echo "Error: '$BUMP' is not 'patch', 'minor', 'major', or a valid semver (x.y.z)."
            exit 1
        fi
        ;;
esac

# Must be inside a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: not inside a git repository."
    exit 1
fi

# Working tree must be clean
if [ -n "$(git status --porcelain)" ]; then
    echo "Error: working tree has uncommitted changes. Commit or stash them first."
    git status --short
    exit 1
fi

CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"
echo "Bumping: $BUMP"
echo

# npm version handles everything:
#   - updates package.json and package-lock.json
#   - runs the "version" script hook (version-bump.mjs -> manifest.json, versions.json)
#   - creates a commit and a tag (tag-version-prefix="" from .npmrc -> no 'v')
npm version "$BUMP"

NEW_VERSION=$(node -p "require('./package.json').version")
echo
echo "Bumped to: $NEW_VERSION"
echo "Tag created: $NEW_VERSION"

if [ "$PUSH" = "--push" ]; then
    echo
    echo "Pushing commit and tag to origin..."
    git push origin HEAD
    git push origin "$NEW_VERSION"
    echo "Done. The Release workflow will build and publish $NEW_VERSION."
else
    echo
    echo "Next step: push the commit and tag to trigger the Release workflow:"
    echo "  git push origin HEAD && git push origin $NEW_VERSION"
fi
