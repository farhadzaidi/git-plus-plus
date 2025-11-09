import { execa } from 'execa';
import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import { safePrompt, getAllBranches, processCommand } from '@/shared/helpers';

export async function execute(branch?: string): Promise<void> {
  // If the branch is provided, switch to it (delegate to git)
  if (branch) {
    const result = await execa('git', ['switch', branch], { reject: false });
    processCommand(result);
    return;
  }

  // If the branch isn't provided, get all branches and prompt user to select one
  const allBranches = await getAllBranches();
  const selectedBranch = await safePrompt(() =>
    select({
      message: chalk.cyan('Select a branch (Ctrl + C to cancel): '),
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
  if (selectedBranch) {
    const result = await execa('git', ['switch', selectedBranch], { reject: false });
    processCommand(result);
  }
}
