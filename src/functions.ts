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
  WhereOptions,
  WhereOperators,
  Op,
  type Order,
  type OrderItem,
  type WhereAttributeHashValue,
  WhereAttributeHash,
  WhereGeometryOptions,
  InferAttributes,
  InferCreationAttributes,
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

export function count(col: string): (ctx?: Context) => Fn {
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
export const logging: <M extends Model>(
  arg: BooleanArg,
) => (ctx?: Context) => Pick<FindOptions<Attributes<M>>, 'logging'> = option('logging');
// export const rejectOnEmpty: <M extends Model>() => Pick<FindOptions<Attributes<M>>, 'rejectOnEmpty'> = option('rejectOnEmpty', true);
// export const searchPath: <M extends Model>(path: string) => Pick<FindOptions<Attributes<M>>, 'searchPath'> = optionKey('searchPath');

export const limit: <M extends Model>(arg: NumberArg) => (ctx?: Context) => Pick<FindOptions<Attributes<M>>, 'limit'> =
  option('limit');

export const offset: <M extends Model>(
  arg: NumberArg,
) => (ctx?: Context) => Pick<FindOptions<Attributes<M>>, 'offset'> = option('offset');

/** Query conditions
 * --------------------------------------------------**/

export type WhereArg<M extends Model> = WhereAttributeHash<M> | ((ctx?: Context) => WhereAttributeHash<M>);

export function where<M extends Model>(...args: Array<WhereArg<M>>): (ctx?: Context) => WhereOptions<Attributes<M>> {
  return function _where(ctx?: Context) {
    const criteria = {};
    for (const cond of args) {
      if (typeof cond === 'function') {
        const temp = cond(ctx);
        if (temp != null) {
          Object.assign(criteria, temp);
        }
      }
    }

    // console.log({where: {id: {[Op.eq]: 2}}});
    console.log('where',criteria);
    return {where: criteria};
    // return {where: {id: {[Op.eq]: 2}}};
  };
}

export type WhereValue =
  | string
  | number
  | bigint
  | boolean
  | Date
  | Buffer
  | null
  | WhereAttributeHash<any> // for JSON columns
  | Col // reference another column
  | Fn
  | WhereGeometryOptions;

export type WhereOp = keyof WhereOperators;
export type WhereCol<M extends Model> = keyof Attributes<M>;
export type WhereValArg = WhereValue | ((ctx?: Context) => WhereValue);

// class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
//   declare id: number
//   declare name: string;
//   declare email: string;
// }

export function condition<M extends Model>(
  op: WhereOp,
  col: WhereCol<M>,
  val: WhereValArg,
): (ctx?: Context) => WhereAttributeHash {
  return function _condition(ctx?: Context) {
    if (typeof val === 'function') {
      console.log({[col]: {[op]: val(ctx)}});
      return {[col]: {[op]: val(ctx)}};
    } else {
      console.log('condition', {[col]: {[op]: val}});
      return {[col]: {[op]: val}};
    }
  };
}

function is<M extends Model>(col: WhereCol<M>, val: WhereValArg): (ctx?: Context) => WhereAttributeHash {
  return function _is(ctx?: Context) {
    if (typeof val === 'function') {
      return {[col]: val(ctx)};
    } else {
      return {[col]: val};
    }
  };
}

export const isTrue: <M extends Model>(col: WhereCol<M>) => (ctx?: Context) => WhereAttributeHash = (col) =>
  is(col, true);

export const isFalse: <M extends Model>(col: WhereCol<M>) => (ctx?: Context) => WhereAttributeHash = (col) =>
  is(col, false);

export const isNull: <M extends Model>(col: WhereCol<M>) => (ctx?: Context) => WhereAttributeHash = (col) =>
  is(col, null);

export const gt: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.gte, col, val);

export const gte: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.gte, col, val);

export const lt: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.lt, col, val);

export const lte: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.lte, col, val);

export const ne: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.ne, col, val);

export const eq: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.eq, col, val);

export const not: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.not, col, val);

export const notTrue: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => not(col, true);

export const notNull: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => not(col, null);

export const between: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.between, col, val);

export const notBetween: <M extends Model>(
  col: WhereCol<M>,
  val: WhereValue,
) => (ctx?: Context) => WhereAttributeHash = (col, val) => condition(Op.notBetween, col, val);

export const isIn: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.in, col, val);

export const notIn: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.notIn, col, val);

export const like: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.like, col, val);

export const notLike: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.notLike, col, val);

export const iLike: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.iLike, col, val);

export const notILike: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.notILike, col, val);

export const startsWith: <M extends Model>(
  col: WhereCol<M>,
  val: WhereValue,
) => (ctx?: Context) => WhereAttributeHash = (col, val) => condition(Op.startsWith, col, val);

export const endsWith: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.endsWith, col, val);

export const substring: <M extends Model>(
  col: WhereCol<M>,
  val: WhereValue,
) => (ctx?: Context) => WhereAttributeHash = (col, val) => condition(Op.substring, col, val);

export const regexp: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.regexp, col, val);

export const notRegexp: <M extends Model>(
  col: WhereCol<M>,
  val: WhereValue,
) => (ctx?: Context) => WhereAttributeHash = (col, val) => condition(Op.notRegexp, col, val);

export const iRegexp: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.iRegexp, col, val);

export const notIRegexp: <M extends Model>(
  col: WhereCol<M>,
  val: WhereValue,
) => (ctx?: Context) => WhereAttributeHash = (col, val) => condition(Op.notIRegexp, col, val);

export const overlap: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.overlap, col, val);

export const contains: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.contains, col, val);

