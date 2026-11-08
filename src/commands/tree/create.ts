import path from 'path';
import fs from 'fs';
import { execa } from 'execa';
import { input, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { EXIT } from '@/shared/constants';
import {
  safePrompt,
  processCommand,
  getAllWorktrees,
  getMainWorktreeRoot,
  branchExists,
  ensureCommitsExist,
  nl,
} from '@/shared/helpers';

export async function execute(name?: string, branch?: string): Promise<void> {
  await ensureCommitsExist();

  const mainRoot = await getMainWorktreeRoot();
  const parentDir = path.dirname(mainRoot);

  if (!name) {
    name = await safePrompt(() =>
      input({
        message: chalk.cyan('Enter a name for the new worktree (Ctrl + C to cancel)\n'),
        required: true,
        theme: {
          style: {
            answer: (text: string) => chalk.magenta(text),
          },
        },
      })
    );
  }

  const worktreePath = path.join(parentDir, name);
  const targetBranch = branch || name;

  // Checked up front since a failed `git worktree add -b` still leaves the new branch behind
  if (fs.existsSync(worktreePath)) {
    console.log(chalk.red(`${chalk.bold(worktreePath)} already exists`));
    process.exit(EXIT.FAILURE);
  }

  await createWorktree(worktreePath, targetBranch);
  await initSubmodules(worktreePath);
  await offerToCopyUntrackedFiles(worktreePath);

  nl();
  console.log(chalk.green(`Worktree created at ${chalk.magenta.bold(worktreePath)}`));
}

async function createWorktree(worktreePath: string, targetBranch: string): Promise<void> {
  const branchAlreadyExists = await branchExists(targetBranch);

  if (branchAlreadyExists) {
    // Ensure branch isn't already checked out in another worktree
    const worktrees = await getAllWorktrees();
    const inUse = worktrees.find((wt) => wt.branch === targetBranch);
    if (inUse) {
      console.log(
        chalk.yellow(
          `Branch ${chalk.bold(targetBranch)} is already checked out in a worktree at ${chalk.bold(inUse.path)}`
        )
      );
      process.exit(EXIT.SUCCESS);
    }

    nl();
    const useExisting = await safePrompt(() =>
      confirm({
        message: `Branch ${chalk.magenta.bold(targetBranch)} already exists. Create worktree using this branch?`,
        default: true,
        theme: {
          style: {
            answer: (text: string) => (text === 'Yes' ? chalk.green(text) : chalk.red(text)),
          },
        },
      })
    );

    if (!useExisting) {
      process.exit(EXIT.SUCCESS);
    }

    // Create worktree with the existing branch
    const result = await execa('git', ['worktree', 'add', worktreePath, targetBranch], {
      reject: false,
    });
    processCommand(result);
  } else {
    // Create worktree with a new branch
    const result = await execa('git', ['worktree', 'add', worktreePath, '-b', targetBranch], {
      reject: false,
    });
    processCommand(result);
  }
}

async function initSubmodules(worktreePath: string): Promise<void> {
  const gitmodulesPath = path.join(worktreePath, '.gitmodules');
  if (!fs.existsSync(gitmodulesPath)) return;

  console.log(chalk.dim('\nInitializing submodules...'));
  const result = await execa(
    'git',
    ['-C', worktreePath, 'submodule', 'update', '--init', '--recursive'],
    { reject: false }
  );
  processCommand(result, false);
}

async function offerToCopyUntrackedFiles(worktreePath: string): Promise<void> {
  // Nothing to copy when not run from a working tree (e.g. inside a bare repo)
  const rootResult = await execa('git', ['rev-parse', '--show-toplevel'], { reject: false });
  if (rootResult.exitCode !== EXIT.SUCCESS) return;
  const currentRoot = rootResult.stdout.trim();

  // Includes ignored files (e.g. .env) since those are usually what a new worktree is missing
  const untrackedResult = await execa('git', ['-C', currentRoot, 'ls-files', '--others'], {
    reject: false,
  });
  processCommand(untrackedResult, false);

  const untrackedFiles = untrackedResult.stdout.trim().split('\n').filter(Boolean);
  if (untrackedFiles.length === 0) return;

  nl();
  const shouldCopy = await safePrompt(() =>
    confirm({
      message: `Copy ${untrackedFiles.length} untracked file(s) to the new worktree?`,
      default: false,
      theme: {
        style: {
          answer: (text: string) => (text === 'Yes' ? chalk.green(text) : chalk.red(text)),
        },
      },
    })
  );
  if (!shouldCopy) return;

  for (const file of untrackedFiles) {
    // cpSync recreates symlinks as-is instead of following them
    fs.cpSync(path.join(currentRoot, file), path.join(worktreePath, file), {
      recursive: true,
      verbatimSymlinks: true,
    });
  }
  console.log(chalk.green(`Copied ${untrackedFiles.length} file(s)`));
}
