import { execa } from 'execa';
import { checkbox } from '@inquirer/prompts';
import chalk from 'chalk';
import { EXIT, Worktree, DETACHED_LABEL } from '@/shared/constants';
import {
  safePrompt,
  confirmOrExit,
  processCommand,
  getAllWorktrees,
  ensureWorktreesExist,
  findWorktree,
} from '@/shared/helpers';

export async function execute(names: string[]): Promise<void> {
  const worktrees = await getAllWorktrees();
  ensureWorktreesExist(worktrees);

  let targets: Worktree[];

  if (names.length) {
    // Find worktrees matching the provided names
    targets = [];
    for (const name of names) {
      const found = findWorktree(worktrees, name);
      if (!found) {
        console.log(chalk.red(`No worktree found matching "${name}"`));
        process.exit(EXIT.FAILURE);
      }
      if (!targets.includes(found)) targets.push(found);
    }
  } else {
    // Interactive multi-select
    const deletable = worktrees.filter((wt) => !wt.isMain && !wt.isCurrent);
    if (deletable.length === 0) {
      console.log(chalk.yellow('No worktrees available to delete.'));
      return;
    }

    targets = await safePrompt(() =>
      checkbox({
        message: chalk.cyan('Select worktrees to delete (Ctrl + C to cancel)'),
        choices: worktrees.map((wt) => {
          const label = `${wt.branch || DETACHED_LABEL} ${chalk.dim(wt.path)}`;
          let suffix = '';
          if (wt.isCurrent) suffix = ' (current)';
          else if (wt.isMain) suffix = ' [main]';

          return {
            name: `${label}${suffix}`,
            value: wt,
            disabled: wt.isMain || wt.isCurrent,
          };
        }),
        loop: false,
        theme: {
          icon: {
            checked: chalk.red('◉'),
            unchecked: '◯',
          },
          style: {
            highlight: (text: string) => chalk.red(text),
            answer: (text: string) => chalk.red(text),
          },
        },
      })
    );

    if (targets.length === 0) {
      console.log('No worktree selected');
      return;
    }
  }

  // Validate selections
  for (const wt of targets) {
    if (wt.isMain) {
      console.log(chalk.red('Cannot delete the main worktree.'));
      process.exit(EXIT.FAILURE);
    }

    if (wt.isCurrent) {
      console.log(
        chalk.red('Cannot delete the current worktree. Navigate to a different worktree first.')
      );
      process.exit(EXIT.FAILURE);
    }
  }

  await deleteWorktrees(targets);
}

async function deleteWorktrees(targets: Worktree[]): Promise<void> {
  // Show what will be removed (worktree + branch)
  console.log(chalk.yellow.bold('\nThe following will be deleted:'));
  for (const wt of targets) {
    const branchInfo = wt.branch
      ? `branch: ${chalk.magenta.bold(wt.branch)}`
      : chalk.dim.italic(DETACHED_LABEL);
    const dirtyInfo = (await hasUncommittedChanges(wt.path))
      ? chalk.red.bold(' (uncommitted changes will be lost)')
      : '';
    console.log(chalk.dim(`  • ${wt.path}`) + ` — ${branchInfo}${dirtyInfo}`);
  }

  await confirmOrExit();

  // Force is safe here since uncommitted changes were shown above, and it's
  // required to remove worktrees that contain submodules
  for (const wt of targets) {
    const removeResult = await execa('git', ['worktree', 'remove', '--force', wt.path], {
      reject: false,
    });
    processCommand(removeResult);
    console.log(chalk.green(`Removed worktree: ${chalk.dim(wt.path)}`));
  }

  // Delete associated branches
  const branchNames = targets.filter((wt) => wt.branch).map((wt) => wt.branch);
  if (branchNames.length > 0) {
    const branchResult = await execa('git', ['branch', '-D', ...branchNames], {
      reject: false,
    });
    processCommand(branchResult);
  }
}

async function hasUncommittedChanges(worktreePath: string): Promise<boolean> {
  const statusResult = await execa('git', ['-C', worktreePath, 'status', '--porcelain'], {
    reject: false,
  });
  return statusResult.stdout.trim().length > 0;
}
