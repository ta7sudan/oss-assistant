/// <reference types="node" />
import { EventEmitter } from 'events';
import { OSSProvider, FileAsset } from './adaptors/oss-client';
export interface UploadTaskOptions {
    retry: number;
    limit: number;
    timeout: number;
    provider: OSSProvider;
    files: FileAsset[];
    remotePath: string;
    ossOptions: any;
}
export declare class UploadTask extends EventEmitter {
    private clientPool;
    private files;
    private remotePath;
    private completeChecker;
    constructor({ retry, limit, timeout, provider, files, remotePath, ossOptions }: UploadTaskOptions);
    private scheduleUpload;
    private handleUploadError;
    start(): Promise<void>;
    private hasUnhandledFiles;
    private isAllClientIdle;
    private hasIdleClient;
    private getIdleClient;
}
//# sourceMappingURL=upload-task.d.ts.map