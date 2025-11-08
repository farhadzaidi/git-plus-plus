import { EXIT } from '@/shared/constants';

export function processCommand({
	stdout,
	stderr,
	exitCode,
}: {
	stdout?: string;
	stderr?: string;
	exitCode?: number;
}) {
	if (stdout) console.log(stdout);
	if (stderr) console.log(stderr);
	process.exit(exitCode ?? EXIT.SUCCESS);
}
