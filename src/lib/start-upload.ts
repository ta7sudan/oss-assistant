import { logger, isOSSProvider } from './utils';
import { pathExists } from 'fs-extra';
import { resolve, relative } from 'path';
import fg from 'fast-glob';
import { UploadTask } from './upload-task';
import { OSSProvider } from './adaptors/oss-client';


export type FileTypes = 'img' | 'js' | 'css' | 'font';

// TODO 适配其他OSS

type FileTypesMap = {
	[k in FileTypes]: string;
};


const fileTypesPatternMap: FileTypesMap = {
	img: '**/*.{png,jpg,svg,webp,ico}',
	css: '**/*.css',
	js: '**/*.js',
	font: '**/*.{eot,ttf,woff,woff2,svg}'
};


const fileTypesList: Array<FileTypes> = ['img', 'js', 'css', 'font'];



export interface UploadCommandOptions {
	dir?: string;
	retry?: number;
	limit?: number;
	timeout?: number;
	remotePath?: string;
	types?: Array<FileTypes | undefined>;
	patterns?: Array<string>;
	files?: Array<string>;
	provider?: OSSProvider;
}

/**
 *
 * 指定了files的优先级最高, 忽略其他选项
 * 其次是patterns, 忽略types, 配合dir
 * 最后是types, 配合dir
 * 尽管有默认参数, 但是输入来自命令行, dir也可能为空, 虽然在yargs层面也做了默认值
 * 这些参数中files值存在但是也可能实际文件不存在, 要校验
 * patterns匹配到文件就意味着文件存在, 极端情况下匹配到文件后到上传文件之前被其
 * 他进程删掉了, 这种直接让他crash
 * dir的值存在但是实际目录也可能不存在, 要校验
 * 以上几个选项也可能同时不存在, 要校验
 */
export default async function startUpload(
	{
		dir = process.cwd(),
		retry = -1,
		types,
		patterns,
		files,
		provider,
		remotePath = '/',
		limit = 10,
		timeout = 0
	}: UploadCommandOptions,
	ossOptions: any
): Promise<void> {
	let targetFiles: Array<string> | null = null;
	const absoluteDir = resolve(process.cwd(), dir || '');
	// TODO 这个校验理应在参数进来之前就校验, 不然这类型显得没意义
	if (!isOSSProvider(provider)) {
		logger.error(`Must specify a provider, use --provider, received ${provider}`);
		process.exit(1);
		return;
	}

	if (!dir && (!types || types.length === 0) && (!patterns || patterns.length === 0) && !files) {
		logger.error('--dir, --types, --patterns, --files must be specified at least one.');
		process.exit(1);
		// 触发类型保护
		return;
	} else if (files) {
		const $files = files.map((file: string) => resolve(process.cwd(), file));
		for (const file of $files) {
			if (!(await pathExists(file))) {
				logger.error(`${file} not found.`);
				process.exit(1);
				return;
			}
		}
		targetFiles = $files;
	} else if (patterns && patterns.length) {
		if (!dir || !(await pathExists(absoluteDir))) {
			logger.error(`--dir ${absoluteDir} not found.`);
			process.exit(1);
			return;
		}
		// TODO 考虑之后暴露glob选项提供更多控制
		// 忽略.开头文件, 忽略软链
		targetFiles = await fg(patterns, {
			cwd: absoluteDir,
			followSymbolicLinks: false,
			absolute: true,
			onlyFiles: true
		});
	} else if (types && types.length) {
		if (!dir || !(await pathExists(absoluteDir))) {
			logger.error(`--dir ${absoluteDir} not found.`);
			process.exit(1);
			return;
		}

		if (types.some((type: FileTypes | undefined) => !fileTypesList.includes(type!))) {
			logger.error(
				`--types must be one of 'img', 'js', 'css', 'font', but received ${JSON.stringify(types)}`
			);
			process.exit(1);
			return;
		}

		const $patterns = types.map((type: FileTypes | undefined) => fileTypesPatternMap[type!]);
		// TODO 考虑之后暴露glob选项提供更多控制
		targetFiles = await fg($patterns, {
			cwd: absoluteDir,
			followSymbolicLinks: false,
			absolute: true,
			onlyFiles: true
		});
	} else if (dir) {
		if (!(await pathExists(absoluteDir))) {
			logger.error(`--dir ${absoluteDir} not found.`);
			process.exit(1);
			return;
		}

		const $types = fileTypesList;
		const $patterns = $types.map((type: FileTypes | undefined) => fileTypesPatternMap[type!]);
		// TODO 考虑之后暴露glob选项提供更多控制
		targetFiles = await fg($patterns, {
			cwd: absoluteDir,
			followSymbolicLinks: false,
			absolute: true,
			onlyFiles: true
		});
	} else {
		logger.error('--dir, --types, --patterns, --files must be specified at least one.');
		process.exit(1);
		return;
	}

	if (!targetFiles || !targetFiles.length) {
		logger.error('no files matched.');
		// TODO 暂时以1退出, 考虑增加选项忽略未匹配, 也许在CI环境有这样的需求, 如果
		// 没有文件被上传也可以允许CI继续执行
		process.exit(1);
		return;
	}

	if (limit < 0 || limit > Number.MAX_SAFE_INTEGER) {
		logger.error('limit must be between 0 to Number.MAX_SAFE_INTEGER');
		process.exit(1);
	}

	const uploadTask = new UploadTask({
		retry,
		limit,
		timeout,
		provider,
		files: targetFiles.map((file: string) => ({
			file,
			relativePath: relative(absoluteDir, file).replace(/\\/g, '/')
		})),
		remotePath,
		ossOptions
	});
	await uploadTask.start();
	logger.success('All files complete.');
}
