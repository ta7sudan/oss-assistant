"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const adaptors_1 = require("./adaptors");
async function list(cmdOptions, ossOptions) {
    const { provider, longFormat = false, recursive = false } = cmdOptions;
    const remotePath = cmdOptions.remotePath || '/';
    if (!utils_1.isOSSProvider(provider)) {
        utils_1.logger.error(`Must specify a provider, use --provider, received ${provider}`);
        process.exit(1);
        return;
    }
    const client = adaptors_1.createOSSClient(provider, {
        ossOptions
    });
    // const data = await client.listenerCount()
    await client.list(remotePath, {
        longFormat,
        recursive
    });
    // console.log(target, longFormat, client);
}
exports.list = list;
//# sourceMappingURL=list.js.map