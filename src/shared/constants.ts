import chalk, { ChalkInstance } from 'chalk';

// =============================================================================
// APPLICATION CONSTANTS
// =============================================================================

export type IniConfig = { [key: string]: any };

export const GPP = 'gpp';

export const EXIT = {
  SUCCESS: 0,
  FAILURE: 1,
};

export const COMMANDS = {
  DOCTOR: 'doctor',
  REBUILD: 'rebuild',
  GOTO: 'goto',
  CREATE: 'create',
  PUBLISH: 'publish',
  DELETE: 'delete',
  RENAME: 'rename',
  TRACK: 'track',
  UNCOMMIT: 'uncommit',
  PICK: 'pick',
  DROP: 'drop',
  WIPE: 'wipe',
};

// Git operation commands (non-administrative)
export const GIT_COMMANDS = [
  COMMANDS.GOTO,
  COMMANDS.CREATE,
  COMMANDS.PUBLISH,
  COMMANDS.DELETE,
  COMMANDS.RENAME,
  COMMANDS.TRACK,
  COMMANDS.UNCOMMIT,
  COMMANDS.PICK,
  COMMANDS.DROP,
  COMMANDS.WIPE,
];

export const GITCONFIG_ALIASES = Object.fromEntries(
  GIT_COMMANDS.map((cmd) => [cmd, `!${GPP} ${cmd}`])
);

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
