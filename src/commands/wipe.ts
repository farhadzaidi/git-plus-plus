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
      'This will permanently discard ALL uncommitted changes and untracked files in your working directory.'
    )
  );
  console.log(chalk.red('This operation cannot be undone.\n'));

  // Ask user to type "confirm"
  const confirmation = await safePrompt(() =>
    input({
      message: chalk.yellow('Type "confirm" to proceed (Ctrl + C to cancel): '),
      theme: {
        style: {
          answer: (text: string) => chalk.red(text),
        },
      },
    })
  );

  if (confirmation !== 'confirm') {
    console.log(chalk.red('Operation cancelled'));
    return;
  }

  // Reset all tracked changes
  const resetResult = await execa('git', ['reset', '--hard'], { reject: false });
  processCommand(resetResult);

  // Remove all untracked files and directories
  const cleanResult = await execa('git', ['clean', '-fd'], { reject: false });
  processCommand(cleanResult);

  console.log(chalk.green('\nWorking directory has been wiped clean'));
}
