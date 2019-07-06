"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const oss_client_1 = require("./oss-client");
const ali_oss_1 = tslib_1.__importDefault(require("ali-oss"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const utils_1 = require("../utils");
const path_1 = require("path");
const permissionMap = {
    'public-read-write': 'rw',
    'public-read': 'r-',
    private: '--',
    default: '??'
};
;
;
function getPathObj(path) {
    const parts = path.replace(/^\/|\/$/, '').split('/'), list = {
        next: null,
        length: 0
    };
    let p = list;
    while (parts.length) {
        p.next = {
            value: parts.shift(),
            next: null
        };
        p = p.next;
        ++list.length;
    }
    return list;
}
function addPathToTrees(path, trees) {
    if (!path) {
        return false;
    }
    else if (!trees.length) {
        let t = trees, p = path;
        while (p) {
            const item = {
                value: p.value,
                children: p.next ? [] : null
            };
            t.push(item);
            t = item.children;
            p = p.next;
        }
        return true;
    }
    else {
        const item = path;
        let rst = false;
        if (item) {
            for (const tree of trees) {
                if (tree.value === item.value && tree.children && item.next) {
                    rst = addPathToTrees(item.next, tree.children);
                }
            }
            if (!rst) {
                let t = trees, p = path;
                while (p) {
                    const $item = {
                        value: p.value,
                        children: p.next ? [] : null
                    };
                    t.push($item);
                    t = $item.children;
                    p = p.next;
                }
            }
            return true;
        }
        else {
            return false;
        }
    }
}
function buildTreeObjFromTrees(trees) {
    const result = {};
    for (const tree of trees) {
        if (tree.children) {
            result[tree.value] = buildTreeObjFromTrees(tree.children);
        }
        else {
            result[tree.value] = null;
        }
    }
    return result;
}
function convertToTree(objects) {
    const trees = [];
    // buildTrees(objects.map(obj => obj.objectName), trees);
    for (const item of objects) {
        const path = getPathObj(item.objectName);
        addPathToTrees(path.next, trees);
    }
    const treeObj = buildTreeObjFromTrees(trees);
    return treeObj;
}
class AliOSSClient extends oss_client_1.OSSClient {
    constructor(options) {
        super(options);
        this.client = new ali_oss_1.default(options.ossOptions);
    }
    async upload(file, remotePath) {
        const absoluteFilePath = file.file;
        const targetPath = path_1.posix.resolve(remotePath, file.relativePath);
        let err = null, data;
        this.active = true;
        try {
            // data = await this.client.put('test.js', file);
            data = await utils_1.pRetry(() => utils_1.pTimeout((async () => {
                const res = await this.client.put(targetPath, absoluteFilePath);
                // TODO 先硬编码, 忽略掉这个请求的异常, 到时候考虑暴露控制选项,
                // 完善异常处理, CORS控制等等
                await this.client.putACL(targetPath, 'public-read');
                return res;
            })(), this.timeout), {
                retry: this.retry,
                beforeRetry(count, e) {
                    utils_1.logger.warn(`Retry count: ${chalk_1.default.cyan.underline(`${count}`)}, retry to upload ${chalk_1.default.cyan.underline(absoluteFilePath)} to ${chalk_1.default.cyan(targetPath)}, message: ${chalk_1.default.red(e.message)}`);
                }
            });
        }
        catch (e) {
            err = e;
        }
        this.active = false;
        if (err) {
            this.emit('error', err, file);
            return Promise.reject(err);
        }
        else if (data && data.res.status === 200) {
            utils_1.logger.success(`Success: ${chalk_1.default.cyan.underline(absoluteFilePath)} ======> ${chalk_1.default.green.underline(data.url.replace(/(?<!:)(\/\/)/g, '/'))}`);
            this.emit('uploadDone', this);
        }
        else if (data && data.res.status !== 200) {
            throw new Error(`Status code: ${data.res.status}, message: ${data.res.statusMessage}`);
        }
        else {
            throw new Error(`Unknown error.`);
        }
    }
    async list(remotePath, options) {
        const { longFormat } = options;
        const objects = await this.getObjectsInfo(remotePath, options);
        const files = objects.filter((item) => item.type === 0 /* file */);
        if (longFormat) {
            console.log(`total ${chalk_1.default.yellow(`${files.length}`)}\n`);
            for (const file of files) {
                let fileSize = 0, sizeStr = '0byte';
                if (file.size < 1024) {
                    fileSize = file.size;
                    sizeStr = `${fileSize}`.padStart(6, ' ') + ' byte';
                }
                else if (file.size < 1048576) {
                    fileSize = Math.floor(file.size / 1024);
                    sizeStr = `${fileSize}`.padStart(6, ' ') + '   KB';
                }
                else if (file.size < 1073741824) {
                    fileSize = Math.floor(file.size / 1048576);
                    sizeStr = `${fileSize}`.padStart(6, ' ') + '   MB';
                }
                else {
                    fileSize = Math.floor(file.size / 1073741824);
                    sizeStr = `${fileSize}`.padStart(6, ' ') + '   GB';
                }
                console.log(`${file.permission}   ${sizeStr}   ${file.lastModified}  ${chalk_1.default.cyan.underline(file.objectName)} ======> ${chalk_1.default.green.underline(file.url)}`);
            }
        }
        else {
            console.log(`total ${chalk_1.default.yellow(`${files.length}`)}\n`);
            const dirTreeObj = convertToTree(objects);
            // 这里asTree很简单, 也就这里用到了, 没必要静态导入, 动态导入可以在upload的时候快那么一点
            const dirTreeStr = require('treeify').asTree(dirTreeObj);
            console.log(`${chalk_1.default.yellowBright(dirTreeStr)}`);
        }
    }
    async getObjectsInfo(remotePath, { recursive, longFormat }) {
        const $remotePath = remotePath === '/' || !remotePath ? '' : remotePath.replace(/^\//, ''), delimiter = recursive ? undefined : '/', prefix = recursive
            ? $remotePath
            : $remotePath === ''
                ? $remotePath
                : `${$remotePath.replace(/\/$/, '')}/`;
        let data = null, err = null, result = [];
        try {
            data = await this.client.list({
                prefix,
                delimiter,
                'max-keys': 1000
                // 妈的sdk的type define有毛病吧...
            }, undefined);
        }
        catch (e) {
            err = e;
        }
        if (err) {
            throw err;
        }
        else if (data && data.res.status !== 200) {
            throw new Error(`Status code: ${data.res.status}, message: ${data.res.statusMessage}`);
        }
        else if (!data) {
            throw new Error(`Unknown error.`);
        }
        if (!data.objects && /\/$/.test(prefix)) {
            try {
                data = await this.client.list({
                    prefix: prefix.replace(/\/$/, ''),
                    delimiter,
                    'max-keys': 1000
                    // 妈的sdk的type define有毛病吧...
                }, undefined);
            }
            catch (e) {
                err = e;
            }
            if (err) {
                throw err;
            }
            else if (data && data.res.status !== 200) {
                throw new Error(`Status code: ${data.res.status}, message: ${data.res.statusMessage}`);
            }
            else if (!data) {
                throw new Error(`Unknown error.`);
            }
        }
        if (data.objects) {
            result = data.objects.map((item) => ({
                objectName: item.name,
                name: item.name.split('/').slice(-1)[0],
                url: item.url,
                lastModified: item.lastModified,
                type: 0 /* file */,
                size: item.size,
                permission: ''
            }));
        }
        if (Array.isArray(data.prefixes)) {
            result = result.concat(data.prefixes.map((item) => ({
                objectName: item,
                name: item.split('/').slice(-2)[0],
                url: undefined,
                lastModified: undefined,
                type: 1 /* dir */,
                size: 0,
                permission: '--'
            })));
        }
        if (longFormat) {
            const reqs = [];
            for (const [index, value] of result.entries()) {
                if (value.type === 1 /* dir */) {
                    continue;
                }
                reqs.push((async () => {
                    const $data = await this.client.getACL(value.objectName);
                    return {
                        index,
                        permission: $data.acl
                    };
                })());
            }
            const rst = await Promise.all(reqs);
            for (const item of rst) {
                result[item.index].permission = permissionMap[item.permission];
            }
        }
        return result;
    }
}
exports.default = AliOSSClient;
//# sourceMappingURL=ali-oss.js.map