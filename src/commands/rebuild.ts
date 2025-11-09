import chalk from 'chalk';
import { GPP, GITCONFIG_ALIASES, IniConfig } from '@/shared/constants';
import { readGitConfig, writeGitConfig } from '@/shared/helpers';

export async function execute(): Promise<void> {
  const existingConfig = readGitConfig();
  const newConfig = generateNewConfig(existingConfig);
  writeGitConfig(newConfig);

  console.log(chalk.green('Successfully installed Git++ aliases'));
}

function generateNewConfig(existingConfig: IniConfig): IniConfig {
  // Loop through existing aliases and remove any previous Git++ commands
  // This ensures that commands that are no longer supported are removed
  const existingAliases = existingConfig.alias || {};
  const filteredAliases = Object.fromEntries(
    Object.entries(existingAliases).filter(([_, command]) => {
      return typeof command === 'string' && !command.includes(GPP);
    })
  );

  // Create new config object with updated alias field
  return { ...existingConfig, alias: { ...filteredAliases, ...GITCONFIG_ALIASES } };
}
