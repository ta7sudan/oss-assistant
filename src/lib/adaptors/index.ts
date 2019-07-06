import { OSSProvider, OSSClientOptions, OSSClient } from './oss-client';

// tslint:disable-next-line
const OSSMap: {
	[k in OSSProvider]: string;
} = {
	ali: 'ali-oss',
	tencent: 'tencent-oss',
	aws: 'aws'
};


export function createOSSClient(provider: OSSProvider, options: OSSClientOptions): OSSClient {
	const $Constructor = require(`./${OSSMap[provider]}`).default;
	return new $Constructor(options) as OSSClient;
}