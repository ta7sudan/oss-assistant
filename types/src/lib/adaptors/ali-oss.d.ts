import { OSSClient, OSSClientOptions, FileAsset, ListOptions } from './oss-client';
import OSS from 'ali-oss';
export default class AliOSSClient extends OSSClient {
    protected client: OSS;
    constructor(options: OSSClientOptions);
    upload(file: FileAsset, remotePath: string): Promise<void>;
    list(remotePath: string, options: ListOptions): Promise<void>;
    private getObjectsInfo;
}
//# sourceMappingURL=ali-oss.d.ts.map