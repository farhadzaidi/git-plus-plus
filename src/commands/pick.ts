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
    console.log(chalk.cyan('No unstaged changes to pick.'));
    return;
  }

  // Parse unstaged changes (including untracked files)
  const parsedChanges = parseGitChanges(currentStatus, CHANGE_POSITION.UNSTAGED);
  if (parsedChanges.length === 0) {
    console.log(chalk.cyan('No unstaged changes to pick.'));
    return;
  }

  let selectedFiles: string[];

  // If files are provided via args, validate they're all unstaged
  if (files && files.length > 0) {
    validateProvidedFileArgs(files, parsedChanges);
    selectedFiles = files;
  } else {
    selectedFiles = await promptForChangesToStage(parsedChanges);
    if (selectedFiles.length === 0) {
      console.log('No changes selected');
      return;
    }
  }

  // Display selected changes for confirmation
  const selectedChanges = parsedChanges.filter((item) => selectedFiles.includes(item.fileName));
  displayGroupedChanges(selectedChanges);

  // Confirm staging
  await confirmOrExit();

  // Stage the selected files
  for (const file of selectedFiles) {
    const addResult = await execa('git', ['add', file], { reject: false });
    processCommand(addResult, false);
  }

  console.log(
    chalk.green(
      `\nSuccessfully staged ${selectedFiles.length} change${selectedFiles.length === 1 ? '' : 's'}`
    )
  );
}

async function promptForChangesToStage(changes: ParsedChanges): Promise<string[]> {
  return await safePrompt(() =>
    checkbox({
      message: chalk.cyan('Select changes to stage (Ctrl + C to cancel)'),
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
          checked: chalk.green('◉'),
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
  const unstagedFileNames = changes.map((c) => c.fileName);
  const invalidFiles = files.filter((f) => !unstagedFileNames.includes(f));

  if (invalidFiles.length > 0) {
    console.log(chalk.yellow('\nThe following files are not in unstaged changes:'));
    for (const file of invalidFiles) {
      console.log(chalk.yellow(`  ${file}`));
    }

    console.log(chalk.yellow('\nAborting.'));
    process.exit(EXIT.FAILURE);
  }
}
