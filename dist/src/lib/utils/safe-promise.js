"use strict";
const eventName = 'unhandledRejection';
function registerHandler(event) {
    process.addListener(event, (reason) => {
        if (reason instanceof Error) {
            throw reason;
        }
        else {
            throw new Error(`Unhandled promise rejection. Reject reason is: ${JSON.stringify(reason)}`);
        }
    });
}
if (process.listenerCount(eventName) === 0) {
    registerHandler(eventName);
}
//# sourceMappingURL=safe-promise.js.map