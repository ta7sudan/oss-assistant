"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const figlet_1 = tslib_1.__importDefault(require("figlet"));
const path_1 = tslib_1.__importDefault(require("path"));
const package_json_1 = tslib_1.__importDefault(require("../../../package.json"));
const cleaner_1 = tslib_1.__importDefault(require("./cleaner"));
exports.cleaner = cleaner_1.default;
const logger = tslib_1.__importStar(require("./logger"));
exports.logger = logger;
exports.isAsyncFunction = (fn) => fn[Symbol.toStringTag] === 'AsyncFunction';
exports.to = (p) => p.then((data) => [undefined, data]).catch((err) => [err, undefined]);
exports.sleep = (time) => new Promise((rs) => setTimeout(rs, time));
exports.getAbsolutePath = (rel) => path_1.default.resolve(process.cwd(), rel);
exports.getCmds = () => Object.keys(package_json_1.default.bin);
exports.getFiglet = (cmd) => new Promise((rs, rj) => {
    figlet_1.default(cmd, {
        horizontalLayout: 'fitted'
    }, (err, data) => {
        if (err) {
            rj(err);
        }
        else {
            rs(data);
        }
    });
});
//# sourceMappingURL=index.js.map