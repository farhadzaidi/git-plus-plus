import chalk from 'chalk';
import { DETACHED_LABEL } from '@/shared/constants';
import { getAllWorktrees } from '@/shared/helpers';

export async function execute(): Promise<void> {
  const worktrees = await getAllWorktrees();

  if (worktrees.length === 0) {
    console.log(chalk.yellow('No worktrees found.'));
    return;
  }

  console.log(chalk.cyan.bold('\nWorktrees:\n'));

  for (const wt of worktrees) {
    const branchDisplay = wt.branch
      ? chalk.magenta.bold(wt.branch)
      : chalk.dim.italic(DETACHED_LABEL);

    const marker = wt.isCurrent ? chalk.green('● ') : '  ';
    const currentTag = wt.isCurrent ? chalk.dim.italic(' (current)') : '';
    const mainTag = wt.isMain ? chalk.dim.italic(' [main]') : '';

    console.log(`${marker}${branchDisplay}${mainTag}${currentTag}`);
    console.log(`    ${chalk.dim(wt.path)}`);
  }

  console.log();
}
