"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adaptors_1 = require("./adaptors");
const events_1 = require("events");
const timers_1 = require("timers");
class UploadTask extends events_1.EventEmitter {
    constructor({ retry = -1, limit = 10, timeout = 0, provider, files, remotePath = '/', ossOptions }) {
        super();
        this.clientPool = Array.from({ length: limit }, () => adaptors_1.createOSSClient(provider, {
            retry,
            timeout,
            ossOptions
        }));
        if (limit < 0 || limit > Number.MAX_SAFE_INTEGER) {
            throw new Error('limit must be between 0 to Number.MAX_SAFE_INTEGER');
        }
        this.files = files;
        this.remotePath = remotePath;
        this.completeChecker = null;
        this.handleUploadError = this.handleUploadError.bind(this);
        this.scheduleUpload = this.scheduleUpload.bind(this);
    }
    scheduleUpload(client) {
        // 即便所有文件都消费完也不意味着上传结束, 还有正在上传的文件
        // 所以要判断client是否都空闲
        if (this.isAllClientIdle() && !this.hasUnhandledFiles()) {
            this.completeChecker && clearInterval(this.completeChecker);
            this.emit('taskComplete');
            return;
        }
        else if (this.hasUnhandledFiles()) {
            const fileAsset = this.files.shift();
            client.upload(fileAsset, this.remotePath);
            // client.once('uploadDone', this.scheduleUpload);
            // client.once('error', this.handleUploadError);
        }
        else if (!this.isAllClientIdle()) {
            // 同一时刻只有一个检查器就够了, 判断放里面和放外面的逻辑不等价
            if (!this.completeChecker) {
                this.completeChecker = timers_1.setInterval(() => {
                    if (this.isAllClientIdle()) {
                        clearInterval(this.completeChecker);
                        this.emit('taskComplete');
                    }
                    else if (this.hasUnhandledFiles()) {
                        clearInterval(this.completeChecker);
                        this.scheduleUpload(client);
                    }
                }, 1000);
            }
        }
        else {
            const fileAsset = this.files.shift();
            const c = this.getIdleClient();
            c.upload(fileAsset, this.remotePath);
            // c!.once('uploadDone', this.scheduleUpload);
            // c!.once('error', this.handleUploadError);
        }
    }
    handleUploadError(err, file) {
        this.files.push(file);
        this.emit('error', err);
    }
    start() {
        if (!this.hasUnhandledFiles() || !this.clientPool.length) {
            return Promise.resolve();
        }
        while (this.hasUnhandledFiles() && this.hasIdleClient()) {
            const fileAsset = this.files.shift();
            const client = this.getIdleClient();
            client.upload(fileAsset, this.remotePath);
            client.on('uploadDone', this.scheduleUpload);
            client.on('error', this.handleUploadError);
        }
        // tslint:disable-next-line
        return new Promise((rs, rj) => {
            this.on('taskComplete', rs);
            this.on('error', rj);
        });
    }
    hasUnhandledFiles() {
        return !!this.files.length;
    }
    isAllClientIdle() {
        return this.clientPool.every((client) => !client.active);
    }
    hasIdleClient() {
        return this.clientPool.some((client) => !client.active);
    }
    getIdleClient() {
        return this.clientPool.filter((client) => !client.active)[0];
    }
}
exports.UploadTask = UploadTask;
//# sourceMappingURL=upload-task.js.map