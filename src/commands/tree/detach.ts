import { execa } from 'execa';
import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { EXIT } from '@/shared/constants';
import { safePrompt, processCommand, getAllWorktrees } from '@/shared/helpers';

export async function execute(): Promise<void> {
  const worktrees = await getAllWorktrees();
  const current = worktrees.find((wt) => wt.isCurrent);

  if (!current) {
    console.log(chalk.red('Could not determine current worktree.'));
    process.exit(EXIT.FAILURE);
  }

  if (!current.branch) {
    console.log(chalk.yellow('Already in detached HEAD state.'));
    return;
  }

  const confirmed = await safePrompt(() =>
    confirm({
      message: `Detach from branch ${chalk.magenta.bold(current.branch)}?`,
      default: false,
      theme: {
        style: {
          answer: (text: string) => (text === 'Yes' ? chalk.green(text) : chalk.red(text)),
        },
      },
    })
  );

  if (!confirmed) {
    process.exit(EXIT.SUCCESS);
  }

  const result = await execa('git', ['checkout', '--detach'], { reject: false });
  processCommand(result);

  console.log(
    chalk.green(
      `Detached from branch ${chalk.magenta.bold(current.branch)}. The branch is now free for use in other worktrees.`
    )
  );
}
