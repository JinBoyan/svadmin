export const keys = () => {
  let _dataProviderName: string | undefined = undefined;
  let _resource = '';
  let _action = '';
  let _params: unknown = undefined;

  const builder = {
    data: (name: string | undefined) => { _dataProviderName = name; return builder; },
    resource: (name: string) => { _resource = name; return builder; },
    action: (name: string) => { _action = name; return builder; },
    params: (params: unknown) => { _params = params; return builder; },
    get: (): unknown[] => {
      const parts: unknown[] = [_dataProviderName, _resource];
      if (_action) parts.push(_action);
      if (_params !== undefined) parts.push(_params);
      return parts;
    }
  };

  return builder;
};
