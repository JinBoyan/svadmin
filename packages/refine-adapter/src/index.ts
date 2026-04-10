import type { DataProvider as SvadminDataProvider } from '@svadmin/core';

/**
 * Adapter to consume an official @refinedev/* data provider in SvelteAdmin.
 * Refine's DataProvider interface directly matches the core interface 
 * definition of @svadmin/core.
 */
export function createRefineAdapter(refineProvider: any): SvadminDataProvider {
  return {
    getApiUrl: () => refineProvider.getApiUrl(),
    getList: refineProvider.getList,
    getOne: refineProvider.getOne,
    create: refineProvider.create,
    update: refineProvider.update,
    deleteOne: refineProvider.deleteOne,
    getMany: refineProvider.getMany,
    createMany: refineProvider.createMany,
    updateMany: refineProvider.updateMany,
    deleteMany: refineProvider.deleteMany,
    custom: refineProvider.custom,
  } as SvadminDataProvider;
}
