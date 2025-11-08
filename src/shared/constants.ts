export const GPP = 'gpp';

export const COMMANDS = {
	REBUILD: 'rebuild',
	GOTO: 'goto',
	START: 'start', // replace checkout -b
	PUBLISH: 'publish', // replace git add . && git commit -m "message" && git push
	DELETE: 'delete', // remove a branch - enable interactivity
	RENAME: 'rename', // rename a branch - enable interactivity
	BACK: 'back', // go back to previous commit safely
	FORWARD: 'forward', // move to next commit
	// be able to interactively select commits?
	// check out files from other branches easier
	// auto set upstream?
	// simpler remote vs local differentiation
	// Interaticely stage and unstage files
	// wipe - show a dry run and ask to confirm
	// unstaged - interactively choose or specify
	// staged - interactively choose or specify
	// all - git reset --hard
};

export const COMMAND_ALIASES = {};

export const GITCONFIG_ALIASES = {
	[COMMANDS.GOTO]: `!${GPP} ${COMMANDS.GOTO}`,
};

export const EXIT = {
	SUCCESS: 0,
	FAILURE: 1,
};
