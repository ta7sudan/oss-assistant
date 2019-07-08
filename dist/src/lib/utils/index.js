"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const figlet_1 = tslib_1.__importDefault(require("figlet"));
const path_1 = require("path");
const cleaner_1 = tslib_1.__importDefault(require("./cleaner"));
exports.cleaner = cleaner_1.default;
const os_1 = require("os");
const logger = tslib_1.__importStar(require("./logger"));
exports.logger = logger;
const fs_extra_1 = require("fs-extra");
const js_yaml_1 = require("js-yaml");
const pkg = require('../../../../package.json');
exports.GLOBAL_CONFIG_FILES = ['.oasrc.js', '.oasrc.json', '.oasrc.yml', '.oasrc.yaml'].map((name) => path_1.resolve(os_1.homedir(), name));
exports.isAsyncFunction = (fn) => fn[Symbol.toStringTag] === 'AsyncFunction';
exports.to = (p) => p
    .then((data) => [undefined, data])
    .catch((err) => [err, undefined]);
exports.sleep = (time) => new Promise((rs) => setTimeout(rs, time));
exports.getAbsolutePath = (rel) => path_1.resolve(process.cwd(), rel);
exports.getCmds = () => Object.keys(pkg.bin);
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
function chunk(array, groupCount) {
    const $groupCount = Math.max(groupCount, 0), length = array == null ? 0 : array.length;
    if (!$groupCount || !length) {
        return [];
    }
    const size = Math.floor(length / $groupCount), result = new Array($groupCount), len = $groupCount - 1;
    let index = 0;
    for (let i = 0; i < len; ++i) {
        result[i] = array.slice(index, (index += size));
    }
    result[len] = array.slice(index);
    return result;
}
exports.chunk = chunk;
function isPromise(p) {
    return !!(p && typeof p.then === 'function');
}
exports.isPromise = isPromise;
async function pRetry(fn, { retry, beforeRetry }, alreadyTried = 1) {
    let rst = null;
    if (retry < 0 || (retry > Number.MAX_SAFE_INTEGER && retry !== Infinity)) {
        throw new Error('retry must be between 0 to Number.MAX_SAFE_INTEGER or be Infinity');
    }
    try {
        rst = fn.call(this);
        if (isPromise(rst)) {
            rst = await rst;
        }
    }
    catch (e) {
        if (beforeRetry) {
            beforeRetry(alreadyTried, e);
        }
        if (retry) {
            return pRetry(fn, {
                // tslint:disable-next-line
                retry: --retry,
                beforeRetry
            }, 
            // tslint:disable-next-line
            ++alreadyTried);
        }
        else {
            throw e;
        }
    }
    return rst;
}
exports.pRetry = pRetry;
function pTimeout(p, time = 0) {
    if (time < 1 || time > Number.MAX_SAFE_INTEGER) {
        return p;
    }
    let timer = null;
    const pTimer = new Promise(
    // tslint:disable-next-line
    (rs, rj) => (timer = setTimeout(() => rj(new Error('promise timeout')), time)));
    return Promise.race([p, pTimer]).then((result) => {
        clearTimeout(timer);
        return result;
    });
}
exports.pTimeout = pTimeout;
async function getOSSConfiguration(config, argv) {
    let configurationPath = null, absoluteConfigPath = null, options = null;
    const defaultConfigurationNames = [
        '.oasrc.js',
        '.oasrc.json',
        '.oasrc.yml',
        '.oasrc.yaml'
    ].map((name) => path_1.resolve(process.cwd(), name)), defaultConfigurationFiles = defaultConfigurationNames.filter(fs_extra_1.pathExistsSync), globalConfigurationFiles = exports.GLOBAL_CONFIG_FILES.filter(fs_extra_1.pathExistsSync);
    if (config && fs_extra_1.pathExistsSync(absoluteConfigPath = path_1.resolve(process.cwd(), config))) {
        // 指定了配置文件且配置文件存在则使用指定的配置文件
        configurationPath = absoluteConfigPath;
    }
    else if (config) {
        // 指定了config选项但是没有找到文件则抛出异常
        logger.error(`Configuration ${config} not found.`);
        process.exit(1);
    }
    else if (defaultConfigurationFiles[0]) {
        // 用目录下默认配置
        configurationPath = defaultConfigurationFiles[0];
    }
    else if (globalConfigurationFiles[0]) {
        // 用用户目录下的配置
        configurationPath = globalConfigurationFiles[0];
    }
    else {
        // 所有配置都由命令行给出
        options = {
            ossOptions: argv
        };
    }
    if (configurationPath) {
        const ext = path_1.extname(configurationPath);
        if (ext === '.js' || ext === '.json') {
            options = require(configurationPath);
        }
        else if (ext === '.yaml' || ext === '.yml') {
            try {
                options = js_yaml_1.safeLoad(await fs_extra_1.readFile(configurationPath, 'utf8'));
            }
            catch (e) {
                logger.error(e.message);
                process.exit(1);
            }
        }
        else {
            logger.error(`Unexpected file type: ${configurationPath}. Extension of configuration must be .js, .json, .yml or .yaml.`);
            process.exit(1);
        }
    }
    return options;
}
exports.getOSSConfiguration = getOSSConfiguration;
// function isPrimitive(v: any): boolean {
// 	return typeof v === 'number'
// 	|| typeof v === 'string'
// 	|| typeof v === 'boolean'
// 	|| typeof v === 'symbol'
// 	|| v == null;
// }
function isOSSProvider(val) {
    const ossList = ['ali', 'aws', 'tencent'];
    return ossList.includes(val);
}
exports.isOSSProvider = isOSSProvider;
//# sourceMappingURL=index.js.map