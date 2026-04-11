import fs from 'fs';

let content = fs.readFileSync('packages/core/src/query-hooks.svelte.ts', 'utf8');

// Ensure reactivity type definition is available
if (!content.includes('type MaybeGetter<T> = T | (() => T);')) {
  content = content.replace("export interface UseListOptions", "export type MaybeGetter<T> = T | (() => T);\n\nexport interface UseListOptions");
}

// ─── useList Replace ───
const oldUseList = `export function useList<TData extends BaseRecord = BaseRecord, TError = HttpError>(options: UseListOptions<TData, TError> = {}) {
  const parsed = useParsed();
  const resource = options.resource ?? parsed.resource ?? '';
  const adminOptions = getAdminOptions();
  const provider = getDataProviderForResource(resource, options.dataProviderName);

  const queryOptions = options.queryOptions;

  const query = createQuery<GetListResult<TData>, TError>(() => ({
    queryKey: [resource, 'list', options.pagination, options.sorters, options.filters, options.meta],
    queryFn: async () => {
      const result = await provider.getList<TData>({
        resource,
        pagination: options.pagination,
        sorters: options.sorters,
        filters: options.filters,
        meta: options.meta,
      });
      return result;
    },
    enabled: queryOptions?.enabled ?? true,
    staleTime: queryOptions?.staleTime ?? adminOptions.reactQuery?.staleTime,
    gcTime: queryOptions?.gcTime ?? adminOptions.reactQuery?.gcTime,
    refetchOnWindowFocus: queryOptions?.refetchOnWindowFocus ?? adminOptions.reactQuery?.refetchOnWindowFocus,
  }));

  const overtime = createOvertimeTracker(() => query.isLoading, options.overtimeOptions ?? adminOptions.overtime);

  createLiveSubscription((): LiveSubscriptionParams => ({
    resource,
    liveProvider: getLiveProvider(),
    liveMode: options.liveMode ?? adminOptions.liveMode,
    onLiveEvent: (e: LiveEvent) => {
      options.onLiveEvent?.(e);
      adminOptions.onLiveEvent?.(e);
    },
    liveParams: options.liveParams,
    enabled: queryOptions?.enabled ?? true,
  }));

  $effect(() => {
    if (query.isSuccess && options.successNotification) {
      fireSuccessNotification(options.successNotification, '', query.data, undefined, resource);
    } else if (query.isError) {
      fireErrorNotification(options.errorNotification, 'Fetch failed', query.error);
    }
  });

  return extendQuery(query, () => ({ overtime }));
}`;

const newUseList = `export function useList<TData extends BaseRecord = BaseRecord, TError = HttpError>(optionsOrGetter: MaybeGetter<UseListOptions<TData, TError>> = {}) {
  const parsed = useParsed();
  const adminOptions = getAdminOptions();
  
  const getOptions = () => typeof optionsOrGetter === 'function' ? optionsOrGetter() : optionsOrGetter;
  const getResource = () => getOptions().resource ?? parsed.resource ?? '';

  const query = createQuery<GetListResult<TData>, TError>(() => {
    const opts = getOptions();
    const resource = getResource();
    const provider = getDataProviderForResource(resource, opts.dataProviderName);
    const queryOptions = opts.queryOptions;
    
    return {
      queryKey: [resource, 'list', opts.pagination, opts.sorters, opts.filters, opts.meta],
      queryFn: async () => provider.getList<TData>({
        resource,
        pagination: opts.pagination,
        sorters: opts.sorters,
        filters: opts.filters,
        meta: opts.meta,
      }),
      enabled: queryOptions?.enabled ?? true,
      staleTime: queryOptions?.staleTime ?? adminOptions.reactQuery?.staleTime,
      gcTime: queryOptions?.gcTime ?? adminOptions.reactQuery?.gcTime,
      refetchOnWindowFocus: queryOptions?.refetchOnWindowFocus ?? adminOptions.reactQuery?.refetchOnWindowFocus,
    };
  });

  const overtime = createOvertimeTracker(() => query.isLoading, typeof optionsOrGetter === 'function' ? optionsOrGetter().overtimeOptions : optionsOrGetter.overtimeOptions ?? adminOptions.overtime);

  createLiveSubscription((): LiveSubscriptionParams => {
    const opts = getOptions();
    return {
      resource: getResource(),
      liveProvider: getLiveProvider(),
      liveMode: opts.liveMode ?? adminOptions.liveMode,
      onLiveEvent: (e: LiveEvent) => {
        opts.onLiveEvent?.(e);
        adminOptions.onLiveEvent?.(e);
      },
      liveParams: opts.liveParams,
      enabled: opts.queryOptions?.enabled ?? true,
    };
  });

  $effect(() => {
    const opts = getOptions();
    if (query.isSuccess && opts.successNotification) {
      fireSuccessNotification(opts.successNotification, '', query.data, undefined, getResource());
    } else if (query.isError) {
      fireErrorNotification(opts.errorNotification, 'Fetch failed', query.error);
    }
  });

  return extendQuery(query, () => ({ overtime }));
}`;

