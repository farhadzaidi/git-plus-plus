import { execa } from 'execa';
import { checkbox } from '@inquirer/prompts';
import chalk from 'chalk';
import {
  safePrompt,
  genericConfirmPrompt,
  getAllBranches,
  processCommand,
  nl,
} from '@/shared/helpers';

export async function execute(branches: string[]): Promise<void> {
  // If the branches to delete are provided, delete them
  if (branches.length) {
    const result = await execa('git', ['branch', '-D', ...branches], { reject: false });
    processCommand(result);
    return;
  }

  // If no branch is provided, get all of them and allow user to select multiple (except current)
  const allBranches = await getAllBranches();
  const branchesToDelete = await safePrompt(() =>
    checkbox({
      message: chalk.cyan('Select one or more branches to delete (Ctrl + C to cancel): '),
      choices: allBranches.map((b) => ({
        name: b.isCurrent ? `${b.name} (current)` : b.name,
        value: b.name,
        disabled: b.isCurrent,
      })),
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

  if (branchesToDelete.length) {
    console.log(chalk.yellow.bold('\nDeleting the following branches:'));
    for (const branch of branchesToDelete) {
      console.log(chalk.dim(`  • ${branch}`));
    }

    nl();
    const confirm = await genericConfirmPrompt();
    if (!confirm) return;
    nl();

    const result = await execa('git', ['branch', '-D', ...branchesToDelete], { reject: false });
    processCommand(result);
  } else {
    console.log('No branch selected.');
  }
}
