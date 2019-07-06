import { OSSProvider } from './adaptors/oss-client';
export declare type FileTypes = 'img' | 'js' | 'css' | 'font';
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
export default function startUpload({ dir, retry, types, patterns, files, provider, remotePath, limit, timeout }: UploadCommandOptions, ossOptions: any): Promise<void>;
//# sourceMappingURL=start-upload.d.ts.map