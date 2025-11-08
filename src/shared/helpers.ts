import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import { EXIT } from '@/shared/constants';

export async function safePrompt<T>(promptFn: () => Promise<T>): Promise<T | null> {
	try {
		return await promptFn();
	} catch (error: any) {
		if (error?.name === "ExitPromptError") {
			console.log(chalk.red('Operation cancelled'));
			process.exit(EXIT.SUCCESS);
		}
		throw error;
	}
}

export async function genericConfirmPrompt(): Promise<boolean | null> {
	return safePrompt(() => confirm({
		message: 'Confirm?',
		default: false,
		theme: {
			style: {
				answer: (text: string) => text == 'Yes' ? chalk.green(text) : chalk.red(text)
			}
		}
	}));
}

export function processCommand({
	stdout,
	stderr,
	exitCode,
}: {
	stdout?: string;
	stderr?: string;
	exitCode?: number;
}) {
	if (stdout) console.log(stdout.trim());
	if (stderr) console.log(stderr.trim());

	// Terminate process on failed commands
	if (exitCode && exitCode !== EXIT.SUCCESS) {
		process.exit(exitCode);
	}
}

export function nl(count = 1) {
	// console.log always appends a new line so we add count - 1 new lines
	console.log('\n'.repeat(count - 1));
}