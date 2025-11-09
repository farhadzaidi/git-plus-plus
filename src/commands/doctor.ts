import fs from 'fs';
import { execa } from 'execa';
import chalk from 'chalk';
import { GPP, EXIT, GIT_COMMANDS, GITCONFIG_ALIASES, COMMANDS } from '@/shared/constants';
import { getGitConfigPath, readGitConfig } from '@/shared/helpers';

export async function execute(): Promise<void> {
  console.log(chalk.cyan.bold('\nRunning Git++ health checks...\n'));

  const issues: string[] = [];

  // 1. Check if git exists
  const gitCheck = await checkGitInstalled();
  if (!gitCheck) {
    issues.push('Git is not installed or not in PATH');
  }

  // 2. Check if gpp is in PATH (needed for git aliases to work)
  const gppPathCheck = await checkGppInPath();
  if (!gppPathCheck) {
    issues.push('gpp is not in PATH');
  }

  // 3. Check gitconfig aliases
  const aliasCheck = await checkGitConfigAliases();
  if (!aliasCheck) {
    issues.push(
      `Git aliases are missing or incorrect. Run '${chalk.cyan(`${GPP} ${COMMANDS.REBUILD}`)}' to fix`
    );
  }

  // Summary
  console.log();
  if (issues.length === 0) {
    console.log(chalk.green.bold('✓ All checks passed! Git++ is healthy.'));
  } else {
    console.log(chalk.yellow.bold('⚠ Issues found:\n'));
    for (const issue of issues) {
      console.log(chalk.yellow(`  • ${issue}`));
    }
  }
  console.log();
}

async function checkGitInstalled(): Promise<boolean> {
  process.stdout.write(chalk.dim('Checking if git is installed... '));

  try {
    const result = await execa('git', ['--version'], { reject: false });
    if (result.exitCode === EXIT.SUCCESS) {
      console.log(chalk.green('✓'));
      return true;
    }
  } catch (error) {
    // Git not found
  }

  console.log(chalk.red('✗'));
  return false;
}

async function checkGppInPath(): Promise<boolean> {
  process.stdout.write(chalk.dim('Checking if gpp is in PATH... '));

  try {
    const result = await execa('gpp', ['--help'], { reject: false });
    if (result.exitCode === EXIT.SUCCESS) {
      console.log(chalk.green('✓'));
      return true;
    }
  } catch (error) {
    // gpp not in PATH
  }

  console.log(chalk.red('✗'));
  return false;
}

async function checkGitConfigAliases(): Promise<boolean> {
  process.stdout.write(chalk.dim('Checking git config aliases... '));

  const gitConfigPath = getGitConfigPath();

  if (!fs.existsSync(gitConfigPath)) {
    console.log(chalk.yellow('⚠ (no .gitconfig found)'));
    return false;
  }

  try {
    const config = readGitConfig();
    const aliases = config.alias || {};

    let allCorrect = true;
    const missingOrIncorrect: string[] = [];

    for (const cmd of GIT_COMMANDS) {
      const expectedAlias = GITCONFIG_ALIASES[cmd];
      if (aliases[cmd] !== expectedAlias) {
        allCorrect = false;
        missingOrIncorrect.push(cmd);
      }
    }

    if (allCorrect) {
      console.log(chalk.green('✓'));
      return true;
    } else {
      console.log(chalk.yellow(`⚠ (${missingOrIncorrect.length} alias(es) missing or incorrect)`));
      return false;
    }
  } catch (error) {
    console.log(chalk.red('✗'));
    return false;
  }
}
