import { execa } from 'execa';
import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import { EXIT } from '@/shared/constants';
import { genericConfirmPrompt, processCommand, safePrompt, nl } from '@/shared/helpers';

export async function execute(message?: string): Promise<void> {
  // If the commit message is provided, publish changes with it
  if (message) {
    await publishChanges(message);
    return;
  }

  // If the commit message is not provided, prompt the user to enter it
  const commitMessage = await safePrompt(() => input({
    message: chalk.cyan('Enter a commit message (Ctrl + C to cancel)\n'),
    required: true,
    theme: {
      style: {
        answer: (text: string) => chalk.magenta(text),
      }
    }
  }));

  if (commitMessage) {
    nl();
    await publishChanges(commitMessage);
  }
}

async function publishChanges(message: string): Promise<void> {
  await processCommandWithDryRun(['add', '.']);
  await processCommandWithDryRun(['commit', '-m', message]);
  await processCommandWithDryRun(['push']);
}

async function processCommandWithDryRun(args: string[]): Promise<void> {
  // The main subcommand will always be first (right after git e.g. git add .)
  const command = args[0];
  // Extract the remaining args
  const remainingArgs = args.slice(1);

  // Execute a dry run and output the results
  const dryRunResult = await execa('git', [command, '--dry-run', ...remainingArgs], { reject: false });
  processCommand(dryRunResult);
  nl();

  // Prompt user to confirm the dry run results
  const confirm = await genericConfirmPrompt();
  if (!confirm) process.exit(EXIT.SUCCESS);
  nl();

  // If the user confirms, execute the command
  if (confirm) {
    const liveRunResult = await execa('git', args, { reject: false });
    processCommand(liveRunResult);
    if (liveRunResult.stdout) nl(); // Only print newline if there was output 
  }
}