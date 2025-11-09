import { execa } from 'execa';
import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import {
  safePrompt,
  confirmOrExit,
  getAllBranches,
  ensureBranchesExist,
  processCommand,
  nl,
  promptForBranch,
} from '@/shared/helpers';

export async function execute(): Promise<void> {
  const allBranches = await getAllBranches();
  ensureBranchesExist(allBranches);

  const selectedBranch = await promptForBranch(allBranches);

  // Switch to the selected branch
  nl();
  const newName = await safePrompt(() =>
    input({
      message: chalk.cyan('Enter new branch name (Ctrl + C to cancel): '),
      required: true,
      theme: {
        style: {
          answer: (text: string) => chalk.magenta(text),
        },
      },
    })
  );

  console.log(
    chalk.green(
      `\n\t${chalk.cyan.bold(selectedBranch)} ${chalk.green('-->')} ${chalk.magenta.bold(newName)}`
    )
  );
  await confirmOrExit();

  const result = await execa('git', ['branch', '-m', selectedBranch, newName], { reject: false });
  processCommand(result);

  console.log(`\nRenamed ${chalk.cyan.bold(selectedBranch)} to ${chalk.magenta.bold(newName)}`);
}
