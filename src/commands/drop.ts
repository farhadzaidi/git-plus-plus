import { execa } from 'execa';
import { checkbox } from '@inquirer/prompts';
import chalk from 'chalk';
import { EXIT, CHANGE_POSITION, CHANGE_STATUS_COLORS, ParsedChanges } from '@/shared/constants';
import {
  safePrompt,
  confirmOrExit,
  processCommand,
  parseGitChanges,
  displayGroupedChanges,
  getGitStatus,
} from '@/shared/helpers';

export async function execute(files?: string[]): Promise<void> {
  // Get current status and validate that there are changes
  const currentStatus = await getGitStatus();
  if (currentStatus === '') {
    console.log(chalk.cyan('No staged changes to unstage.'));
    return;
  }

  // Parse staged changes
  const parsedChanges = parseGitChanges(currentStatus, CHANGE_POSITION.STAGED);
  if (parsedChanges.length === 0) {
    console.log(chalk.cyan('No staged changes to unstage.'));
    return;
  }

  let selectedFiles: string[];

  // If files are provided via args, validate they're all staged
  if (files && files.length > 0) {
    validateProvidedFileArgs(files, parsedChanges);
    selectedFiles = files;
  } else {
    // Otherwise open up interactive promp
    selectedFiles = await promptForChangesToUnstage(parsedChanges);
    if (selectedFiles.length === 0) {
      console.log('No changes selected');
      return;
    }
  }

  // Display selected changes for confirmation
  const selectedChanges = parsedChanges.filter((item) => selectedFiles.includes(item.fileName));
  displayGroupedChanges(selectedChanges);

  // Confirm unstaging
  await confirmOrExit();

  // Unstage the selected files
  for (const file of selectedFiles) {
    const restoreResult = await execa('git', ['restore', '--staged', file], { reject: false });
    processCommand(restoreResult, false);
  }

  console.log(
    chalk.green(
      `\nSuccessfully unstaged ${selectedFiles.length} change${selectedFiles.length === 1 ? '' : 's'}`
    )
  );
}

async function promptForChangesToUnstage(changes: ParsedChanges): Promise<string[]> {
  return await safePrompt(() =>
    checkbox({
      message: chalk.cyan('Select changes to unstage (Ctrl + C to cancel)'),
      choices: changes
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
          checked: chalk.yellow('◉'),
          unchecked: '◯',
        },
        style: {
          answer: () => '', // Hide the answer list since we display grouped changes below
        },
      },
    })
  );
}

function validateProvidedFileArgs(files: string[], changes: ParsedChanges): void {
  const stagedFileNames = changes.map((c) => c.fileName);
  const invalidFiles = files.filter((f) => !stagedFileNames.includes(f));

  if (invalidFiles.length > 0) {
    console.log(chalk.yellow('\nThe following files are not in staged changes:'));
    for (const file of invalidFiles) {
      console.log(chalk.yellow(`  ${file}`));
    }

    console.log(chalk.yellow('\nAborting.'));
    process.exit(EXIT.FAILURE);
  }
}
