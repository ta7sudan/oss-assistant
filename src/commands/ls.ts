import { getCmds, getOSSConfiguration } from '../lib/utils';
import { Argv, Arguments, CommandModule } from 'yargs';
import { list, ListCommandOptions } from '../lib/list';

interface ListArgv {
	l?: boolean;
	c?: string;
	R?: boolean;
	P?: string;
}

interface ListAlias {
	longFormat?: boolean;
	config?: string;
	recursive?: boolean;
	provider?: string;
}

const ls: CommandModule<ListArgv & ListAlias, ListArgv & ListAlias> = {
	command: 'ls [options] <remotePath>',
	describe: 'list remote files or directories',
	builder(yargs: Argv<ListArgv & ListAlias>): Argv<ListArgv & ListAlias> {
		return yargs
			.option('c', {
				alias: 'config',
				describe: 'specify configuration file, default is .pockrc.js, .pockrc.json, .pockrc.yml, .pockrc.yaml',
				string: true
			})
			.option('l', {
				alias: 'longFormat',
				describe: 'use a long listing format, default is false',
				boolean: true,
				default: false
			})
			.option('R', {
				alias: 'recursive',
				describe: 'list subdirectories recursively',
				boolean: true,
				default: false
			})
			.option('P', {
				alias: 'provider',
				describe: 'specify a service provider, such as "aws", "ali", "tencent"',
				string: true
			})
			.example(
				`${getCmds()[0]} ls -P ali /`,
				'list root directory recursively'
			)
			.example(
				`${getCmds()[0]} ls -P ali -l test.js`,
				'list the detail of test.js'
			);
			// .check(({ c }: Arguments<UploadArgv>, { config }: UploadAlias): boolean => {
			// 	console.log(c);
			// 	console.log(config);
			// 	return true
			// });
	},
	async handler(argv: Arguments<ListAlias & ListArgv>): Promise<void> {
		const { config, longFormat, provider, recursive } = argv;
		const remotePath = argv.remotePath + '';
		const options = await getOSSConfiguration(config, argv);

		const commandOptions: ListCommandOptions = {
			longFormat: longFormat || options.longFormat,
			provider: provider || options.provider,
			recursive: recursive || options.recursive,
			remotePath: remotePath || options.remotePath || '/'
		};

		await list(commandOptions, options.ossOptions);
	}
};

// 这里必须用node的方式导出
module.exports = ls;
