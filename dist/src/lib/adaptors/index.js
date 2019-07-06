"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line
const OSSMap = {
    ali: 'ali-oss',
    tencent: 'tencent-oss',
    aws: 'aws'
};
function createOSSClient(provider, options) {
    const $Constructor = require(`./${OSSMap[provider]}`).default;
    return new $Constructor(options);
}
exports.createOSSClient = createOSSClient;
//# sourceMappingURL=index.js.map