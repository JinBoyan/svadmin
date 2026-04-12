import type { Filter } from './types';
import { getRouterProvider } from './context.svelte';

export interface URLState {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Filter[];
}

export function readURLState(): URLState {
  if (typeof window === 'undefined') return {};
  const rp = getRouterProvider();
  if (!rp) return {};

  const { params } = rp.parse();
  const state: URLState = {};

  const page = params['page'];
  if (page) { const n = parseInt(page, 10); if (!isNaN(n) && n > 0) state.page = n; }

  const pageSize = params['pageSize'];
  if (pageSize) { const n = parseInt(pageSize, 10); if (!isNaN(n) && n > 0) state.pageSize = n; }

  const sortField = params['sort'];
  if (sortField) state.sortField = sortField;

  const sortOrder = params['order'];
  if (sortOrder === 'asc' || sortOrder === 'desc') state.sortOrder = sortOrder;

  const search = params['q'];
  if (search) state.search = search;

  const filtersRaw = params['filters'];
  if (filtersRaw) {
    try {
      state.filters = JSON.parse(filtersRaw);
    } catch { /* ignore invalid json */ }
  }

  return state;
}

export function writeURLState(state: URLState): void {
  if (typeof window === 'undefined') return;
  const rp = getRouterProvider();
  if (!rp) return;

  const current = rp.parse();
  const params: Record<string, string> = { ...current.params };

  if ('page' in state) {
    if (state.page && state.page > 1) params['page'] = String(state.page);
    else delete params['page'];
  }

  if ('pageSize' in state) {
    if (state.pageSize && state.pageSize !== 10) params['pageSize'] = String(state.pageSize);
    else delete params['pageSize'];
  }

  if ('sortField' in state) {
    if (state.sortField) params['sort'] = state.sortField;
    else delete params['sort'];
  }

  if ('sortOrder' in state) {
    if (state.sortOrder) params['order'] = state.sortOrder;
    else delete params['order'];
  }

  if ('search' in state) {
    if (state.search) params['q'] = state.search;
    else delete params['q'];
  }

  if ('filters' in state) {
    if (state.filters && state.filters.length > 0) {
      params['filters'] = JSON.stringify(state.filters);
    } else {
      delete params['filters'];
    }
  }

  // Prevent redundant navigation if nothing actually changed
  const qsOld = new URLSearchParams(current.params).toString();
  const qsNew = new URLSearchParams(params).toString();
  
  if (qsOld !== qsNew) {
    rp.go({
      to: current.pathname,
      query: params,
      type: 'replace'
    });
  }
}
