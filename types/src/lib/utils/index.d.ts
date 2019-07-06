import { OSSProvider } from '../adaptors/oss-client';
import cleaner from './cleaner';
import * as logger from './logger';
export declare const GLOBAL_CONFIG_FILES: string[];
export declare type Callable = (...args: any[]) => any;
export declare type AsyncCallable = (...args: any[]) => Promise<any>;
export declare const isAsyncFunction: (fn: any) => fn is AsyncCallable;
export declare const to: (p: Promise<any>) => Promise<[undefined, any] | [any, undefined]>;
export declare const sleep: (time: number) => Promise<any>;
export declare const getAbsolutePath: (rel: string) => string;
export declare const getCmds: () => string[];
export declare const getFiglet: (cmd: string) => Promise<string>;
export declare function chunk<T = any>(array: Array<T>, groupCount: number): Array<Array<T>>;
export declare function isPromise<T = any>(p: any): p is Promise<T>;
export declare function pRetry<Result = any>(this: any, fn: (...args: any[]) => any, { retry, beforeRetry }: {
    retry: number;
    beforeRetry?: (retryCount: number, e: Error) => any;
}, alreadyTried?: number): Promise<Result>;
export declare function pTimeout<T = any>(p: Promise<T>, time?: number): Promise<T>;
export declare function getOSSConfiguration(config: string | undefined, argv: any): Promise<any>;
export declare function isOSSProvider(val: any): val is OSSProvider;
export { logger, cleaner };
//# sourceMappingURL=index.d.ts.map