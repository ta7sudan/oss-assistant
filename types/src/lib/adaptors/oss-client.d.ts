/// <reference types="node" />
import { EventEmitter } from 'events';
export interface FileAsset {
    file: string;
    relativePath: string;
}
export declare type OSSProvider = 'ali' | 'aws' | 'tencent';
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
export declare abstract class OSSClient extends EventEmitter implements OSSOperation {
    active: boolean;
    protected client: any;
    protected retry: number;
    protected timeout: number;
    constructor({ retry, timeout, ossOptions }: OSSClientOptions);
    abstract upload(file: FileAsset, remotePath: string): Promise<void>;
    abstract list(remotePath: string, options: any): Promise<void>;
}
//# sourceMappingURL=oss-client.d.ts.map