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
  DELETE: 'delete', // remove one or more branches - use multiselect and confirm
  RENAME: 'rename', // rename a branch - use select, input, and confirm
  TRACK: 'track', // auto set upstream (git push -u origin HEAD)
  UNCOMMIT: 'uncommit', // safe uncommit (git reset --soft HEAD~1)
  PICK: 'pick', // choose from unstage (including untracked) files to stage - multiselect and confirm
  DROP: 'drop', // choose from staged files to unstage - multiselect and confirm

  // wipe - show a dry run and ask to confirm
  // --unstaged - interactively choose or specify (clean -fd)
  // --staged - interactively choose or specify (restore)
  // --all - git reset --hard

  // go back to previous commit safely ?
  // move to next commit ?
  // be able to interactively select commits?
  // check out files from other branches easier? (interactively?)
  // simpler remote vs local differentiation (?)
};

export const GITCONFIG_ALIASES = {
  [COMMANDS.GOTO]: `!${GPP} ${COMMANDS.GOTO}`,
};

export const EXIT = {
  SUCCESS: 0,
  FAILURE: 1,
};
