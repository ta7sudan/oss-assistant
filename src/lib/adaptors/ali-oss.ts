import { OSSClient, OSSClientOptions, FileAsset, ListOptions } from './oss-client';
import OSS from 'ali-oss';
import chalk from 'chalk';
import { logger, pRetry, pTimeout } from '../utils';
import { posix } from 'path';

const enum ObjectType {
	file,
	dir
}

interface RemoteObjectInfo {
	// 包含路径的名字
	objectName: string;
	// 不包含路径的名字
	name: string;
	// 下载的url
	url?: string;
	lastModified?: string;
	// 对象类型, 目录or文件
	type: ObjectType;
	// 文件大小
	size?: number;
	// 权限
	permission?: string;
}

const permissionMap: {
	[k: string]: string;
} = {
	'public-read-write': 'rw',
	'public-read': 'r-',
	private: '--',
	default: '??'
};

interface Tree<T> {
	value: T;
	children: Array<Tree<T>> | null;
};

type Node<T> = {
	value: T;
	next: Node<T>;
} | null;

interface List<T> {
	next: Node<T>;
	length: number;
};

function getPathObj(path: string): List<string> {
	const parts = path.replace(/^\/|\/$/, '').split('/'),
		list: List<string> = {
			next: null,
			length: 0
		};
	let p: List<string> | Node<string> = list;
	while (parts.length) {
		p.next = {
			value: parts.shift()!,
			next: null
		};
		p = p.next;
		++list.length;
	}
	return list;
}

function addPathToTrees(path: Node<string>, trees: Array<Tree<string>>): boolean {
	if (!path) {
		return false;
	} else if (!trees.length) {
		let t: Array<Tree<string>> | null = trees, p: Node<string> = path;
		while (p) {
			const item: Tree<string> = {
				value: p.value,
				children: p.next ? [] : null
			}
			t!.push(item);
			t = item.children;
			p = p.next;
		}
		return true;
	} else {
		const item = path;
		let rst = false;
		if (item) {
			for (const tree of trees) {
				if (tree.value === item.value && tree.children && item.next) {
					rst = addPathToTrees(item.next, tree.children);
				}
			}
			if (!rst) {
				let t: Array<Tree<string>> | null = trees, p: Node<string> = path;
				while (p) {
					const $item: Tree<string> = {
						value: p.value,
						children: p.next ? [] : null
					}
					t!.push($item);
					t = $item.children;
					p = p.next;
				}
			}
			return true;
		} else {
			return false;
		}
	}
}

function buildTreeObjFromTrees(trees: Array<Tree<string>>): any {
	const result: any = {};
	for (const tree of trees) {
		if (tree.children) {
			result[tree.value] = buildTreeObjFromTrees(tree.children);
		} else {
			result[tree.value] = null;
		}
	}
	return result;
}

function convertToTree(objects: Array<RemoteObjectInfo>): any {
	const trees: Array<Tree<string>> = [];
	// buildTrees(objects.map(obj => obj.objectName), trees);
	for (const item of objects) {
		const path = getPathObj(item.objectName);
		addPathToTrees(path.next, trees);
	}
	const treeObj = buildTreeObjFromTrees(trees);
	return treeObj;
}

export default class AliOSSClient extends OSSClient {
	protected client: OSS;
	constructor(options: OSSClientOptions) {
		super(options);
		this.client = new OSS(options.ossOptions);
	}
	public async upload(file: FileAsset, remotePath: string): Promise<void> {
		const absoluteFilePath = file.file;
		const targetPath = posix.resolve(remotePath, file.relativePath);
		let err: Error | null = null,
			data: OSS.PutObjectResult | void;

		this.active = true;
		try {
			// data = await this.client.put('test.js', file);
			data = await pRetry<OSS.PutObjectResult>(
				() =>
					pTimeout<OSS.PutObjectResult>(
						(async (): Promise<OSS.PutObjectResult> => {
							const res = await this.client.put(targetPath, absoluteFilePath);
							// TODO 先硬编码, 忽略掉这个请求的异常, 到时候考虑暴露控制选项,
							// 完善异常处理, CORS控制等等
							await this.client.putACL(targetPath, 'public-read');
							return res;
						})(),
						this.timeout
					),
				{
					retry: this.retry,
					beforeRetry(count: number, e: Error): void {
						logger.warn(
							`Retry count: ${chalk.cyan.underline(
								`${count}`
							)}, retry to upload ${chalk.cyan.underline(absoluteFilePath)} to ${chalk.cyan(
								targetPath
							)}, message: ${chalk.red(e.message)}`
						);
					}
				}
			);
		} catch (e) {
			err = e;
		}

		this.active = false;
		if (err) {
			this.emit('error', err, file);
			return Promise.reject(err);
		} else if (data && data.res.status === 200) {
			logger.success(
				`Success: ${chalk.cyan.underline(absoluteFilePath)} ======> ${chalk.green.underline(
					(data as any).url.replace(/(?<!:)(\/\/)/g, '/')
				)}`
			);
			this.emit('uploadDone', this);
		} else if (data && data.res.status !== 200) {
			throw new Error(
				`Status code: ${data.res.status}, message: ${(data.res as any).statusMessage}`
			);
		} else {
			throw new Error(`Unknown error.`);
		}
	}

