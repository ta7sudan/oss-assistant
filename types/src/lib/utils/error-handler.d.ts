declare function handleSignal(): Promise<void>;
interface CustomError {
    msg: string;
    stack: string;
}
declare function handleError(e: Error | CustomError): Promise<any>;
export { handleError, handleSignal };
//# sourceMappingURL=error-handler.d.ts.map