import fs from 'fs';

let content = fs.readFileSync('packages/core/src/types.ts', 'utf8');

const oldFilter = `export interface Filter {
  field: string;
  operator: CrudOperator;
  value: unknown;
}`;

const newFilter = `export interface FieldFilter {
  field: string;
  operator: CrudOperator;
  value: unknown;
}

export type Filter = FieldFilter | LogicalFilter;`;

content = content.replace(oldFilter, newFilter);

fs.writeFileSync('packages/core/src/types.ts', content);

