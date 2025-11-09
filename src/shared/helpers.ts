import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import { execa } from 'execa';
import { EXIT } from '@/shared/constants';

export async function safePrompt<T>(promptFn: () => Promise<T>): Promise<T | null> {
  try {
    return await promptFn();
  } catch (error: any) {
    if (error?.name === 'ExitPromptError') {
      console.log(chalk.red('Operation cancelled'));
      process.exit(EXIT.SUCCESS);
    }
    throw error;
  }
}

export async function genericConfirmPrompt(): Promise<boolean | null> {
  return safePrompt(() =>
    confirm({
      message: 'Confirm?',
      default: false,
      theme: {
        style: {
          answer: (text: string) => (text == 'Yes' ? chalk.green(text) : chalk.red(text)),
        },
      },
    })
  );
}

export async function getAllBranches() {
  try {
    // List all branches via stdout
    const { stdout } = await execa('git', ['--no-pager', 'branch']);

    // Parse and return output
    return stdout.split('\n').map((line) => {
      line = line.trim();
      return {
        name: line.replace(/^\*\s*/, ''),
        isCurrent: line.startsWith('*'),
      };
    });
  } catch (error) {
    console.log(chalk.red('Error: Failed to retrieve branches.'));
    process.exit(EXIT.FAILURE);
  }
}

export function processCommand(
  {
    stdout,
    stderr,
    exitCode,
  }: {
    stdout?: string;
    stderr?: string;
    exitCode?: number;
  },
  logStdOut = true
) {
  // If the command failed, print the error message and terminate
  if (exitCode && exitCode !== EXIT.SUCCESS) {
    if (stderr) console.log(stderr.trim());
    process.exit(exitCode);
  }

  // If there is any output, print it unless otherwise specified
  if (logStdOut && stdout) {
    console.log(stdout.trim());
  }
}

export function nl(count = 1) {
  // console.log always appends a new line so we add count - 1 new lines
  console.log('\n'.repeat(count - 1));
}
