import type { DataProvider } from '@svadmin/core';
import { createRefineAdapter } from '@svadmin/refine-adapter';


/**
 * Creates a appwrite data provider using the official @refinedev/appwrite package.
 * Requires `@refinedev/appwrite` to be installed.
 * 
 * @param args Arguments required by @refinedev/appwrite
 * @returns A fully compatible svadmin DataProvider
 */
export async function createAppwriteDataProvider(...args: any[]): Promise<DataProvider> {
 
  // @ts-ignore
  const pkg = await import('@refinedev/appwrite');
  const init = (pkg as any).default || (pkg as any).dataProvider || (pkg as any).DataProvider;
  const refineProvider = init(...args);
  return createRefineAdapter(refineProvider);
}

export type AppwriteProviderOptions = any;
