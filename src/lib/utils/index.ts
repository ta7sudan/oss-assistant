import figlet from 'figlet';
import { resolve, extname } from 'path';
import pkg from '../../../package.json';
import { OSSProvider } from '../adaptors/oss-client';
import cleaner from './cleaner';
import { homedir } from 'os';
import * as logger from './logger';
import { pathExistsSync, readFile } from 'fs-extra';
import { safeLoad } from 'js-yaml';

type PromiseData = [undefined, any];

type PromiseError = [any, undefined];

export const GLOBAL_CONFIG_FILES = ['.oasrc.js', '.oasrc.json', '.oasrc.yml', '.oasrc.yaml'].map(
	(name: string) => resolve(homedir(), name)
);

export type Callable = (...args: any[]) => any;

export type AsyncCallable = (...args: any[]) => Promise<any>;

export const isAsyncFunction = (fn: any): fn is AsyncCallable =>
	fn[Symbol.toStringTag] === 'AsyncFunction';

export const to = (p: Promise<any>): Promise<PromiseData | PromiseError> =>
	p
		.then((data: any): PromiseData => [undefined, data])
		.catch((err: any): PromiseError => [err, undefined]);

export const sleep = (time: number): Promise<any> =>
	new Promise<any>((rs: any): any => setTimeout(rs, time));

export const getAbsolutePath = (rel: string): string => resolve(process.cwd(), rel);

export const getCmds = (): string[] => Object.keys(pkg.bin);

export const getFiglet = (cmd: string): Promise<string> =>
	new Promise<string>((rs: any, rj: any): void => {
		figlet(
			cmd,
			{
				horizontalLayout: 'fitted'
			},
			(err: Error | null, data?: string): void => {
				if (err) {
					rj(err);
				} else {
					rs(data);
				}
			}
		);
	});

export function chunk<T = any>(array: Array<T>, groupCount: number): Array<Array<T>> {
	const $groupCount = Math.max(groupCount, 0),
		length = array == null ? 0 : array.length;

	if (!$groupCount || !length) {
		return [];
	}

	const size = Math.floor(length / $groupCount),
		result = new Array<Array<T>>($groupCount),
		len = $groupCount - 1;

	let index = 0;
	for (let i = 0; i < len; ++i) {
		result[i] = array.slice(index, (index += size));
	}
	result[len] = array.slice(index);

	return result;
}

export function isPromise<T = any>(p: any): p is Promise<T> {
	return !!(p && typeof p.then === 'function');
}

export async function pRetry<Result = any>(
	this: any,
	fn: (...args: any[]) => any,
	{
		retry,
		beforeRetry
	}: {
		retry: number;
		beforeRetry?: (retryCount: number, e: Error) => any;
	},
	alreadyTried: number = 1
): Promise<Result> {
	let rst: Result | Promise<Result> | null = null;
	if (retry < 0 || (retry > Number.MAX_SAFE_INTEGER && retry !== Infinity)) {
		throw new Error('retry must be between 0 to Number.MAX_SAFE_INTEGER or be Infinity');
	}

	try {
		rst = fn.call(this);
		if (isPromise<Result>(rst)) {
			rst = await rst;
		}
	} catch (e) {
		if (beforeRetry) {
			beforeRetry(alreadyTried, e);
		}
		if (retry) {
			return pRetry<Result>(
				fn,
				{
					// tslint:disable-next-line
					retry: --retry,
					beforeRetry
				},
				// tslint:disable-next-line
				++alreadyTried
			);
		} else {
			throw e;
		}
	}
	return rst!;
}

export function pTimeout<T = any>(p: Promise<T>, time: number = 0): Promise<T> {
	if (time < 1 || time > Number.MAX_SAFE_INTEGER) {
		return p;
	}

	let timer: ReturnType<typeof setTimeout> | null = null;
	const pTimer = new Promise<T>(
		// tslint:disable-next-line
		(rs, rj) => (timer = setTimeout(() => rj(new Error('promise timeout')), time))
	);

	return Promise.race<T>([p, pTimer]).then(
		(result: T): T => {
			clearTimeout(timer!);
			return result;
		}
	);
}

export async function getOSSConfiguration(config: string | undefined, argv: any): Promise<any> {
	let configurationPath: string | null = null,
		absoluteConfigPath: string | null = null,
		options: {
			[k: string]: any;
			ossOptions: any;
		} | null = null;
	const defaultConfigurationNames: Array<string> = [
		'.oasrc.js',
		'.oasrc.json',
		'.oasrc.yml',
		'.oasrc.yaml'
	].map((name: string) => resolve(process.cwd(), name)),
		defaultConfigurationFiles = defaultConfigurationNames.filter(pathExistsSync),
		globalConfigurationFiles = GLOBAL_CONFIG_FILES.filter(pathExistsSync);

	if (config && pathExistsSync(absoluteConfigPath = resolve(process.cwd(), config))) {
		// 指定了配置文件且配置文件存在则使用指定的配置文件
		configurationPath = absoluteConfigPath;
	} else if (config) {
		// 指定了config选项但是没有找到文件则抛出异常
		logger.error(`Configuration ${config} not found.`);
		process.exit(1);
	} else if (defaultConfigurationFiles[0]) {
		// 用目录下默认配置
		configurationPath = defaultConfigurationFiles[0];
	} else if (globalConfigurationFiles[0]) {
		// 用用户目录下的配置
		configurationPath = globalConfigurationFiles[0];
	} else {
		// 所有配置都由命令行给出
		options = {
			ossOptions: argv
		};
	}


	if (configurationPath) {
		const ext = extname(configurationPath);
		if (ext === '.js' || ext === '.json') {
			options = require(configurationPath);
		} else if (ext === '.yaml' || ext === '.yml') {
			try {
				options = safeLoad(await readFile(configurationPath, 'utf8'));
			} catch (e) {
				logger.error(e.message);
				process.exit(1);
			}
		} else {
			logger.error(
				`Unexpected file type: ${configurationPath}. Extension of configuration must be .js, .json, .yml or .yaml.`
			);
			process.exit(1);
		}
	}
	return options;
}

// function isPrimitive(v: any): boolean {
// 	return typeof v === 'number'
// 	|| typeof v === 'string'
// 	|| typeof v === 'boolean'
// 	|| typeof v === 'symbol'
// 	|| v == null;
// }


export function isOSSProvider(val: any): val is OSSProvider {
	const ossList: Array<OSSProvider> = ['ali', 'aws', 'tencent'];
	return ossList.includes(val);
}

export { logger, cleaner };
