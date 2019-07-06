import { createOSSClient } from './adaptors';
import { EventEmitter } from 'events';
import { setInterval } from 'timers';
import { OSSProvider, OSSClient, FileAsset } from './adaptors/oss-client';


export interface UploadTaskOptions {
	retry: number;
	limit: number;
	timeout: number;
	provider: OSSProvider;
	files: FileAsset[];
	remotePath: string;
	ossOptions: any;
}


export class UploadTask extends EventEmitter {
	private clientPool: OSSClient[];
	private files: FileAsset[];
	private remotePath: string;
	private completeChecker: ReturnType<typeof setInterval> | null;
	constructor({
		retry = -1,
		limit = 10,
		timeout = 0,
		provider,
		files,
		remotePath = '/',
		ossOptions
	}: UploadTaskOptions) {
		super();
		this.clientPool = Array.from({ length: limit }, () => createOSSClient(provider, {
			retry,
			timeout,
			ossOptions
		}));
		if (limit < 0 || limit > Number.MAX_SAFE_INTEGER) {
			throw new Error('limit must be between 0 to Number.MAX_SAFE_INTEGER');
		}
		this.files = files;
		this.remotePath = remotePath;
		this.completeChecker = null;
		this.handleUploadError = this.handleUploadError.bind(this);
		this.scheduleUpload = this.scheduleUpload.bind(this);
	}

	private scheduleUpload(client: OSSClient): void {
		// 即便所有文件都消费完也不意味着上传结束, 还有正在上传的文件
		// 所以要判断client是否都空闲
		if (this.isAllClientIdle() && !this.hasUnhandledFiles()) {
			this.completeChecker && clearInterval(this.completeChecker);
			this.emit('taskComplete');
			return;
		} else if (this.hasUnhandledFiles()) {
			const fileAsset = this.files.shift();
			client.upload(fileAsset!, this.remotePath);
			// client.once('uploadDone', this.scheduleUpload);
			// client.once('error', this.handleUploadError);
		} else if (!this.isAllClientIdle()) {
			// 同一时刻只有一个检查器就够了, 判断放里面和放外面的逻辑不等价
			if (!this.completeChecker) {
				this.completeChecker = setInterval(() => {
					if (this.isAllClientIdle()) {
						clearInterval(this.completeChecker!);
						this.emit('taskComplete');
					} else if (this.hasUnhandledFiles()) {
						clearInterval(this.completeChecker!);
						this.scheduleUpload(client);
					}
				}, 1000);
			}
		} else {
			const fileAsset = this.files.shift();
			const c = this.getIdleClient();
			c!.upload(fileAsset!, this.remotePath);
			// c!.once('uploadDone', this.scheduleUpload);
			// c!.once('error', this.handleUploadError);
		}
	}

	private handleUploadError(err: Error, file: FileAsset): void {
		this.files.push(file);
		this.emit('error', err);
	}

	public start(): Promise<void> {
		if (!this.hasUnhandledFiles() || !this.clientPool.length) {
			return Promise.resolve();
		}
		while (this.hasUnhandledFiles() && this.hasIdleClient()) {
			const fileAsset = this.files.shift();
			const client = this.getIdleClient();
			client!.upload(fileAsset!, this.remotePath);
			client!.on('uploadDone', this.scheduleUpload);
			client!.on('error', this.handleUploadError);
		}
		// tslint:disable-next-line
		return new Promise<void>((rs, rj) => {
			this.on('taskComplete', rs);
			this.on('error', rj);
		});
	}

	private hasUnhandledFiles(): boolean {
		return !!this.files.length;
	}

	private isAllClientIdle(): boolean {
		return this.clientPool.every((client: OSSClient): boolean => !client.active);
	}

	private hasIdleClient(): boolean {
		return this.clientPool.some((client: OSSClient): boolean => !client.active);
	}

	private getIdleClient(): OSSClient | undefined {
		return this.clientPool.filter((client: OSSClient): boolean => !client.active)[0];
	}
}