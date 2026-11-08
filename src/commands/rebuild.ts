import { execa } from 'execa';
import chalk from 'chalk';
import { GPP, GITCONFIG_ALIASES } from '@/shared/constants';
import { processCommand } from '@/shared/helpers';

const ALIAS_PREFIX = 'alias.';

// Uses `git config` rather than rewriting .gitconfig, which drops keys the parser can't round-trip
export async function execute(): Promise<void> {
  await removeStaleAliases();

  for (const [command, alias] of Object.entries(GITCONFIG_ALIASES)) {
    const result = await execa('git', ['config', '--global', `${ALIAS_PREFIX}${command}`, alias], {
      reject: false,
    });
    processCommand(result, false);
  }

  console.log(chalk.green('Successfully installed Git++ aliases'));
}

/**
 * Removes Git++ aliases for commands that are no longer supported
 */
async function removeStaleAliases(): Promise<void> {
  const { stdout } = await execa('git', ['config', '--global', '--get-regexp', '^alias\\.'], {
    reject: false,
  });

  for (const line of stdout.split('\n').filter(Boolean)) {
    const separatorIndex = line.indexOf(' ');
    const key = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1);
    const command = key.slice(ALIAS_PREFIX.length);

    if (value.includes(GPP) && !(command in GITCONFIG_ALIASES)) {
      const result = await execa('git', ['config', '--global', '--unset-all', key], {
        reject: false,
      });
      processCommand(result, false);
    }
  }
}
