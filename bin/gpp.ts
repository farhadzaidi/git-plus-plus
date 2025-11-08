#!/usr/bin/env node

import { Command } from 'commander';

import { GPP, COMMANDS } from '@/shared/constants';
import { rebuild, goto } from '@/commands';

const program = new Command();

program.name(GPP).description('Git++ - TBD');

program
	.command(COMMANDS.REBUILD)
	.description('Add Git++ command aliases to .gitconfig')
	.action(rebuild);

program
	.command(`${COMMANDS.GOTO} [branch]`)
	.description(
		'Switches to the provided branch if provided. Otherwise, opens up the interactive branch selector.'
	)
	.action((branch) => {
		goto(branch);
	});

program.parse();
