import { logger, isOSSProvider } from './utils';
import { createOSSClient } from './adaptors';

export interface ListCommandOptions {
	longFormat?: boolean;
	remotePath?: string;
	provider?: string;
	recursive?: boolean;
}
export async function list(cmdOptions: ListCommandOptions, ossOptions: any): Promise<any> {
	const { provider, longFormat = false, recursive = false } = cmdOptions;
	const remotePath = cmdOptions.remotePath || '/' ;

	if (!isOSSProvider(provider)) {
		logger.error(`Must specify a provider, use --provider, received ${provider}`);
		process.exit(1);
		return;
	}

	const client = createOSSClient(provider, {
		ossOptions
	});

	// const data = await client.listenerCount()
	await client.list(remotePath, {
		longFormat,
		recursive
	});

	// console.log(target, longFormat, client);
	
}