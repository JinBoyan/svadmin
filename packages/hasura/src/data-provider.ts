import type { DataProvider } from '@svadmin/core';
import { createRefineAdapter } from '@svadmin/refine-adapter';
import dataProvider from '@refinedev/hasura';

/**
 * Creates a Hasura data provider using the official @refinedev/hasura package.
 * Requires `graphql-request` and `@refinedev/hasura` to be installed.
 * 
 * @param client The GraphQLClient instance
 * @param options Optional configuration for the Hasura data provider
 * @returns A fully compatible svadmin DataProvider
 */
export function createHasuraDataProvider(client: any, options?: any): DataProvider {
  const refineHasuraProvider = dataProvider(client, options);
  return createRefineAdapter(refineHasuraProvider);
}
