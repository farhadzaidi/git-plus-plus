import { execa } from 'execa';
import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import { safePrompt, ensureCommitsExist, processCommand } from '@/shared/helpers';

export async function execute(branch?: string): Promise<void> {
  await ensureCommitsExist();

  // If the branch is provided, create it
  if (branch) {
    await createBranch(branch);
    return;
  }

  // If the branch is not provided, prompt the user to enter a brach name
  const newBranch = await safePrompt(() =>
    input({
      message: chalk.cyan('Enter a name for the new branch (Ctrl + C to cancel)\n'),
      required: true,
      theme: {
        style: {
          answer: (text: string) => chalk.magenta(text),
        },
      },
    })
  );

  await createBranch(newBranch);
}

async function createBranch(branch: string): Promise<void> {
  const result = await execa('git', ['checkout', '-b', branch], { reject: false });
  processCommand(result);

  console.log(
    chalk.green(`Successfully created and switched to branch ${chalk.magenta.bold(branch)}`)
  );
}
