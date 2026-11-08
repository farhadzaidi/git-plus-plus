import fs from 'fs';
import path from 'path';
import os from 'os';
import { execa, type ResultPromise } from 'execa';
import chalk from 'chalk';
import { EXIT, Worktree } from '@/shared/constants';
import {
  getAllWorktrees,
  ensureWorktreesExist,
  findWorktree,
  promptForWorktree,
} from '@/shared/helpers';

const GPP_TREE_PID = 'GPP_TREE_PID';
const GPP_GOTO_FILE = 'GPP_GOTO_FILE';
const GOTO_FILE_PREFIX = 'gpp-goto-';
const DEFAULT_SHELL = 'bash';
const SWITCH_SIGNAL = 'SIGUSR1';
// Interactive shells ignore SIGTERM, but exit cleanly on SIGHUP and hand the terminal back
const SHELL_EXIT_SIGNAL = 'SIGHUP';

export async function execute(name?: string): Promise<void> {
  const target = await resolveTarget(name);

  if (signalController(target.path)) return;

  await runController(target.path);
}

/**
 * When running inside a shell spawned by goto, hands the target to that controller
 * @returns True if a live controller was signalled
 */
function signalController(targetPath: string): boolean {
  const controllerPid = Number(process.env[GPP_TREE_PID]);
  const gotoFile = process.env[GPP_GOTO_FILE];

  // The goto file only exists while its controller is running, so a stale
  // environment (e.g. inherited by a later process) never signals a reused PID
  if (!controllerPid || !gotoFile || !fs.existsSync(gotoFile)) return false;

  fs.writeFileSync(gotoFile, targetPath);
  try {
    process.kill(controllerPid, SWITCH_SIGNAL);
    return true;
  } catch {
    return false;
  }
}

/**
 * Spawns a shell in the target worktree, respawning it in a new worktree whenever a
 * nested goto signals a switch, until the user exits the shell
 */
async function runController(targetPath: string): Promise<void> {
  const gotoFile = path.join(os.tmpdir(), `${GOTO_FILE_PREFIX}${process.pid}`);
  const shell = process.env.SHELL || DEFAULT_SHELL;
  let currentPath = targetPath;
  let childProcess: ResultPromise | null = null;

  process.on(SWITCH_SIGNAL, () => {
    childProcess?.kill(SHELL_EXIT_SIGNAL);
  });

  fs.writeFileSync(gotoFile, '');

  try {
    while (true) {
      console.log(
        chalk.green(`Entered worktree ${chalk.magenta.bold(path.basename(currentPath))}`) +
          chalk.dim(' (type exit to leave)')
      );
      childProcess = execa(shell, [], {
        cwd: currentPath,
        stdio: 'inherit',
        env: {
          ...process.env,
          [GPP_TREE_PID]: String(process.pid),
          [GPP_GOTO_FILE]: gotoFile,
        },
        reject: false,
      });

      await childProcess;
      childProcess = null;

      const nextPath = fs.readFileSync(gotoFile, 'utf-8').trim();
      if (!nextPath) break;

      currentPath = nextPath;
      fs.writeFileSync(gotoFile, '');
    }
  } finally {
    fs.rmSync(gotoFile, { force: true });
  }
}

async function resolveTarget(name?: string): Promise<Worktree> {
  const worktrees = await getAllWorktrees();
  ensureWorktreesExist(worktrees);

  let targetWorktree: Worktree | undefined;

  if (name) {
    targetWorktree = findWorktree(worktrees, name);

    if (!targetWorktree) {
      console.log(chalk.red(`No worktree found matching "${name}"`));
      process.exit(EXIT.FAILURE);
    }
  } else {
    targetWorktree = await promptForWorktree(worktrees);
  }

  if (targetWorktree.isCurrent) {
    console.log(chalk.yellow('Already in this worktree'));
    process.exit(EXIT.SUCCESS);
  }

  return targetWorktree;
}
