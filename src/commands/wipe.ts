import { execa } from 'execa';
import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import { ensureCommitsExist, getGitStatus, safePrompt, processCommand } from '@/shared/helpers';

export async function execute(): Promise<void> {
  await ensureCommitsExist();

  // Check if there are any changes to lose
  const currentStatus = await getGitStatus();
  if (currentStatus === '') {
    console.log(chalk.cyan('Working directory is already clean. Nothing to wipe.'));
    return;
  }

  // Show warning message
  console.log(chalk.red.bold('\nWARNING: DESTRUCTIVE OPERATION'));
  console.log(
    chalk.red(
      'This will permanently discard ALL uncommitted changes in your working directory and staging area.'
    )
  );
  console.log(chalk.red('This operation cannot be undone.\n'));

  // Ask user to type "confirm"
  const confirmation = await safePrompt(() =>
    input({
      message: chalk.yellow('Type "confirm" to proceed'),
      theme: {
        style: {
          answer: (text: string) => chalk.red(text),
        },
      },
    })
  );

  if (confirmation !== 'confirm') {
    console.log(chalk.yellow('Operation cancelled'));
    return;
  }

  // Execute Order 66
  const result = await execa('git', ['reset', '--hard'], { reject: false });
  processCommand(result);

  console.log(chalk.green('\nWorking directory has been reset to HEAD'));
}
