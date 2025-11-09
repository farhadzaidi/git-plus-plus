import { execa } from 'execa';
import { select, input } from '@inquirer/prompts';
import chalk from 'chalk';
import {
  safePrompt,
  genericConfirmPrompt,
  getAllBranches,
  processCommand,
  nl,
} from '@/shared/helpers';

export async function execute(): Promise<void> {
  const allBranches = await getAllBranches();
  const selectedBranch = await safePrompt(() =>
    select({
      message: chalk.cyan('Select a branch (Ctrl + C to cancel)'),
      choices: allBranches.map((b) => ({
        name: b.isCurrent
          ? `${chalk.green('●')} ${b.name} ${chalk.dim.italic('(current)')}`
          : `  ${b.name}`,
        value: b.name,
      })),
      default: allBranches.find((b) => b.isCurrent)?.name,
      theme: {
        style: {
          highlight: (text: string) => chalk.magenta.bold(text),
          answer: (text: string) => chalk.green(text),
        },
      },
    })
  );

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
      `\n\t${chalk.cyan.bold(selectedBranch)} ${chalk.green('-->')} ${chalk.magenta.bold(newName)}\n`
    )
  );
  const confirm = await genericConfirmPrompt();
  if (!confirm) return;

  const result = await execa('git', ['branch', '-m', selectedBranch, newName], { reject: false });
  processCommand(result);

  console.log(`\nRenamed ${chalk.cyan.bold(selectedBranch)} to ${chalk.magenta.bold(newName)}`);
}
