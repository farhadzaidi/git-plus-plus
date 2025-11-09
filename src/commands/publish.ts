import { execa } from 'execa';
import { input } from '@inquirer/prompts';
import chalk, { ChalkInstance } from 'chalk';
import { EXIT } from '@/shared/constants';
import { genericConfirmPrompt, safePrompt, processCommand, nl } from '@/shared/helpers';

enum FileStatus {
  CREATED = 'created',
  MODIFIED = 'modified',
  DELETED = 'deleted',
  RENAMED = 'renamed',
}

type ParseGitStatusResult = {
  fileName: string;
  fileStatus: FileStatus;
}[];

const STATUS_MAPPING: Record<string, FileStatus> = {
  '?': FileStatus.CREATED,
  A: FileStatus.CREATED,
  M: FileStatus.MODIFIED,
  D: FileStatus.DELETED,
  R: FileStatus.RENAMED,
};

const STATUS_COLORS: Record<FileStatus, ChalkInstance> = {
  [FileStatus.CREATED]: chalk.green,
  [FileStatus.MODIFIED]: chalk.yellow,
  [FileStatus.DELETED]: chalk.red,
  [FileStatus.RENAMED]: chalk.cyan,
};

const STATUS_ORDER: FileStatus[] = [
  FileStatus.CREATED,
  FileStatus.MODIFIED,
  FileStatus.DELETED,
  FileStatus.RENAMED,
];

export async function execute(message?: string): Promise<void> {
  const addResult = await execa('git', ['add', '.'], { reject: false });
  processCommand(addResult, false);

  const statusResult = await execa('git', ['status', '--porcelain'], { reject: false });
  processCommand(statusResult, false);

  // Get current status and return early if there are no changes
  const currentStatus = statusResult.stdout;
  if (currentStatus === '') {
    console.log(chalk.cyan('No changes to publish in this branch.'));
    return;
  }

  // Parse current status and then group all files by status
  const parsedStatus = parseGitStatus(currentStatus);
  const grouped: Partial<Record<FileStatus, string[]>> = {};
  for (const { fileName, fileStatus } of parsedStatus) {
    if (!grouped[fileStatus]) {
      grouped[fileStatus] = [];
    }

    grouped[fileStatus].push(fileName);
  }

  // Print by group and color-code
  for (const status of STATUS_ORDER) {
    const fileNames = grouped[status];
    if (!fileNames) continue;

    const color = STATUS_COLORS[status];
    console.log(color(`\n${status}:`));

    for (const fileName of fileNames) {
      console.log(color(`  ${fileName}`));
    }
  }

  // Prompt user for confirmation
  nl();
  const confirm = await genericConfirmPrompt();
  if (!confirm) return;

  // Prompt user for the commit message if they didn't provide one
  let commitMessage = message;
  if (!commitMessage) {
    nl();
    commitMessage = await safePrompt(() =>
      input({
        message: chalk.cyan('Enter a commit message (Ctrl + C to cancel)\n'),
        required: true,
        theme: {
          style: {
            answer: (text: string) => chalk.magenta(text),
          },
        },
      })
    );
  }

  // Publish
  nl();
  await publish(commitMessage);
  console.log(chalk.green('Successfully published changes'));
}

async function publish(commitMessage: string) {
  const addResult = await execa('git', ['add', '.'], { reject: false });
  processCommand(addResult, false);

  const commitResult = await execa('git', ['commit', '-m', commitMessage], { reject: false });
  processCommand(commitResult, false);

  const pushResult = await execa('git', ['push'], { reject: false });
  processCommand(pushResult);
}

function parseGitStatus(status: string): ParseGitStatusResult {
  const result: ParseGitStatusResult = [];
  const lines = status.split('\n').filter(Boolean);
  for (const line of lines) {
    const statusCode = line[0];
    const fileName = line.slice(1).trim();

    if (!isValidStatusCode(statusCode)) {
      if (statusCode === 'U') {
        console.log(chalk.yellow('Merge conflict(s) detected. Please resolve before publishing.'));
        process.exit(EXIT.SUCCESS);
      }

      console.log(chalk.red('Error: Failed to publish. Unable to parse status.'));
      process.exit(EXIT.FAILURE);
    }

    const fileStatus = STATUS_MAPPING[statusCode];
    result.push({ fileName, fileStatus });
  }

  return result;
}

function isValidStatusCode(key: string): key is keyof typeof STATUS_MAPPING {
  return key in STATUS_MAPPING;
}
