import { execa } from 'execa';
import { checkbox } from '@inquirer/prompts';
import chalk from 'chalk';
import { CHANGE_POSITION, CHANGE_STATUS_COLORS } from '@/shared/constants';
import {
  safePrompt,
  genericConfirmPrompt,
  processCommand,
  nl,
  parseGitChanges,
  displayGroupedChanges,
} from '@/shared/helpers';

export async function execute(): Promise<void> {
  // Get current git status
  const statusResult = await execa('git', ['status', '--porcelain'], { reject: false });
  processCommand(statusResult, false);

  const currentStatus = statusResult.stdout;
  if (currentStatus === '') {
    console.log(chalk.cyan('No unstaged changes to pick.'));
    return;
  }

  // Parse unstaged changes (including untracked files)
  const parsedChanges = parseGitChanges(currentStatus, CHANGE_POSITION.UNSTAGED);
  if (parsedChanges.length === 0) {
    console.log(chalk.cyan('No unstaged changes to pick.'));
    return;
  }

  // Present checkbox for user to select changes to stage
  const selectedFiles = await safePrompt(() =>
    checkbox({
      message: chalk.cyan('Select changes to stage (Ctrl + C to cancel)'),
      choices: parsedChanges
        .sort((a, b) => a.fileName.localeCompare(b.fileName))
        .map((item) => {
          const color = CHANGE_STATUS_COLORS[item.changeStatus];
          return {
            name: color(`${item.changeStatus}: ${item.fileName}`),
            value: item.fileName,
          };
        }),
      loop: false,
      theme: {
        icon: {
          checked: chalk.green('◉'),
          unchecked: '◯',
        },
        style: {
          highlight: (text: string) => chalk.magenta(text),
          answer: () => '', // Hide the answer list since we display grouped changes below
        },
      },
    })
  );

  // If no files selected, exit
  if (selectedFiles.length === 0) {
    console.log('No changes selected');
    return;
  }

  // Display selected changes for confirmation
  const selectedChanges = parsedChanges.filter((item) => selectedFiles.includes(item.fileName));
  displayGroupedChanges(selectedChanges);

  // Confirm staging
  nl();
  const confirm = await genericConfirmPrompt();
  if (!confirm) return;

  // Stage the selected files
  for (const file of selectedFiles) {
    const addResult = await execa('git', ['add', file], { reject: false });
    processCommand(addResult, false);
  }

  nl();
  console.log(
    chalk.green(
      `Successfully staged ${selectedFiles.length} change${selectedFiles.length === 1 ? '' : 's'}`
    )
  );
}
