# Git++ (`gpp`)

Git++ is an interactive Git extension that adds guided workflows and streamlined commands to simplify daily Git operations.

It provides an optional interactive layer on top of Git’s core CLI — enhancing usability without changing Git’s underlying behavior.

---

## Installation

```bash
npm install -g git-plus-plus
```

After installation, Git++ configures Git aliases so you can run commands such as `git goto` and `git pick` directly.

> Note: Administrative commands like `gpp doctor` and `gpp rebuild` must be invoked using `gpp`. All other subcommands can be run as either `gpp <command>` or `git <command>`.

### pnpm

```bash
pnpm install -g git-plus-plus
gpp rebuild
```

`pnpm` blocks postinstall scripts by default, so you'll need to run `gpp rebuild` once after installing to set up Git aliases. That said, Git++ automatically detects and fixes missing aliases on any run, so this step isn't strictly necessary.

---

## Quick Start

```bash
# Verify installation and alias setup
gpp doctor

# Switch branches interactively
git goto

# Stage specific changes
git pick

# Commit and push all changes
git publish "feat: add new feature"
```

---

## Overview

Git’s command-line interface is powerful but often verbose and unintuitive.  
Git++ addresses this by providing an interactive and efficient developer experience with:

- **Interactive selectors** for branches and files
- **Colorized and grouped output** for better visibility
- **Git aliases** that integrate seamlessly into existing workflows
- **Built-in safety checks** for destructive operations
- **Consistent, minimal syntax** for frequent Git commands

---

## Command Reference

### Administrative Commands

#### `gpp doctor`

Checks Git++ installation status, PATH configuration, and alias setup.

#### `gpp rebuild`

(Re)installs Git++ aliases in `~/.gitconfig`.  
Used when aliases are missing or misconfigured.

---

### Branch Operations

#### `git goto [branch]`

Switch to the specified branch.  
If no branch is provided, opens an interactive selector.

#### `git create [branch]`

Create and switch to a new branch. Prompts for a name if omitted.

#### `git delete [branches...]`

Delete one or more branches. Interactive multi-select if none specified.  
Displays a summary and requires confirmation.

#### `git rename`

Rename a selected branch interactively.

#### `git track [branch]`

Set the upstream branch for the current branch.  
Defaults to tracking the same branch name on origin.

---

### Change Management

#### `git pick [files...]`

Stage unstaged changes.  
If no files are specified, opens an interactive multi-select menu with color-coded file states.

#### `git drop [files...]`

Unstage staged changes.  
If no files are specified, opens an interactive multi-select menu with color-coded file states.

#### `git publish [message]`

Stage all changes, commit, and push to the remote branch.  
Prompts for a commit message if not provided, and shows a pre-commit summary for confirmation.

#### `git uncommit`

Undo the most recent commit while preserving changes in the staging area.  
Useful for adjusting commit messages or adding missing files.

#### `git wipe`

Discard all uncommitted changes and remove untracked files.  
This command is **destructive** and requires typing `confirm` to proceed.

---

### Worktree Operations

#### `git tree create [name] [branch]`

Create a worktree in a sibling directory of the main checkout, on `branch` (defaults to `name`).  
Creates the branch if it doesn't exist, initializes submodules, and offers to copy untracked and ignored files (such as `.env`).

#### `git tree list`

List all worktrees, marking the main and current ones.

#### `git tree goto [name]`

Open a shell in the specified worktree. Interactive selector if none specified.  
Running `goto` again inside that shell switches it to another worktree; type `exit` to leave.

#### `git tree delete [names...]`

Remove one or more worktrees and their branches. Interactive multi-select if none specified.  
Displays a summary, flags uncommitted changes, and requires confirmation.

#### `git tree detach`

Detach the current worktree from its branch, freeing the branch for use elsewhere.

---

## Configuration

Git++ does not create or manage external configuration files.  
All settings are stored in standard Git locations, specifically:

- Aliases in `~/.gitconfig` (managed by `gpp rebuild`)
- Existing Git configuration remains untouched

---

## Development

```bash
# Clone the repository
git clone https://github.com/farhadzaidi/git-plus-plus.git
cd git-plus-plus

# Install dependencies
pnpm install

# Run a specific command in development mode
pnpm dev goto

# Build for distribution
pnpm build

# Test local installation
pnpm pack
pnpm install -g ./git-plus-plus-1.0.0.tgz
```
