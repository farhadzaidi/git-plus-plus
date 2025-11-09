#!/usr/bin/env node

import { Command } from 'commander';

import { GPP, COMMANDS } from '@/shared/constants';
import {
  rebuild,
  goto,
  create,
  publish,
  delete as deleteBranches,
  rename,
  track,
  uncommit,
  pick,
  drop,
} from '@/commands';

const program = new Command();

program.name(GPP).description('Git++ - TBD');

program
  .command(COMMANDS.REBUILD)
  .description('Adds Git++ command aliases to your .gitconfig file.')
  .action(rebuild);

program
  .command(COMMANDS.GOTO)
  .argument('[branch]', 'Branch name (opens interactive selector if not provided)')
  .description('Switches to the specified branch.')
  .action((branch?: string) => {
    goto(branch);
  });

program
  .command(COMMANDS.CREATE)
  .argument('[branch]', 'New branch name (prompts if not provided)')
  .description('Creates and switches to a new branch from the current branch.')
  .action((branch?: string) => {
    create(branch);
  });

program
  .command(COMMANDS.PUBLISH)
  .argument('[message]', 'Commit message (prompts if not provided)')
  .description('Stages all changes, commits with a message, and pushes to the remote branch.')
  .action((message?: string) => {
    publish(message);
  });

program
  .command(COMMANDS.DELETE)
  .argument('[branches...]', 'Branch names to delete (opens interactive selector if not provided)')
  .description('Deletes one or more local branches.')
  .action((branches: string[]) => {
    deleteBranches(branches);
  });

program
  .command(COMMANDS.RENAME)
  .description('Renames a branch using an interactive selector.')
  .action(() => {
    rename();
  });

program
  .command(COMMANDS.TRACK)
  .argument('[branch]', 'Remote branch name (defaults to current branch name)')
  .description('Sets the upstream tracking branch for the current local branch.')
  .action((branch?: string) => {
    track(branch);
  });

program
  .command(COMMANDS.UNCOMMIT)
  .description('Undoes the last commit, keeping changes staged.')
  .action(() => {
    uncommit();
  });

program
  .command(COMMANDS.PICK)
  .argument('[files...]', 'Files to stage (opens interactive selector if not provided)')
  .description('Interactively select unstaged changes to stage.')
  .action((files: string[]) => {
    pick(files);
  });

program
  .command(COMMANDS.DROP)
  .argument('[files...]', 'Files to unstage (opens interactive selector if not provided)')
  .description('Interactively select staged changes to unstage.')
  .action((files: string[]) => {
    drop(files);
  });

program.parse();
