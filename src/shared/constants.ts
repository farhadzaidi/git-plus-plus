import chalk, { ChalkInstance } from 'chalk';

// =============================================================================
// APPLICATION CONSTANTS
// =============================================================================

export const GPP = 'gpp';

export const EXIT = {
  SUCCESS: 0,
  FAILURE: 1,
};

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

// =============================================================================
// GIT CHANGE TYPES
// =============================================================================

export enum ChangeStatus {
  CREATED = 'created',
  MODIFIED = 'modified',
  DELETED = 'deleted',
  RENAMED = 'renamed',
}

export const CHANGE_POSITION = {
  STAGED: 'staged' as const,
  UNSTAGED: 'unstaged' as const,
};

export type ChangePosition = (typeof CHANGE_POSITION)[keyof typeof CHANGE_POSITION];

export type ParsedChanges = {
  fileName: string;
  changeStatus: ChangeStatus;
}[];

export const CHANGE_STATUS_MAPPING: Record<string, ChangeStatus> = {
  '?': ChangeStatus.CREATED,
  A: ChangeStatus.CREATED,
  M: ChangeStatus.MODIFIED,
  D: ChangeStatus.DELETED,
  R: ChangeStatus.RENAMED,
};

export const CHANGE_STATUS_COLORS: Record<ChangeStatus, ChalkInstance> = {
  [ChangeStatus.CREATED]: chalk.green,
  [ChangeStatus.MODIFIED]: chalk.yellow,
  [ChangeStatus.DELETED]: chalk.red,
  [ChangeStatus.RENAMED]: chalk.cyan,
};

export const CHANGE_STATUS_ORDER: ChangeStatus[] = [
  ChangeStatus.CREATED,
  ChangeStatus.MODIFIED,
  ChangeStatus.DELETED,
  ChangeStatus.RENAMED,
];