content = content.replace(oldUseList, newUseList);


// ─── useOne Replace ───
const oldUseOne = `export function useOne<TData extends BaseRecord = BaseRecord, TError = HttpError>(options: UseOneOptions<TData, TError> = {}) {
  const parsed = useParsed();
  const resource = options.resource ?? parsed.resource ?? '';
  const id = options.id ?? parsed.id;
  const adminOptions = getAdminOptions();
  const provider = getDataProviderForResource(resource, options.dataProviderName);

  const queryOptions = options.queryOptions;

  const query = createQuery<GetOneResult<TData>, TError>(() => ({
    queryKey: [resource, 'one', id, options.meta],
    queryFn: async () => {
      if (id == null) throw new Error('useOne requires an id');
      const result = await provider.getOne<TData>({
        resource,
        id,
        meta: options.meta,
      });
      return result;
    },
    enabled: (queryOptions?.enabled ?? true) && id != null,
    staleTime: queryOptions?.staleTime ?? adminOptions.reactQuery?.staleTime,
    gcTime: queryOptions?.gcTime ?? adminOptions.reactQuery?.gcTime,
  }));

  const overtime = createOvertimeTracker(() => query.isLoading, options.overtimeOptions ?? adminOptions.overtime);

  $effect(() => {
    if (query.isSuccess && options.successNotification) {
      fireSuccessNotification(options.successNotification, '', query.data, undefined, resource);
    } else if (query.isError) {
      fireErrorNotification(options.errorNotification, 'Fetch failed', query.error);
    }
  });

  return extendQuery(query, () => ({ overtime }));
}`;

const newUseOne = `export function useOne<TData extends BaseRecord = BaseRecord, TError = HttpError>(optionsOrGetter: MaybeGetter<UseOneOptions<TData, TError>> = {}) {
  const parsed = useParsed();
  const adminOptions = getAdminOptions();
  
  const getOptions = () => typeof optionsOrGetter === 'function' ? optionsOrGetter() : optionsOrGetter;
  const getResource = () => getOptions().resource ?? parsed.resource ?? '';
  const getId = () => getOptions().id ?? parsed.id;

  const query = createQuery<GetOneResult<TData>, TError>(() => {
    const opts = getOptions();
    const resource = getResource();
    const id = getId();
    const provider = getDataProviderForResource(resource, opts.dataProviderName);
    const queryOptions = opts.queryOptions;

    return {
      queryKey: [resource, 'one', id, opts.meta],
      queryFn: async () => {
        if (id == null) throw new Error('useOne requires an id');
        const result = await provider.getOne<TData>({
          resource,
          id,
          meta: opts.meta,
        });
        return result;
      },
      enabled: (queryOptions?.enabled ?? true) && id != null,
      staleTime: queryOptions?.staleTime ?? adminOptions.reactQuery?.staleTime,
      gcTime: queryOptions?.gcTime ?? adminOptions.reactQuery?.gcTime,
      refetchOnWindowFocus: queryOptions?.refetchOnWindowFocus ?? adminOptions.reactQuery?.refetchOnWindowFocus,
    };
  });

  const overtime = createOvertimeTracker(() => query.isLoading, typeof optionsOrGetter === 'function' ? optionsOrGetter().overtimeOptions : optionsOrGetter.overtimeOptions ?? adminOptions.overtime);

  $effect(() => {
    const opts = getOptions();
    if (query.isSuccess && opts.successNotification) {
      fireSuccessNotification(opts.successNotification, '', query.data, undefined, getResource());
    } else if (query.isError) {
      fireErrorNotification(opts.errorNotification, 'Fetch failed', query.error);
    }
  });

  return extendQuery(query, () => ({ overtime }));
}`;

content = content.replace(oldUseOne, newUseOne);


// ─── useShow Replace ───
const oldUseShow = `export function useShow<TData extends BaseRecord = BaseRecord, TError = HttpError>(
  options: UseOneOptions<TData, TError> = {}
) {
  const parsed = useParsed();
  let showId = $state<string | number | undefined>(options.id ?? parsed.id);

  function setShowId(id: string | number) { showId = id; }

  const result = useOne<TData, TError>({
    ...options,
    get id() { return showId; },
  });

  return extendQuery(result, () => ({ showId, setShowId }));
}`;