export const contained: <M extends Model>(
  col: WhereCol<M>,
  val: WhereValue,
) => (ctx?: Context) => WhereAttributeHash = (col, val) => condition(Op.contained, col, val);

export const adjacent: <M extends Model>(col: WhereCol<M>, val: WhereValue) => (ctx?: Context) => WhereAttributeHash = (
  col,
  val,
) => condition(Op.adjacent, col, val);

export const strictLeft: <M extends Model>(
  col: WhereCol<M>,
  val: WhereValue,
) => (ctx?: Context) => WhereAttributeHash = (col, val) => condition(Op.strictLeft, col, val);

export const strictRight: <M extends Model>(
  col: WhereCol<M>,
  val: WhereValue,
) => (ctx?: Context) => WhereAttributeHash = (col, val) => condition(Op.strictRight, col, val);

export const noExtendRight: <M extends Model>(
  col: WhereCol<M>,
  val: WhereValue,
) => (ctx?: Context) => WhereAttributeHash = (col, val) => condition(Op.noExtendRight, col, val);

export const noExtendLeft: <M extends Model>(
  col: WhereCol<M>,
  val: WhereValue,
) => (ctx?: Context) => WhereAttributeHash = (col, val) => condition(Op.noExtendLeft, col, val);

export function and<M extends Model>(...args: Array<WhereArg<M>>): (ctx?: Context) => WhereAttributeHash {
  return function (ctx?: Context): WhereAttributeHash {
    const criteria = {};
    for (const cond of args) {
      if (typeof cond === 'function') {
        const temp = cond(ctx);
        if (temp === undefined) {
          continue;
        }
        Object.assign(criteria, temp);
      }
    }
    return {[Op.and]: criteria};
  };
}

export function or<M extends Model>(...args: Array<WhereArg<M>>): (ctx?: Context) => WhereAttributeHash {
  return function (ctx?): WhereAttributeHash {
    const orOptions = [];
    for (const conditions of args) {
      if (typeof conditions === 'function') {
        const temp = conditions(ctx);
        if (temp !== undefined) {
          orOptions.push(temp);
        }
      }
    }
    return {[Op.or]: orOptions};
  };
}

/** Query order
 * --------------------------------------------------**/

export type OrderArg = OrderItem | ((ctx?: Context) => OrderItem);

export function order(...args: OrderArg[]): (ctx?: Context) => Order {
  return function _order(ctx): Order {
    const values: Order = [];
    for (const arg of args) {
      if (typeof arg === 'function') {
        const temp = arg(ctx);
        if (temp !== undefined) {
          values.push();
        }
      } else {
        values.push(arg);
      }
    }
    return values;
  };
}

export const desc: (...args: OrderArg[]) => (ctx?: Context) => Order = (...args) => order(...args, 'DESC');

export const descNullsFirst: (...args: OrderArg[]) => (ctx?: Context) => Order = (...args) =>
  order(...args, 'DESC nulls first');

export const descNullsLast: (...args: OrderArg[]) => (ctx?: Context) => Order = (...args) =>
  order(...args, 'DESC nulls last');

export const asc: (...args: OrderArg[]) => (ctx?: Context) => Order = (...args) => order(...args, 'ASC');

export const ascNullsFirst: (...args: OrderArg[]) => (ctx?: Context) => Order = (...args) =>
  order(...args, 'ASC nulls first');

export const ascNullsLast: (...args: OrderArg[]) => (ctx?: Context) => Order = (...args) =>
  order(...args, 'ASC nulls last');

/** joins
 * --------------------------------------------------**/

// function joinOn (...args) {
//   return async function (ctx, tableName) {
//     const criteria = {}
//     for (const cond of args) {
//       if (typeof cond === 'function') {
//         const temp = await cond(ctx, tableName)
//         if (temp === undefined) {
//           continue
//         }
//         Object.assign(criteria, temp)
//       }
//     }
//     return {on: criteria}
//   }
// }

// function include (...args) {
//   return async function _include (ctx, tableName) {
//     const relations = []
//     for (const arg of args) {
//       if (typeof arg === 'function') {
//         const value = await arg(ctx, tableName)
//         if (value !== undefined) {
//           relations.push(arg)
//         }
//       }
//     }
//     return {include: relations}
//   }
// }

// function relation (name, ...args) {
//   return async function _relation (ctx, tableName) {
//     // todo fix ctx.app
//     const db = ctx.app.get(optionKeys.db)
//     const relationObject = {model: db.models[name]}
//     for (const arg of args) {
//       if (typeof arg === 'function') {
//         const options = await arg(ctx, tableName)
//         if (options !== undefined) {
//           Object.assign(relationObject, options)
//         }
//       } else if (lodash.isPlainObject(arg)) {
//         Object.assign(relationObject, arg)
//       }
//     }
//     return relationObject
//   }
// }

// transacitons
// group by
// having
// join relations
// count queries
// doc gen for params

/** Query methods
 * --------------------------------------------------**/

type Select = (ctx?: Context) => SelectAttributes;
type From<M extends Model> = (ctx?: Context) => ModelStatic<M>;
type Option<M extends Model> = (ctx?: Context) => Pick<FindOptions<Attributes<M>>, keyof FindOptions<Attributes<M>>>;
type Where<M extends Model> = (ctx?: Context) => WhereOptions<Attributes<M>>;

export type FindAllArg<M extends Model> = Select | From<M> | Option<M> | Where<M>;
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
      console.log({options})
      return right(await model.findAll<M>(options));
    } catch (e: unknown) {
      if (e instanceof Error) {
        return left(e);
      } else {
        return left(new Error('Unknown error'));
      }
    }
  };
}
