import cleaner from './cleaner';
import * as logger from './logger';
export declare type Callable = (...args: any[]) => any;
export declare type AsyncCallable = (...args: any[]) => Promise<any>;
export declare const isAsyncFunction: (fn: any) => fn is AsyncCallable;
export declare const to: (p: Promise<any>) => Promise<[undefined, any] | [any, undefined]>;
export declare const sleep: (time: number) => Promise<any>;
export declare const getAbsolutePath: (rel: string) => string;
export declare const getCmds: () => string[];
export declare const getFiglet: (cmd: string) => Promise<string>;
export { logger, cleaner };
//# sourceMappingURL=index.d.ts.map