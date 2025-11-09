import chalk from 'chalk';
import { execa } from 'execa';
import { processCommand } from '@/shared/helpers';

export async function execute(): Promise<void> {
  const resetResult = await execa('git', ['reset', '--soft', 'HEAD~1'], { reject: false });
  processCommand(resetResult);

  console.log(chalk.green(`Successfully rolled back latest commit (changes saved)`));
}
