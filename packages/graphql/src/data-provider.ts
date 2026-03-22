import type { DataProvider } from '@svadmin/core';
import { GraphQLClient } from 'graphql-request';

export interface GraphQLDataProviderOptions {
  client: GraphQLClient;
}

/**
 * Creates a generic GraphQL DataProvider.
 * Requires queries to be passed in hooks via the `meta.query` property.
 */
export function createGraphQLDataProvider(options: GraphQLDataProviderOptions): DataProvider {
  const { client } = options;

  return {
    getApiUrl: () => 'graphql',

    getList: async ({ resource, pagination, sorters, filters, meta }) => {
      if (!meta?.query) {
        throw new Error(`[svadmin/graphql] getList requires 'meta.query' providing the GraphQL query for resource '${resource}'`);
      }

      const metaVars = (meta.variables as Record<string, unknown>) || {};
      const variables = {
        ...metaVars,
        limit: pagination?.pageSize,
        offset: pagination && pagination.current && pagination.pageSize ? (pagination.current - 1) * pagination.pageSize : undefined,
      };

      const response = await client.request<{ data: any[], total?: number }>(meta.query as any, variables);
      
      return {
        data: response.data || [],
        total: response.total || 0,
      };
    },

    getOne: async ({ resource, id, meta }) => {
      if (!meta?.query) {
        throw new Error(`[svadmin/graphql] getOne requires 'meta.query' providing the GraphQL query for resource '${resource}'`);
      }

      const metaVars = (meta.variables as Record<string, unknown>) || {};
      const variables = { id, ...metaVars };
      const response = await client.request<{ data: any }>(meta.query as any, variables);

      return {
        data: response.data,
      };
    },

    create: async ({ resource, variables, meta }) => {
      if (!meta?.query) {
        throw new Error(`[svadmin/graphql] create requires 'meta.query' providing the GraphQL mutation`);
      }

      const metaVars = (meta.variables as Record<string, unknown>) || {};
      const response = await client.request<{ data: any }>(meta.query as any, { ...variables, ...metaVars });
      return { data: response.data };
    },

    update: async ({ resource, id, variables, meta }) => {
      if (!meta?.query) {
        throw new Error(`[svadmin/graphql] update requires 'meta.query' providing the GraphQL mutation`);
      }

      const metaVars = (meta.variables as Record<string, unknown>) || {};
      const mutationVars = { id, ...variables, ...metaVars };
      const response = await client.request<{ data: any }>(meta.query as any, mutationVars);
      return { data: response.data };
    },

    deleteOne: async ({ resource, id, meta }) => {
      if (!meta?.query) {
        throw new Error(`[svadmin/graphql] deleteOne requires 'meta.query' providing the GraphQL mutation`);
      }

      const metaVars = (meta.variables as Record<string, unknown>) || {};
      const variables = { id, ...metaVars };
      const response = await client.request<{ data: any }>(meta.query as any, variables);
      return { data: response.data };
    },

    custom: async ({ url, method, filters, sorters, payload, headers, meta }) => {
      if (!meta?.query) {
        throw new Error(`[svadmin/graphql] custom requires 'meta.query' providing the GraphQL query/mutation`);
      }
      const response = await client.request<any>(meta.query as any, payload as any, headers as any);
      return { data: response };
    }
  };
}
