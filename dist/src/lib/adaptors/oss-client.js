"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class OSSClient extends events_1.EventEmitter {
    // tslint:disable-next-line
    constructor({ retry = -1, timeout = 0, ossOptions }) {
        super();
        // this.client = new ClientConstructor(options);
        this.retry = retry === -1 ? Infinity : retry;
        this.active = false;
        this.timeout = timeout === 0 ? Infinity : timeout;
    }
}
exports.OSSClient = OSSClient;
//# sourceMappingURL=oss-client.js.map