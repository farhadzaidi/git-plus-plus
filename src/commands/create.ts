import { execa } from 'execa';
import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import { processCommand } from '@/shared/helpers';
import { EXIT } from '@/shared/constants';

export async function execute(branch?: string): Promise<void> {
  // If the branch is provided, create it
  if (branch) {
    await createBranch(branch);
  }

  // If the branch is not provided, prompt the user to enter a brach name
  let newBranch: string | undefined = undefined;
  try {
    newBranch = await input({
      message: chalk.cyan('Enter a name for the new branch (Ctrl + C to cancel)\n'),
      required: true,
      theme: {
        style: {
          answer: (text: string) => chalk.magenta(text),
        }
      }
    });
  } catch (error: any) {
    if (error.name === 'ExitPromptError') {
      console.log(chalk.red('Operation cancelled'));
      process.exit(EXIT.SUCCESS);
    }
  }

  if (newBranch) {
    await createBranch(newBranch);
  }
}

async function createBranch(branch: string): Promise<void> {
  const result = await execa('git', ['checkout', '-b', branch], { reject: false });
  processCommand(result);
}