const newUseShow = `export function useShow<TData extends BaseRecord = BaseRecord, TError = HttpError>(
  optionsOrGetter: MaybeGetter<UseOneOptions<TData, TError>> = {}
) {
  const parsed = useParsed();
  const getOptions = () => typeof optionsOrGetter === 'function' ? optionsOrGetter() : optionsOrGetter;
  
  let _showId = $state<string | number | undefined>(undefined);
  
  // showId prioritizes explicit setShowId, then options.id, then URL id.
  const showId = $derived(_showId ?? getOptions().id ?? parsed.id);

  function setShowId(id: string | number) { _showId = id; }

  // We wrap it in a getter so useOne evaluates it dynamically.
  const result = useOne<TData, TError>(() => ({
    ...getOptions(),
    id: showId,
  }));

  return extendQuery(result, () => ({ showId, setShowId }));
}`;

content = content.replace(oldUseShow, newUseShow);


// ─── useMany Replace ───
const oldUseMany = `export function useMany<TData extends BaseRecord = BaseRecord, TError = HttpError>(options: UseManyOptions<TData, TError>) {
  const { resource, ids, meta, dataProviderName, queryOptions } = options;
  const adminOptions = getAdminOptions();
  const provider = getDataProviderForResource(resource, dataProviderName);

  const query = createQuery<GetManyResult<TData>, TError>(() => ({
    queryKey: [resource, 'many', ids, meta],
    queryFn: async () => {
      if (!ids.length) return { data: [] };
      if (provider.getMany) {
        return provider.getMany<TData>({ resource, ids, meta });
      }
      const results = await Promise.all(ids.map(id => provider.getOne<TData>({ resource, id, meta })));
      return { data: results.map(r => r.data) };
    },
    enabled: (queryOptions?.enabled ?? true) && ids.length > 0,
    staleTime: queryOptions?.staleTime ?? adminOptions.reactQuery?.staleTime,
  }));

  const overtime = createOvertimeTracker(() => query.isLoading, options.overtimeOptions ?? adminOptions.overtime);

  $effect(() => {
    if (query.isSuccess && options.successNotification) fireSuccessNotification(options.successNotification, '', query.data, undefined, resource);
    else if (query.isError) fireErrorNotification(options.errorNotification, 'Fetch failed', query.error);
  });

  return extendQuery(query, () => ({ overtime }));
}`;

const newUseMany = `export function useMany<TData extends BaseRecord = BaseRecord, TError = HttpError>(optionsOrGetter: MaybeGetter<UseManyOptions<TData, TError>>) {
  const adminOptions = getAdminOptions();
  const getOptions = () => typeof optionsOrGetter === 'function' ? optionsOrGetter() : optionsOrGetter;

  const query = createQuery<GetManyResult<TData>, TError>(() => {
    const opts = getOptions();
    const { resource, ids, meta, dataProviderName, queryOptions } = opts;
    const provider = getDataProviderForResource(resource, dataProviderName);

    return {
      queryKey: [resource, 'many', ids, meta],
      queryFn: async () => {
        if (!ids.length) return { data: [] };
        if (provider.getMany) {
          return provider.getMany<TData>({ resource, ids, meta });
        }
        const results = await Promise.all(ids.map(id => provider.getOne<TData>({ resource, id, meta })));
        return { data: results.map(r => r.data) };
      },
      enabled: (queryOptions?.enabled ?? true) && ids.length > 0,
      staleTime: queryOptions?.staleTime ?? adminOptions.reactQuery?.staleTime,
      gcTime: queryOptions?.gcTime ?? adminOptions.reactQuery?.gcTime,
      refetchOnWindowFocus: queryOptions?.refetchOnWindowFocus ?? adminOptions.reactQuery?.refetchOnWindowFocus,
    };
  });

  const overtime = createOvertimeTracker(() => query.isLoading, typeof optionsOrGetter === 'function' ? optionsOrGetter().overtimeOptions : optionsOrGetter.overtimeOptions ?? adminOptions.overtime);

  $effect(() => {
    const opts = getOptions();
    if (query.isSuccess && opts.successNotification) fireSuccessNotification(opts.successNotification, '', query.data, undefined, opts.resource);
    else if (query.isError) fireErrorNotification(opts.errorNotification, 'Fetch failed', query.error);
  });

  return extendQuery(query, () => ({ overtime }));
}`;

content = content.replace(oldUseMany, newUseMany);

fs.writeFileSync('packages/core/src/query-hooks.svelte.ts', content);

