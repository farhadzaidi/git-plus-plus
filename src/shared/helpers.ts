import chalk from 'chalk';
import { confirm, select } from '@inquirer/prompts';
import { execa } from 'execa';
import {
  EXIT,
  ChangeStatus,
  CHANGE_STATUS_MAPPING,
  CHANGE_STATUS_COLORS,
  CHANGE_STATUS_ORDER,
  CHANGE_POSITION,
  ParsedChanges,
  ChangePosition,
} from '@/shared/constants';

type Branch = {
  name: string;
  isCurrent: boolean;
};

// =============================================================================
// PROMPT UTILITIES
// =============================================================================

/**
 * Wraps an Inquirer prompt with error handling to allow user to cancel with Ctrl + C
 * @param promptFn - The prompt function to execute
 * @returns The result of the prompt
 * @throws Re-throws any errors that are not user cancellations
 */
export async function safePrompt<T>(promptFn: () => Promise<T>): Promise<T> {
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

/**
 * Shows a confirmation prompt and exits if user declines
 */
export async function confirmOrExit(): Promise<void> {
  nl();
  const confirmed = await safePrompt(() =>
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

  if (!confirmed) {
    process.exit(EXIT.SUCCESS);
  }
}

/**
 * Prompts user to select a branch from a list
 * @param branches - Array of branch objects
 * @returns Selected branch name
 */
export async function promptForBranch(branches: Branch[]): Promise<string> {
  return safePrompt(() =>
    select({
      message: chalk.cyan('Select a branch (Ctrl + C to cancel)'),
      choices: branches.map((b) => ({
        name: b.isCurrent
          ? `${chalk.green('●')} ${b.name} ${chalk.dim.italic('(current)')}`
          : `  ${b.name}`,
        value: b.name,
      })),
      default: branches.find((b) => b.isCurrent)?.name,
      theme: {
        style: {
          highlight: (text: string) => chalk.magenta.bold(text),
          answer: (text: string) => chalk.green(text),
        },
      },
    })
  );
}

// =============================================================================
// GIT OPERATIONS
// =============================================================================

/**
 * Retrieves all git branches in the current repository
 * @returns Array of branch objects with name and current status
 */
export async function getAllBranches(): Promise<Branch[]> {
  try {
    const { stdout } = await execa('git', ['--no-pager', 'branch']);

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

/**
 * Gets the current git status using porcelain format
 * @returns Git status output string
 */
export async function getGitStatus(): Promise<string> {
  const statusResult = await execa('git', ['status', '--porcelain'], { reject: false });
  processCommand(statusResult, false);
  return statusResult.stdout;
}

/**
 * Ensures at least one commit exists in the repository
 * Logs warning and exits if no commits found
 */
export async function ensureCommitsExist(): Promise<void> {
  const hasCommits = await execa('git', ['rev-parse', 'HEAD'], { reject: false });
  if (hasCommits.exitCode !== EXIT.SUCCESS) {
    console.log(chalk.yellow('No commits found. Create an initial commit first.'));
    process.exit(EXIT.SUCCESS);
  }
}

/**
 * Ensures at least one branch exists in the repository
 * Logs warning and exits if no branches found
 * @param branches - Array of branches
 */
export function ensureBranchesExist(branches: Branch[]): void {
  if (branches.length === 0) {
    console.log(chalk.yellow('No branches found. Create an initial commit first.'));
    process.exit(EXIT.SUCCESS);
  }
}

/**
 * Ensures a git remote is configured
 * Logs warning and exits if no remote found
 */
export async function ensureRemoteExists(): Promise<void> {
  const remoteResult = await execa('git', ['remote'], { reject: false });
  if (remoteResult.exitCode !== EXIT.SUCCESS || !remoteResult.stdout.trim()) {
    console.log(
      chalk.yellow('No remote configured. Add a remote first with: git remote add origin <url>')
    );
    process.exit(EXIT.SUCCESS);
  }
}

/**
 * Processes the result of a command execution and handles errors
 * @param result - Object containing stdout, stderr, and exitCode from command execution
 * @param logStdOut - Whether to log stdout to console (default: true)
 */
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
): void {
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

/**
 * Parses 'git status --porcelain' output into structured change objects
 * @param status - The output from 'git status --porcelain'
 * @param position - Whether to parse staged or unstaged changes
 * @returns Array of parsed changes with file names and change statuses
 */
export function parseGitChanges(status: string, position: ChangePosition): ParsedChanges {
  const result: ParsedChanges = [];
  const lines = status.split('\n').filter(Boolean);

  for (const line of lines) {
    // 'git status --porcelain' output format: XY filename
    // X = staged status, Y = unstaged status
    const statusCode = position === CHANGE_POSITION.STAGED ? line[0] : line[1];
    const fileName = line.slice(2).trim();

    // Handle untracked files (marked as ??)
    if (line.startsWith('??')) {
      // Untracked changes are considered unstaged
      if (position === CHANGE_POSITION.UNSTAGED) {
        result.push({ fileName, changeStatus: ChangeStatus.CREATED });
      }
      continue;
    }

    // Skip if position is empty (space means no change at that position)
    if (statusCode === ' ') {
      continue;
    }

    // Handle merge conflicts
    if (line[0] === 'U' || line[1] === 'U') {
      console.log(chalk.yellow('Merge conflict(s) detected. Please resolve before continuing.'));
      process.exit(EXIT.SUCCESS);
    }

    // Validate and map status code
    if (!isValidStatusCode(statusCode)) {
      console.log(chalk.red('Error: Unable to parse git status.'));
      process.exit(EXIT.FAILURE);
    }

    const changeStatus = CHANGE_STATUS_MAPPING[statusCode];
    result.push({ fileName, changeStatus });
  }

  return result;
}

/**
 * Type guard to validate git status codes
 * @param key - The status code to validate
 * @returns True if the key is a valid status code
 */
function isValidStatusCode(key: string): key is keyof typeof CHANGE_STATUS_MAPPING {
  return key in CHANGE_STATUS_MAPPING;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Prints one or more newlines to the console
 * @param count - Number of newlines to print (default: 1)
 */
export function nl(count = 1): void {
  // console.log always appends a new line so we add count - 1 new lines
  console.log('\n'.repeat(count - 1));
}

/**
 * Displays changes grouped by status with color-coded headers
 * Files are sorted alphabetically within each status group
 * @param parsedChanges - Array of parsed changes to display
 */
export function displayGroupedChanges(parsedChanges: ParsedChanges): void {
  // Group changes by status
  const grouped: Partial<Record<ChangeStatus, string[]>> = {};
  for (const { fileName, changeStatus } of parsedChanges) {
    if (!grouped[changeStatus]) {
      grouped[changeStatus] = [];
    }
    grouped[changeStatus].push(fileName);
  }

  // Display grouped by status
  for (const status of CHANGE_STATUS_ORDER) {
    const fileNames = grouped[status];
    if (!fileNames) continue;

    const color = CHANGE_STATUS_COLORS[status];
    console.log(color.bold(`\n${status}:`));

    // Sort files alphabetically within the status group
    const sortedFiles = [...fileNames].sort((a, b) => a.localeCompare(b));
    for (const fileName of sortedFiles) {
      console.log(color(`  ${fileName}`));
    }
  }
}
