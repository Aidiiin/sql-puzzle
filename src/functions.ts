/* eslint-disable*/
import {
  Model,
  type Attributes,
  type FindOptions,
  type ModelStatic,
  Transaction,
  type LOCK,
  type ProjectionAlias,
  type Transactionable,
  Sequelize,
} from 'sequelize';
import {Either, right, left, tryCatch} from 'fp-ts/lib/Either';
import {getValueFromArgs, populateQueryOptions} from './utils';
import {Col, Fn, Literal, Primitive} from 'sequelize/types/utils';
/* eslint-enable */

// export type Value = string | number | boolean | object;

// export type CFunction = (ctx?: Context) => Value;
export type Context = object & Transactionable;

export type OptionValue = boolean | LOCK | string;

// export type Arg = string | number | boolean | object | ArgFunction;

type StringArg = string | ((ctx?: Context) => string);
type BooleanArg = boolean | ((ctx?: Context) => boolean);
type NumberArg = number | ((ctx?: Context) => number);

type SelectArg = string | ProjectionAlias | ((ctx?: Context) => ProjectionAlias) | ((ctx?: Context) => string);
interface SelectAttributes {
  attributes:
    | {
        include?: Array<ProjectionAlias | string>;
        exclude?: string[];
      }
    | Array<string | ProjectionAlias>;
}

function include(...args: SelectArg[]): (ctx: Context) => {include: Array<ProjectionAlias | string>} {
  return function _include(ctx?: Context): {include: Array<ProjectionAlias | string>} {
    const includedAtts: Array<ProjectionAlias | string> = [];
    for (const arg of args) {
      if (typeof arg === 'function') {
        includedAtts.push(arg(ctx));
      } else {
        includedAtts.push(arg);
      }
    }
    return {include: includedAtts};
  };
}

function exclude(...args: StringArg[]): (ctx?: Context) => {exclude: string[]} {
  return function _exclude(ctx?: Context): {exclude: string[]} {
    const excludedAtts: string[] = [];
    for (const arg of args) {
      if (typeof arg === 'function') {
        excludedAtts.push(arg(ctx));
      } else {
        excludedAtts.push(arg);
      }
    }
    return {exclude: excludedAtts};
  };
}

type Exclude = (ctx?: Context) => {exclude: string[]};
type Include = (ctx?: Context) => {include: Array<ProjectionAlias | string>};

export function select2(includeArg?: Include, excludeArg?: Exclude): (ctx?: Context) => SelectAttributes {
  if (includeArg == null && excludeArg == null) {
    throw new Error('No arguments passed to the select function.');
  }
  return function _select(ctx?: Context): SelectAttributes {
    const result: SelectAttributes = {attributes: {}};
    if (includeArg != null && !(result.attributes instanceof Array)) {
      result.attributes.include = includeArg(ctx).include;
    }

    if (excludeArg != null && !(result.attributes instanceof Array)) {
      result.attributes.exclude = excludeArg(ctx).exclude;
    }
    return result;
  };
}

export function select(...args: SelectArg[]): (ctx?: Context) => SelectAttributes {
  if (include == null && exclude == null) {
    throw new Error('No arguments passed to the select function.');
  }
  return function _select(ctx?: Context): SelectAttributes {
    const attributes: Array<string | ProjectionAlias> = [];
    for (const arg of args) {
      if (typeof arg === 'function') {
        attributes.push(arg(ctx));
      } else {
        attributes.push(arg);
      }
    }
    return {attributes};
  };
}

export function literal(raw: string): Literal {
  return Sequelize.literal(raw);
}

export function fn(functionName: string, col: string, ...args: unknown[]): (ctx?: Context) => Fn {
  return function _fn(ctx?: Context): Fn {
    const functionArgs = [];
    // recursive fn call
    // let col;
    // if (typeof arg2 === 'function') {
    //   col = arg2(ctx);
    // } else {
    // }
    for (const arg of args) {
      if (typeof arg === 'function') {
        functionArgs.push(arg(ctx));
      } else {
        functionArgs.push(arg);
      }
    }
    return Sequelize.fn(functionName, Sequelize.col(col), ...functionArgs);
  };
}

export function max(col: string): (ctx?: Context) => Fn {
  return fn('max', col);
}

export function min(col: string): (ctx?: Context) => Fn {
  return fn('min', col);
}

export function sum(col: string): (ctx?: Context) => Fn {
  return fn('sum', col);
}

export function count(col: string) : (ctx?: Context) => Fn{
  return fn('count', col);
}

export function distinct(col: string): (ctx?: Context) => Fn {
  return fn('distinct', col);
}

export type AsArg =
  | string
  | ((ctx?: Context) => string)
  | Fn
  | Literal
  | Col
  | ((ctx?: Context) => Fn)
  | ((ctx?: Context) => Literal)
  | ((ctx?: Context) => Col);