	public async list(remotePath: string, options: ListOptions): Promise<void> {
		const { longFormat } = options;
		const objects = await this.getObjectsInfo(remotePath, options);

		const files = objects.filter((item: RemoteObjectInfo) => item.type === ObjectType.file);
		if (longFormat) {
			console.log(`total ${chalk.yellow(`${files.length}`)}\n`);
			for (const file of files) {
				let fileSize = 0, sizeStr = '0byte';
				if (file.size! < 1024) {
					fileSize = file.size!;
					sizeStr = `${fileSize}`.padStart(6, ' ') + ' byte';
				} else if (file.size! < 1048576) {
					fileSize = Math.floor(file.size! / 1024);
					sizeStr = `${fileSize}`.padStart(6, ' ') + '   KB';
				} else if (file.size! < 1073741824) {
					fileSize = Math.floor(file.size! / 1048576);
					sizeStr = `${fileSize}`.padStart(6, ' ') + '   MB';
				} else {
					fileSize = Math.floor(file.size! / 1073741824);
					sizeStr = `${fileSize}`.padStart(6, ' ') + '   GB';
				}
				console.log(`${file.permission}   ${sizeStr}   ${file.lastModified}  ${chalk.cyan.underline(file.objectName)} ======> ${chalk.green.underline(file.url!)}`);
			}
		} else {
			console.log(`total ${chalk.yellow(`${files.length}`)}\n`);
			const dirTreeObj = convertToTree(objects);
			// 这里asTree很简单, 也就这里用到了, 没必要静态导入, 动态导入可以在upload的时候快那么一点
			const dirTreeStr = require('treeify').asTree(dirTreeObj);
			console.log(`${chalk.yellowBright(dirTreeStr)}`);
		}
	}

	private async getObjectsInfo(
		remotePath: string,
		{ recursive, longFormat }: ListOptions
	): Promise<Array<RemoteObjectInfo>> {
		const $remotePath = remotePath === '/' || !remotePath ? '' : remotePath.replace(/^\//, ''),
			delimiter = recursive ? undefined : '/',
			prefix = recursive
				? $remotePath
				: $remotePath === ''
				? $remotePath
				: `${$remotePath.replace(/\/$/, '')}/`;
		let data: any = null,
			err: Error | null = null,
			result: Array<RemoteObjectInfo> = [];

		try {
			data = await this.client.list(
				{
					prefix,
					delimiter,
					'max-keys': 1000
					// 妈的sdk的type define有毛病吧...
				},
				undefined as any
			);
		} catch (e) {
			err = e;
		}

		if (err) {
			throw err;
		} else if (data && data.res.status !== 200) {
			throw new Error(
				`Status code: ${data.res.status}, message: ${(data.res as any).statusMessage}`
			);
		} else if (!data) {
			throw new Error(`Unknown error.`);
		}

		if (!data.objects && /\/$/.test(prefix)) {
			try {
				data = await this.client.list(
					{
						prefix: prefix.replace(/\/$/, ''),
						delimiter,
						'max-keys': 1000
						// 妈的sdk的type define有毛病吧...
					},
					undefined as any
				);
			} catch (e) {
				err = e;
			}

			if (err) {
				throw err;
			} else if (data && data.res.status !== 200) {
				throw new Error(
					`Status code: ${data.res.status}, message: ${(data.res as any).statusMessage}`
				);
			} else if (!data) {
				throw new Error(`Unknown error.`);
			}
		}

		if (data.objects) {
			result = (data.objects as Array<any>).map<RemoteObjectInfo>((item: any) => ({
				objectName: item.name,
				name: item.name.split('/').slice(-1)[0],
				url: item.url,
				lastModified: item.lastModified,
				type: ObjectType.file,
				size: item.size,
				permission: ''
			}));
		}

		if (Array.isArray(data.prefixes)) {
			result = result.concat(
				(data.prefixes as Array<any>).map<RemoteObjectInfo>((item: string) => ({
					objectName: item,
					name: item.split('/').slice(-2)[0],
					url: undefined,
					lastModified: undefined,
					type: ObjectType.dir,
					size: 0,
					permission: '--'
				}))
			);
		}

		if (longFormat) {
			const reqs: Array<Promise<any>> = [];
			for (const [index, value] of result.entries()) {
				if (value.type === ObjectType.dir) {
					continue;
				}
				reqs.push(
					(async (): Promise<any> => {
						const $data = await this.client.getACL(value.objectName);
						return {
							index,
							permission: $data.acl
						};
					})()
				);
			}
			const rst = await Promise.all(reqs);
			for (const item of rst) {
				result[item.index].permission = permissionMap[item.permission];
			}
		}

		return result;
	}
}
