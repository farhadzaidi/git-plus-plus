/**
 * Post-install script that automatically sets up Git aliases
 *
 * This runs after npm install and calls `gpp rebuild` to add Git++ aliases
 * to the user's .gitconfig file. It only runs on global installs to avoid
 * interfering with local development environments.
 */

import { execSync } from 'child_process';

if (process.env.npm_config_global === 'true') {
  execSync('node ./dist/gpp.js rebuild', { stdio: 'inherit' });
}
