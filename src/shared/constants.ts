export const GPP = 'gpp';

export const COMMANDS = {
	REBUILD: 'rebuild',
	GOTO: 'goto',
};

export const COMMAND_ALIASES = {};

export const GITCONFIG_ALIASES = {
	[COMMANDS.GOTO]: `!${GPP} ${COMMANDS.GOTO}`,
};

export const EXIT = {
	SUCCESS: 0,
	FAILURE: 1,
};
