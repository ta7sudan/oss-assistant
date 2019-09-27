import { getCmds, getOSSConfiguration } from '../lib/utils';
import { Argv, Arguments, CommandModule } from 'yargs';
import startUpload, { UploadCommandOptions, FileTypes } from '../lib/start-upload';

interface UploadArgv {
	c?: string;
	d?: string;
	r?: number;
	l?: number;
	T?: number;
	P?: string;
	R?: string;
	t?: Array<FileTypes | number>;
	p?: Array<string | number>;
	f?: Array<string | number>;
}

interface UploadAlias {
	config?: string;
	dir?: string;
	retry?: number;
	limit?: number;
	timeout?: number;
	remotePath?: string;
	provider?: string;
	types?: Array<FileTypes>;
	patterns?: Array<string>;
	files?: Array<string>;
}

const upload: CommandModule<UploadArgv & UploadAlias, UploadArgv & UploadAlias> = {
	command: 'upload [options]',
	describe: 'upload files',
	builder(yargs: Argv<UploadArgv & UploadAlias>): Argv<UploadArgv & UploadAlias> {
		return yargs
			.option('c', {
				alias: 'config',
				describe: 'specify configuration file, default is .oasrc.js, .oasrc.json, .oasrc.yml, .oasrc.yaml',
				string: true
			})
			.option('d', {
				alias: 'dir',
				describe: 'specify a directory, files matched -t or -p will be uploaded, default is CWD',
				string: true,
				coerce(val: string): string {
					return val === '' ? process.cwd() : val;
				}
			})
			.option('l', {
				alias: 'limit',
				describe: 'rate limit, default is 10 files',
				number: true,
				default: 10
			})
			.option('r', {
				alias: 'retry',
				describe: 'specify retry count when upload failed, default is -1 means infinite',
				number: true,
				default: -1
			})
			.option('T', {
				alias: 'timeout',
				describe: 'specify timeout for each upload task, default is 0 means infinite',
				number: true,
				default: 0
			})
			.option<string, any>('t', {
				alias: 'types',
				describe: 'matched file types, can be "img", "js", "css", "font", default is "" means any types',
				array: true
			})
			.option('p', {
				alias: 'patterns',
				describe: 'specify a glob patterns, using fast-glob, priority is higher than -t',
				array: true
			})
			.option('f', {
				alias: 'files',
				describe: 'specify files to upload, will ignore -t or -p or <dir>',
				array: true
			})
			.option('P', {
				alias: 'provider',
				describe: 'specify a service provider, such as "aws", "ali", "tencent"',
				string: true
			})
			.option('R', {
				alias: 'remotePath',
				describe: 'specify target path in oss, default is /',
				string: true,
				coerce(val: string): string {
					return val === '' ? '/' : val;
				}
			})
			.example(
				`${getCmds()[0]} upload -c .oasrc.js -P ali -t img js css -d ./ -R /`,
				'upload img, js, css files in directory ./ with oss options in .oasrc.js to /'
			)
			.example(
				`${getCmds()[0]} upload -P ali -p *.js -d ./ -R /`,
				'upload all js files in directory ./ with default .oasrc file to /'
			)
			.example(
				`${getCmds()[0]} upload -P ali -f demo0.js demo1.js -R /`,
				'upload demo0.js and demo1.js with default .oasrc file to /'
			);
			// .check(({ c }: Arguments<UploadArgv>, { config }: UploadAlias): boolean => {
			// 	console.log(c);
			// 	console.log(config);
			// 	return true
			// });
	},
	async handler(argv: Arguments<UploadAlias & UploadArgv>): Promise<void> {
		const { config, dir, retry, limit, timeout, types, patterns, provider, remotePath, files } = argv;

		const options = await getOSSConfiguration(config, argv);

		const commandOptions: UploadCommandOptions = {
			dir: dir || options.dir,
			retry: retry && retry > 0 ? retry : options.retry,
			limit: limit || options.limit,
			timeout: timeout || options.timeout,
			remotePath: remotePath || options.remotePath,
			types: types || options.types,
			patterns: patterns || options.patterns,
			files: files || options.files,
			// 应该在参数进入startUpload之前就确保它的类型而不是在里面再去校验
			// 这里应该给个自定义类型保护
			provider: provider || options.provider
		};

		await startUpload(commandOptions, options.ossOptions);
	}
};

// 这里必须用node的方式导出
module.exports = upload;
