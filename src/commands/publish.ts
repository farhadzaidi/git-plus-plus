import { execa } from 'execa';
import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import { CHANGE_POSITION } from '@/shared/constants';
import {
  confirmOrExit,
  safePrompt,
  ensureRemoteExists,
  processCommand,
  nl,
  parseGitChanges,
  displayGroupedChanges,
} from '@/shared/helpers';

export async function execute(message?: string): Promise<void> {
  await ensureRemoteExists();

  // Stage all changes to resolve any conflicted states (e.g. delete + create could be rename)
  const addResult = await execa('git', ['add', '.'], { reject: false });
  processCommand(addResult, false);

  // Get current git status
  const statusResult = await execa('git', ['status', '--porcelain'], { reject: false });
  processCommand(statusResult, false);

  // Return early if there are no changes
  const currentStatus = statusResult.stdout;
  if (currentStatus === '') {
    console.log(chalk.cyan('No changes to publish in this branch.'));
    return;
  }

  // Parse and display staged changes
  const parsedChanges = parseGitChanges(currentStatus, CHANGE_POSITION.STAGED);
  displayGroupedChanges(parsedChanges);

  // Prompt user for confirmation
  await confirmOrExit();

  // Prompt user for the commit message if they didn't provide one
  let commitMessage = message;
  if (!commitMessage) {
    nl();
    commitMessage = await safePrompt(() =>
      input({
        message: chalk.cyan('Enter a commit message (Ctrl + C to cancel)\n'),
        required: true,
        theme: {
          style: {
            answer: (text: string) => chalk.magenta(text),
          },
        },
      })
    );
  }

  // Publish
  nl();
  await publish(commitMessage);
  console.log(chalk.green('Successfully published changes'));
}

async function publish(commitMessage: string) {
  const addResult = await execa('git', ['add', '.'], { reject: false });
  processCommand(addResult, false);

  const commitResult = await execa('git', ['commit', '-m', commitMessage], { reject: false });
  processCommand(commitResult, false);

  const pushResult = await execa('git', ['push'], { reject: false });
  processCommand(pushResult);
}
