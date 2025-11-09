import fs from 'fs';
import path from 'path';
import os from 'os';
import ini from 'ini';
import chalk from 'chalk';

import { GPP, GITCONFIG_ALIASES } from '@/shared/constants';

type IniConfig = { [key: string]: any };

export async function execute(): Promise<void> {
  // Retrieve path to .gitconfig file (ini format)
  const gitConfigPath = path.join(os.homedir(), '.gitconfig');

  // Read the existing config from the .gitconfig file if it exists
  let existingConfig: IniConfig = {};
  if (fs.existsSync(gitConfigPath)) {
    existingConfig = ini.parse(fs.readFileSync(gitConfigPath, 'utf-8'));
  }

  const newConfig = generateNewConfig(existingConfig);
  fs.writeFileSync(gitConfigPath, ini.stringify(newConfig));

  console.log(chalk.green('Successfully installed Git++ aliases'));
}

function generateNewConfig(existingConfig: IniConfig): IniConfig {
  // Loop through existing aliases and remove any previous gpp commands
  // This ensures that commands that are no longer supported are removed
  const filteredAliases = Object.fromEntries(
    Object.entries(existingConfig.alias).filter(([_, command]) => {
      return typeof command === 'string' && !command.includes(GPP);
    })
  );

  // Create new config object with updated alias field
  return { ...existingConfig, alias: { ...filteredAliases, ...GITCONFIG_ALIASES } };
}
