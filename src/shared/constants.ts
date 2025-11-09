export const GPP = 'gpp';

export const COMMANDS = {
  HEALTH: 'health', // ensures gpp
  CONFIG: 'config', // show currently supported commands
  VERISON: 'version', // show version
  UPDATE: 'update', // reinstall npm package globally
  REBUILD: 'rebuild',
  GOTO: 'goto',
  CREATE: 'create',
  PUBLISH: 'publish',
  DELETE: 'delete',
  RENAME: 'rename',
  TRACK: 'track',
  UNCOMMIT: 'uncommit',
  PICK: 'pick', // choose from unstage (including untracked) files to stage - multiselect and confirm
  DROP: 'drop', // choose from staged files to unstage - multiselect and confirm

  // wipe - show a dry run and ask to confirm
  // --unstaged - interactively choose or specify (clean -fd)
  // --staged - interactively choose or specify (restore)
  // --all - git reset --hard
};

export const GITCONFIG_ALIASES = {
  [COMMANDS.GOTO]: `!${GPP} ${COMMANDS.GOTO}`,
};

export const EXIT = {
  SUCCESS: 0,
  FAILURE: 1,
};
