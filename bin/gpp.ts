#!/usr/bin/env node

import { Command } from 'commander';

import { GPP, COMMANDS } from '@/shared/constants';
import { rebuild, goto, create, publish, delete as deleteBranches, rename } from '@/commands';

const program = new Command();

program.name(GPP).description('Git++ - TBD');

program
  .command(COMMANDS.REBUILD)
  .description('Add Git++ command aliases to .gitconfig')
  .action(rebuild);

program
  .command(COMMANDS.GOTO)
  .argument('[branch]', 'Branch to switch to')
  .description(
    'Switches to the provided branch if provided. Otherwise, opens up the interactive branch selector.'
  )
  .action((branch?: string) => {
    goto(branch);
  });

program
  .command(COMMANDS.CREATE)
  .argument('[branch]', 'Name of newly created branch')
  .description('Creates a new branch from the current one using the specified name.')
  .action((branch?: string) => {
    create(branch);
  });

program
  .command(COMMANDS.PUBLISH)
  .argument('[message]', 'Commit message')
  .description(
    'Stages all changes in the current directory, commits them to the current branch, and pushes to the remote branch.'
  )
  .action((message?: string) => {
    publish(message);
  });

program
  .command(COMMANDS.DELETE)
  .argument('[branches...]', 'Branches to delete')
  .description(
    'Deletes the provided branches. Otherwise, opens up the interactive branch selector.'
  )
  .action((branches: string[]) => {
    deleteBranches(branches);
  });

program
  .command(COMMANDS.RENAME)
  .description('Opens up interactive selector to pick a branch to rename.')
  .action(() => {
    rename();
  });

program.parse();
