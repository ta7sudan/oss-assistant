import { EventEmitter } from 'events';

export interface FileAsset {
	file: string;
	relativePath: string;
}

export type OSSProvider = 'ali' | 'aws' | 'tencent';

export interface ListOptions {
	longFormat: boolean;
	recursive: boolean;
}

export interface OSSOperation {
	upload: (file: FileAsset, remotePath: string) => Promise<void>;
	list: (remotePath: string, options: ListOptions) => Promise<void>;
}

export interface OSSClientOptions {
	retry?: number;
	timeout?: number;
	ossOptions: any;
}

export abstract class OSSClient extends EventEmitter implements OSSOperation {
	public active: boolean;
	protected client: any;
	protected retry: number;
	protected timeout: number;
	// tslint:disable-next-line
	constructor({ retry = -1, timeout = 0, ossOptions }: OSSClientOptions) {
		super();
		// this.client = new ClientConstructor(options);
		this.retry = retry === -1 ? Infinity : retry;
		this.active = false;
		this.timeout = timeout === 0 ? Infinity : timeout;
	}

	public abstract upload(file: FileAsset, remotePath: string): Promise<void>;

	public abstract list(remotePath: string, options: any): Promise<void>;
}
