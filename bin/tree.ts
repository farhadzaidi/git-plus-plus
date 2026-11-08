import { Command } from 'commander';

import { COMMANDS } from '@/shared/constants';
import { tree } from '@/commands';

export function registerTreeCommands(program: Command): void {
  const treeCommand = program.command(COMMANDS.TREE._NAME).description('Manage git worktrees.');

  treeCommand
    .command(COMMANDS.TREE.CREATE)
    .argument('[name]', 'Worktree name (prompts if not provided)')
    .argument('[branch]', 'Branch name (defaults to worktree name)')
    .description('Creates a new worktree as a sibling directory.')
    .action((name?: string, branch?: string) => {
      tree.create(name, branch);
    });

  treeCommand
    .command(COMMANDS.TREE.LIST)
    .description('Lists all worktrees.')
    .action(() => {
      tree.list();
    });

  treeCommand
    .command(COMMANDS.TREE.GOTO)
    .argument('[name]', 'Worktree name (opens interactive selector if not provided)')
    .description('Opens a shell in the specified worktree.')
    .action((name?: string) => {
      tree.goto(name);
    });

  treeCommand
    .command(COMMANDS.TREE.DELETE)
    .argument('[names...]', 'Worktree names to delete (opens interactive selector if not provided)')
    .description('Removes one or more worktrees and their branches.')
    .action((names: string[]) => {
      tree.delete(names);
    });

  treeCommand
    .command(COMMANDS.TREE.DETACH)
    .description('Detaches the current worktree from its branch.')
    .action(() => {
      tree.detach();
    });
}