export function as(col: AsArg, alias: string): (ctx?: Context) => ProjectionAlias {
  return function _as(ctx?: Context) {
    if (typeof col === 'function') {
      return [col(ctx), alias];
    } else {
      return [col, alias];
    }
  };
}

type FromArg<M extends Model> = ((ctx?: Context) => ModelStatic<M>) | ModelStatic<M>;

export function from<M extends Model>(arg: FromArg<M>): (ctx?: Context) => ModelStatic<M> {
  return function _from(ctx?: Context): ModelStatic<M> {
    if (typeof arg === 'function' && arg.constructor != null) {
      return arg as ModelStatic<M>;
    } else if (typeof arg === 'function' && arg instanceof Function) {
      return arg(ctx);
    } else {
      return arg;
    }
  };
}

/** Query options
 * --------------------------------------------------**/
type LockArg = LOCK | ((ctx?: Context) => LOCK);
type OptionArg = BooleanArg | SelectArg | NumberArg | LockArg;

export function option<M extends Model>(
  key: keyof FindOptions<Attributes<M>>,
  // val: OptionValue,
): (arg: OptionArg) => (ctx?: Context) => Pick<FindOptions<Attributes<M>>, keyof FindOptions<Attributes<M>>> {
  return function (
    arg: OptionArg,
  ): (ctx?: Context) => Pick<FindOptions<Attributes<M>>, keyof FindOptions<Attributes<M>>> {
    return function _option(ctx?: Context): Pick<FindOptions<Attributes<M>>, keyof FindOptions<Attributes<M>>> {
      if (typeof arg === 'function') {
        return {[key]: arg(ctx)};
      } else {
        return {[key]: arg};
      }
    };
  };
}

export const raw: <M extends Model>(arg: BooleanArg) => (ctx?: Context) => Pick<FindOptions<Attributes<M>>, 'raw'> =
  option('raw');
export const benchmark: <M extends Model>(
  arg: BooleanArg,
) => (ctx?: Context) => Pick<FindOptions<Attributes<M>>, 'benchmark'> = option('benchmark');
export const skipLocked: <M extends Model>(
  arg: BooleanArg,
) => (ctx?: Context) => Pick<FindOptions<Attributes<M>>, 'skipLocked'> = option('skipLocked');
export const nest: <M extends Model>(arg: BooleanArg) => (ctx?: Context) => Pick<FindOptions<Attributes<M>>, 'nest'> =
  option('nest');
export const paranoid: <M extends Model>(
  arg: BooleanArg,
) => (ctx?: Context) => Pick<FindOptions<Attributes<M>>, 'paranoid'> = option('paranoid');

export const lock: <M extends Model>(arg: LockArg) => (ctx?: Context) => Pick<FindOptions<Attributes<M>>, 'lock'> =
  option('lock');
// export const rejectOnEmpty: <M extends Model>() => Pick<FindOptions<Attributes<M>>, 'rejectOnEmpty'> = option('rejectOnEmpty', true);
// export const logging: <M extends Model>() => Pick<FindOptions<Attributes<M>>, 'logging'> = option('raw', true);
// export const searchPath: <M extends Model>(path: string) => Pick<FindOptions<Attributes<M>>, 'searchPath'> = optionKey('searchPath');

/** Query methods
 * --------------------------------------------------**/

type Select = (ctx?: Context) => SelectAttributes;
type From<M extends Model> = (ctx?: Context) => ModelStatic<M>;
type Option<M extends Model> = (ctx?: Context) => Pick<FindOptions<Attributes<M>>, keyof FindOptions<Attributes<M>>>;

export type FindAllArg<M extends Model> = Select | From<M> | Option<M>;
export type FindAllArgReturn<M extends Model> = ReturnType<FindAllArg<M>>;

export function findAll<M extends Model>(
  ...args: Array<FindAllArg<M>>
): (ctx?: Context) => Promise<Either<Error, M[]>> {
  const getModel = getValueFromArgs<ModelStatic<M>, M>('_from', args);
  const populateOptions = populateQueryOptions<Attributes<M>, M>(args);
  return async function _findAll(ctx?: Context): Promise<Either<Error, M[]>> {
    try {
      const model = getModel(ctx);
      const options = populateOptions(ctx);
      return right(await model.findAll<M>(options));
    } catch (e: unknown) {
      if (e instanceof Error) {
        return left(e);
      } else {
        return left(new Error('Unknown error'));
      }
    }
    // if (!isNil(options.__dynamicOrderMap)) {
    //   const sortKey = lodash.get(req, defaultSortKey);
    //   if (!isNil(sortKey) && !isNil(options.__dynamicOrderMap[sortKey])) {
    //     const orderFunc = options.__dynamicOrderMap[sortKey];
    //     options.order = await orderFunc();
    //   }
    // }
  };
}
