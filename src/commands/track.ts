import { getAllBranches, processCommand } from '@/shared/helpers';
import { execa } from 'execa';

export async function execute(branch?: string) {
  // Get the current branch
  const allBranches = await getAllBranches();
  const currentBranch = allBranches.find((b) => b.isCurrent)!.name;

  // Default the remote branch to the current branch if it wasn't provided
  const remoteBranch = branch ? branch : currentBranch;

  processCommand(
    await execa('git', ['config', 'branch', `${currentBranch}.remote`, 'origin'], {
      reject: false,
    })
  );

  processCommand(
    await execa(
      'git',
      ['config', 'branch', `${currentBranch}.merge`, `refs/heads/${remoteBranch}`],
      {
        reject: false,
      }
    )
  );
}
