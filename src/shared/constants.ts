export const GPP = 'gpp';

export const COMMANDS = {
	REBUILD: 'rebuild',
	GOTO: 'goto',
	CREATE: 'create', // replace checkout -b
	PUBLISH: 'publish', // replace git add . && git commit -m "message" && git push
	DELETE: 'delete', // remove a branch - enable interactivity
	RENAME: 'rename', // rename a branch - enable interactivity
	// auto set upstream? (git push -u origin HEAD)
	// uncommit? (git reset --soft HEAD~1)
	// Interaticely stage and unstage files
	// - choose from untracked files to stage certain ones
	// - choose from tracked files to unstage certain ones
	// BACK: 'back', // go back to previous commit safely ?
	// FORWARD: 'forward', // move to next commit ?
	// be able to interactively select commits?
	// check out files from other branches easier? (interactively?)
	// simpler remote vs local differentiation (?)
	// wipe - show a dry run and ask to confirm
	// - unstaged - interactively choose or specify
	// - staged - interactively choose or specify
	// - all - git reset --hard
};

export const GITCONFIG_ALIASES = {
	[COMMANDS.GOTO]: `!${GPP} ${COMMANDS.GOTO}`,
};

export const EXIT = {
	SUCCESS: 0,
	FAILURE: 1,
};
