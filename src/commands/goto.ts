import { EXIT } from '@/shared/constants';
import { execa } from 'execa';
import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import { processCommand } from '@/shared/helpers';

export async function execute(branch: string | undefined): Promise<void> {
	// If the branch is provided, switch to it (delegate to git)
	if (branch) {
		const result = await execa('git', ['switch', branch], { reject: false });
		processCommand(result);
	}

	// If the branch isn't provided, get all branches and prompt user to select one
	const branches = await getAllBranches();
	const answer = await select({
		message: chalk.cyan('Select a branch: '),
		choices: branches.map((b) => ({
			name: b.isCurrent
				? `${chalk.green('●')} ${b.name} ${chalk.dim.italic('(current)')}`
				: `  ${b.name}`,
			value: b.name,
		})),
		default: branches.find((b) => b.isCurrent)?.name,
		theme: {
			prefix: {
				idle: chalk.cyan('❯'),
				done: chalk.green('✓'),
			},
			style: {
				highlight: (text: string) => chalk.magenta.bold(text),
				answer: (text: string) => chalk.green(text),
			},
		},
	});

	// Switch to the selected branch
	const result = await execa('git', ['switch', answer], { reject: false });
	processCommand(result);
}

async function getAllBranches() {
	try {
		// List all branches via stdout
		const { stdout } = await execa('git', ['--no-pager', 'branch']);

		// Parse and return output
		return stdout.split('\n').map((line) => {
			line = line.trim();
			return {
				name: line.replace(/^\*\s*/, ''),
				isCurrent: line.startsWith('*'),
			};
		});
	} catch (error) {
		console.log(chalk.red('Error: Failed to retrieve branches.'));
		process.exit(EXIT.FAILURE);
	}
}
