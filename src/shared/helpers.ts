import fs from 'fs';
import path from 'path';
import os from 'os';
import ini from 'ini';
import chalk from 'chalk';
import { confirm, select } from '@inquirer/prompts';
import { execa } from 'execa';
import {
  EXIT,
  GIT_COMMANDS,
  GITCONFIG_ALIASES,
  ChangeStatus,
  CHANGE_STATUS_MAPPING,
  CHANGE_STATUS_COLORS,
  CHANGE_STATUS_ORDER,
  CHANGE_POSITION,
  ParsedChanges,
  ChangePosition,
  IniConfig,
  Worktree,
  BRANCH_REF_PREFIX,
  DETACHED_LABEL,
} from '@/shared/constants';

type Branch = {
  name: string;
  isCurrent: boolean;
  isInWorktree: boolean;
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
        disabled: b.isInWorktree && '(in another worktree)',
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

    return stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        line = line.trim();
        return {
          name: line.replace(/^[*+]\s*/, ''),
          isCurrent: line.startsWith('*'),
          isInWorktree: line.startsWith('+'),
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
 * Checks if a branch exists in the repository
 * @param branch - The branch name to check
 * @returns True if the branch exists
 */
export async function branchExists(branch: string): Promise<boolean> {
  const result = await execa(
    'git',
    ['rev-parse', '--verify', '--quiet', `${BRANCH_REF_PREFIX}${branch}`],
    {
      reject: false,
    }
  );
  return result.exitCode === EXIT.SUCCESS;
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

// =============================================================================
// WORKTREE OPERATIONS
// =============================================================================

/**
 * Retrieves all git worktrees by parsing `git worktree list --porcelain`
 * @returns Array of Worktree objects
 */
export async function getAllWorktrees(): Promise<Worktree[]> {
  const result = await execa('git', ['worktree', 'list', '--porcelain'], { reject: false });
  processCommand(result, false);

  const output = result.stdout.trim();
  if (!output) return [];

  const toplevelResult = await execa('git', ['rev-parse', '--show-toplevel'], { reject: false });
  const currentRoot = toplevelResult.stdout.trim();
  const worktrees: Worktree[] = [];
  const blocks = output.split('\n\n');

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const lines = block.split('\n');

    let wtPath = '';
    let head = '';
    let branch = '';
    let isBare = false;

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        wtPath = line.slice('worktree '.length);
      } else if (line.startsWith('HEAD ')) {
        head = line.slice('HEAD '.length);
      } else if (line.startsWith('branch ')) {
        branch = line.slice('branch '.length).replace(BRANCH_REF_PREFIX, '');
      } else if (line === 'bare') {
        isBare = true;
      }
    }

    if (isBare) continue;

    worktrees.push({
      path: wtPath,
      head,
      branch,
      isCurrent: path.resolve(wtPath) === path.resolve(currentRoot),
      isMain: i === 0,
    });
  }

  return worktrees;
}

/**
 * Finds a worktree by branch name or directory name
 * @param worktrees - Array of worktrees
 * @param name - Branch name or directory name to match
 * @returns The matching worktree, or undefined
 */
export function findWorktree(worktrees: Worktree[], name: string): Worktree | undefined {
  return worktrees.find((wt) => wt.branch === name || wt.path.endsWith(`/${name}`));
}

/**
 * Ensures at least one linked worktree exists (besides the main one)
 * @param worktrees - Array of worktrees
 */
export function ensureWorktreesExist(worktrees: Worktree[]): void {
  if (worktrees.length <= 1) {
    console.log(chalk.yellow('No linked worktrees found.'));
    process.exit(EXIT.SUCCESS);
  }
}

/**
 * Prompts user to select a worktree from a list
 * @param worktrees - Array of worktree objects
 * @param options - Filter and message configuration
 * @returns The selected Worktree object
 */
export async function promptForWorktree(
  worktrees: Worktree[],
  options: {
    exclude?: (wt: Worktree) => boolean;
    message?: string;
  } = {}
): Promise<Worktree> {
  const { exclude, message } = options;
  const filtered = exclude ? worktrees.filter((wt) => !exclude(wt)) : worktrees;

  if (filtered.length === 0) {
    console.log(chalk.yellow('No worktrees available to select.'));
    process.exit(EXIT.SUCCESS);
  }

  return safePrompt(() =>
    select({
      message: message || chalk.cyan('Select a worktree (Ctrl + C to cancel)'),
      choices: filtered.map((wt) => ({
        name: wt.isCurrent
          ? `${chalk.green('●')} ${wt.branch || chalk.dim(DETACHED_LABEL)} ${chalk.dim(wt.path)} ${chalk.dim.italic('(current)')}`
          : `  ${wt.branch || chalk.dim(DETACHED_LABEL)} ${chalk.dim(wt.path)}`,
        value: wt,
      })),
      theme: {
        style: {
          highlight: (text: string) => chalk.magenta.bold(text),
          answer: (text: string) => chalk.green(text),
        },
      },
    })
  );
}

/**
 * Gets the root path of the main worktree
 * @returns Absolute path to the main worktree root
 */
export async function getMainWorktreeRoot(): Promise<string> {
  const result = await execa('git', ['worktree', 'list', '--porcelain'], { reject: false });
  processCommand(result, false);

  const firstLine = result.stdout.split('\n')[0];
  return firstLine.slice('worktree '.length);
}

/**
 * Gets the path to the .gitconfig file
 * @returns Absolute path to .gitconfig
 */
export function getGitConfigPath(): string {
  return path.join(os.homedir(), '.gitconfig');
}

/**
 * Checks if all Git++ aliases are correctly configured in .gitconfig
 * @returns True if all aliases match expected values
 */
export function aliasesAreValid(): boolean {
  const config = readGitConfig();
  const aliases = config.alias || {};
  return GIT_COMMANDS.every((cmd) => aliases[cmd] === GITCONFIG_ALIASES[cmd]);
}

/**
 * Reads and parses the .gitconfig file
 * @returns Parsed gitconfig object, or empty object if file doesn't exist
 */
export function readGitConfig(): IniConfig {
  const gitConfigPath = getGitConfigPath();
  if (!fs.existsSync(gitConfigPath)) {
    return {};
  }
  return ini.parse(fs.readFileSync(gitConfigPath, 'utf-8'));
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
      process.exit(EXIT.FAILURE);
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
