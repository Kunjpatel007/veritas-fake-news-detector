const condition = (op, field, value) => ({ op, field, value });

export const eq = (field, value) => condition('eq', field, value);
export const ne = (field, value) => condition('ne', field, value);
export const gt = (field, value) => condition('gt', field, value);
export const gte = (field, value) => condition('gte', field, value);
export const lt = (field, value) => condition('lt', field, value);
export const lte = (field, value) => condition('lte', field, value);
export const contains = (field, value) => condition('contains', field, value);
export const isIn = (field, value) => condition('in', field, value);
export const and = (...items) => ({ op: 'and', items });
export const or = (...items) => ({ op: 'or', items });