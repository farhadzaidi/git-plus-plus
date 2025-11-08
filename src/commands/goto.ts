import { EXIT } from '@/shared/constants';
import { execa } from 'execa';
import enquirer from 'enquirer';
import chalk from 'chalk';

export async function execute(branch: string | undefined): Promise<void> {
	// If the branch is provided, switch to it (delegate to git)
	if (branch) {
		const { stdout, stderr, exitCode } = await execa('git', ['switch', branch], { reject: false });
		if (stdout) console.log(stdout);
		if (stderr) console.log(stderr);
		process.exit(exitCode ?? EXIT.SUCCESS);
	}

	getAllBranches();
}

async function getAllBranches() {
	let output: string;

	try {
		const { stdout } = await execa('git', ['branch']);
		output = stdout;
	} catch (error) {
		console.log(chalk.red('Error: Failed to retrieve branches.'));
		process.exit(EXIT.FAILURE);
	}

	console.log(output);
}
