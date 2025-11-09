# Git++ (gpp)

An interactive extension of Git for a smoother command-line experience.

Git++ provides an interactive layer on top of Git.
It introduces additional subcommands and guided prompts that streamline routine operations and make command outcomes easier to understand.

## Features

- **Interactive prompts** - Select branches, files, and options with visual selectors
- **Clear feedback** - Color-coded output and grouped change displays
- **Git aliases** - Use `gpp` commands directly with `git` (e.g. `git goto` --> `gpp goto`)
- **Safety checks** - Confirmation prompts for destructive operations

## Installation

```bash
npm install -g git-plus-plus
```

After installation, Git++ automatically configures git aliases so you can use commands like `git goto` and `git pick` directly.

> **Note:** All Git++ commands can be run with either `gpp <command>` or `git <command>`. This documentation uses the git prefix for most commands to show how Git++ integrates directly with Git.

## Quick Start

```bash
# Check installation
gpp doctor

# Switch branches interactively
git goto

# Stage changes selectively
git pick

# Commit and push everything
git publish "feat: add new feature"
```

## Why Git++?

Git is powerful but its CLI can be cumbersome. Git++ provides:

- **Interactive selection** instead of typing branch/file names
- **Visual confirmation** of what will change before executing
- **Streamlined workflows** for common operations
- **Consistent patterns** across all commands
- **Better error messages** with helpful suggestions

---

## Commands

### Administrative

**`gpp doctor`** - Check Git++ installation and configuration health. Verifies git is installed, gpp is in PATH, and git aliases are configured correctly.

**`gpp rebuild`** - Install or update Git++ aliases in `~/.gitconfig`. Automatically runs after global install.

### Branch Operations

**`git goto [branch]`** - Switch branches. Interactive selector if no branch specified.

**`git create [branch]`** - Create and switch to a new branch. Prompts for name if not provided.

**`git delete [branches...]`** - Delete one or more branches. Interactive multi-select if no branches specified. Shows confirmation before deletion.

**`git rename`** - Rename a branch interactively.

**`git track [branch]`** - Set upstream tracking branch for current branch. Defaults to current branch name if not specified.

### Change Management

**`git pick [files...]`** - Stage unstaged changes. Interactive multi-select with color-coded status indicators if no files specified.

**`git drop [files...]`** - Unstage staged changes. Interactive multi-select if no files specified.

**`git publish [message]`** - Stage all changes, commit, and push to remote. Prompts for message if not provided. Shows confirmation before committing.

**`git uncommit`** - Undo last commit, keeping changes staged. Useful for fixing commit messages or adding forgotten changes.

**`git wipe`** - Discard all uncommitted changes and untracked files (destructive). Requires typing "confirm" to proceed.

---

## Configuration

Git++ stores no configuration files. All settings are:

- Git aliases in `~/.gitconfig` (managed by `gpp rebuild`)
- Uses standard git configuration

## Troubleshooting

### Commands not found after install

Run `gpp doctor` to check if gpp is in PATH. If not:

```bash
# Reinstall with
npm install -g git-plus-plus

# Or check npm's global bin directory is in PATH
npm prefix -g
```

### Git aliases not working

Run `gpp rebuild` to reinstall git aliases:

```bash
gpp rebuild
```

## Development

```bash
# Clone the repository
git clone https://github.com/farhadzaidi/git-plus-plus.git
cd git-plus-plus

# Install dependencies
pnpm install

# Run in development mode
pnpm dev goto

# Build
pnpm build

# Test locally
npm pack
npm install -g ./git-plus-plus-1.0.0.tgz
```

## License

MIT License - see [LICENSE](LICENSE) file for details.
