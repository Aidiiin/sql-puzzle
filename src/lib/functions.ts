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
  IncludeOptions,
  ModelType,
  GroupOption,
  CountOptions,
} from 'sequelize';
import {Either, right, left, tryCatch} from 'fp-ts/lib/Either.js';
import {isCallable, populateQueryOptions} from './utils.js';
import {Col, Fn, Json, Literal, Primitive, Where as WhereSq} from 'sequelize/types/utils.js';
/* eslint-enable */

export type Context = object & Transactionable;
type StringArg = string | ((ctx?: Context) => string);
type BooleanArg = boolean | ((ctx?: Context) => boolean);
type NumberArg = number | ((ctx?: Context) => number);

type SelectArg = string | ProjectionAlias | ((ctx?: Context)
=> ProjectionAlias) | ((ctx?: Context) => string);

interface SelectAttributes {
  attributes:
  | {
    include?: Array<ProjectionAlias | string>
    exclude?: string[]
  }
  | Array<string | ProjectionAlias>
}

function include (...args: SelectArg[]): (ctx: Context)
=> {include: Array<ProjectionAlias | string>} {
  return function _include (ctx?: Context): {include: Array<ProjectionAlias | string>} {
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

function exclude (...args: StringArg[]): (ctx?: Context) => {exclude: string[]} {
  return function _exclude (ctx?: Context): {exclude: string[]} {
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

export function select2 (includeArg?: Include, excludeArg?: Exclude):
(ctx?: Context) => SelectAttributes {
  if (includeArg == null && excludeArg == null) {
    throw new Error('No arguments passed to the select function.');
  }
  return function _select (ctx?: Context): SelectAttributes {
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

export function select (...args: SelectArg[]): (ctx?: Context) => SelectAttributes {
  if (include == null && exclude == null) {
    throw new Error('No arguments passed to the select function.');
  }
  return function _select (ctx?: Context): SelectAttributes {
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

export function literal (raw: string): Literal {
  return Sequelize.literal(raw);
}

export function fn (functionName: string, col: string, ...args: unknown[]): (ctx?: Context) => Fn {
  return function _fn (ctx?: Context): Fn {
    const functionArgs = [];
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

export function max (col: string): (ctx?: Context) => Fn {
  return fn('max', col);
}

export function min (col: string): (ctx?: Context) => Fn {
  return fn('min', col);
}

export function sum (col: string): (ctx?: Context) => Fn {
  return fn('sum', col);
}

export function count (col: string): (ctx?: Context) => Fn {
  return fn('count', col);
}

export function distinct (col: string): (ctx?: Context) => Fn {
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

export function as (col: AsArg, alias: string): (ctx?: Context) => ProjectionAlias {
  return function _as (ctx?: Context) {
    if (typeof col === 'function') {
      return [col(ctx), alias];
    } else {
      return [col, alias];
    }
  };
}

type FromArg<M extends Model> = ((ctx?: Context) => ModelStatic<M>) | ModelStatic<M>;

export function from<M extends Model> (arg: FromArg<M>): (ctx?: Context)
=> {_from: ModelStatic<M>} {
  return function _from (ctx?: Context): {_from: ModelStatic<M>} {
    if (isCallable(arg) && arg instanceof Function && typeof arg === 'function') {
      return {_from: arg(ctx)};
    } else {
      return {_from: arg as ModelStatic<M>};
    }
  };
}

/** Query options
 * --------------------------------------------------**/
type LockArg = LOCK | ((ctx?: Context) => LOCK);
type OptionArg = BooleanArg | SelectArg | NumberArg | LockArg;

// export type OptionKey<M extends Model> = keyof FindOptions<Attributes<M>> | keyof CountOptions<Attributes<M>>
export type AllOptions<M extends Model> = FindOptions<Attributes<M>> | CountOptions<Attributes<M>>;

export function option<M extends Model> (
  key: keyof FindOptions<Attributes<M>>,
  // val: OptionValue,
): (arg: OptionArg)
  => (ctx?: Context) => Pick<FindOptions<Attributes<M>>, keyof FindOptions<Attributes<M>>> {
  return function (
    arg: OptionArg,
  ): (ctx?: Context) => Pick<FindOptions<Attributes<M>>, keyof FindOptions<Attributes<M>>> {
    return function _option (ctx?: Context):
    Pick<FindOptions<Attributes<M>>, keyof FindOptions<Attributes<M>>> {
      if (typeof arg === 'function') {
        return {[key]: arg(ctx)};
      } else {
        return {[key]: arg};
      }
    };
  };
}

export function countOption<M extends Model> (
  key: keyof CountOptions<Attributes<M>>,
  // val: OptionValue,
): (arg: OptionArg) => (ctx?: Context)
  => Pick<CountOptions<Attributes<M>>, keyof CountOptions<Attributes<M>>> {
  return function (
    arg: OptionArg,
  ): (ctx?: Context) => Pick<CountOptions<Attributes<M>>, keyof CountOptions<Attributes<M>>> {
    return function _option (ctx?: Context):
    Pick<CountOptions<CountOptions<M>>, keyof CountOptions<Attributes<M>>> {
      if (typeof arg === 'function') {
        return {[key]: arg(ctx)};
      } else {
        return {[key]: arg};
      }
    };
  };
}

export const raw: <M extends Model>(arg: BooleanArg)
=> (ctx?: Context) => Pick<FindOptions<Attributes<M>>, 'raw'> =
  option('raw');

export const benchmark: <M extends Model>(
  arg: BooleanArg,
) => (ctx?: Context) => Pick<FindOptions<Attributes<M>>, 'benchmark'> = option('benchmark');

export const skipLocked: <M extends Model>(
  arg: BooleanArg,
) => (ctx?: Context) => Pick<FindOptions<Attributes<M>>, 'skipLocked'> = option('skipLocked');

export const nest: <M extends Model>(arg: BooleanArg)
=> (ctx?: Context) => Pick<FindOptions<Attributes<M>>, 'nest'> =
  option('nest');

export const distinctOpt: <M extends Model>(arg: BooleanArg) => (ctx?: Context)
=> Pick<CountOptions<Attributes<M>>, 'distinct'> = countOption('distinct');

export const paranoid: <M extends Model>(
  arg: BooleanArg,
) => (ctx?: Context) => Pick<FindOptions<Attributes<M>>, 'paranoid'> = option('paranoid');

export const lock: <M extends Model>(arg: LockArg)
=> (ctx?: Context) => Pick<FindOptions<Attributes<M>>, 'lock'> =
  option('lock');

export const logging: <M extends Model>(
  arg: BooleanArg,
) => (ctx?: Context) => Pick<FindOptions<Attributes<M>>, 'logging'> = option('logging');
// export const rejectOnEmpty: <M extends Model>() => Pick<FindOptions<Attributes<M>>, 'rejectOnEmpty'> = option('rejectOnEmpty', true);
// export const searchPath: <M extends Model>(path: string) => Pick<FindOptions<Attributes<M>>, 'searchPath'> = optionKey('searchPath');

export const limit: <M extends Model>(arg: NumberArg)
=> (ctx?: Context) => Pick<FindOptions<Attributes<M>>, 'limit'> =
  option('limit');

export const offset: <M extends Model>(
  arg: NumberArg,
) => (ctx?: Context) => Pick<FindOptions<Attributes<M>>, 'offset'> = option('offset');

/** Query conditions
 * --------------------------------------------------**/

export type WhereArg<M extends Model> =
WhereAttributeHash<M> | ((ctx?: Context) => WhereAttributeHash<M>);

export function where<M extends Model> (...args: Array<WhereArg<M>>):
(ctx?: Context) => WhereOptions<Attributes<M>> {
  return function _where (ctx?: Context) {
    const criteria = {};
    for (const cond of args) {
      if (typeof cond === 'function') {
        const temp = cond(ctx);
        if (temp != null) {
          Object.assign(criteria, temp);
        }
      }
    }

    return {where: criteria};
  };
}

export type WhereOp = keyof WhereOperators;
export type WhereCol<M extends Model> = keyof WhereAttributeHash<Attributes<M>>;

// same as op.ne and Op.not
export type WhereValArgEq<AttributeType> =
  | WhereOperators<AttributeType>[typeof Op.eq]
  | ((ctx?: Context) => WhereOperators<AttributeType>[typeof Op.eq]);
// same as Op.gt, Op.lt, and Op.lte
export type WhereValArgGte<AttributeType> =
  | WhereOperators<AttributeType>[typeof Op.gte]
  | ((ctx?: Context) => WhereOperators<AttributeType>[typeof Op.gte]);
export type WhereValArgIs<AttributeType> =
  | WhereOperators<AttributeType>[typeof Op.is]
  | ((ctx?: Context) => WhereOperators<AttributeType>[typeof Op.is]);
// same as Op.notBetween
export type WhereValArgBetween<AttributeType> =
  | WhereOperators<AttributeType>[typeof Op.between]
  | ((ctx?: Context) => WhereOperators<AttributeType>[typeof Op.between]);
// same as Op.notIn
export type WhereValArgIn<AttributeType> =
  | WhereOperators<AttributeType>[typeof Op.in]
  | ((ctx?: Context) => WhereOperators<AttributeType>[typeof Op.in]);
// same as Op.notLike, Op.ilike, and Op.notIlike
export type WhereValArgLike<AttributeType> =
  | WhereOperators<AttributeType>[typeof Op.like]
  | ((ctx?: Context) => WhereOperators<AttributeType>[typeof Op.like]);
export type WhereValArgOverlap<AttributeType> =
  | WhereOperators<AttributeType>[typeof Op.overlap]
  | ((ctx?: Context) => WhereOperators<AttributeType>[typeof Op.overlap]);
export type WhereValArgContains<AttributeType> =
  | WhereOperators<AttributeType>[typeof Op.contains]
  | ((ctx?: Context) => WhereOperators<AttributeType>[typeof Op.contains]);
export type WhereValArgContained<AttributeType> =
  | WhereOperators<AttributeType>[typeof Op.contained]
  | ((ctx?: Context) => WhereOperators<AttributeType>[typeof Op.contained]);
// same as Op.endsWith and Op.substring
export type WhereValArgStartsWith<AttributeType> =
  | WhereOperators<AttributeType>[typeof Op.startsWith]
  | ((ctx?: Context) => WhereOperators<AttributeType>[typeof Op.startsWith]);
// same as Op.notRegexp and Op.notIRegexp
export type WhereValArgRegexp<AttributeType> =
  | WhereOperators<AttributeType>[typeof Op.regexp]
  | ((ctx?: Context) => WhereOperators<AttributeType>[typeof Op.regexp]);
// same as Op.strictRight, Op.noExtendLeft, Op.noExtendRight, and Op.adjacent
export type WhereValArgStrictLeft<AttributeType> =
  | WhereOperators<AttributeType>[typeof Op.strictLeft]
  | ((ctx?: Context) => WhereOperators<AttributeType>[typeof Op.strictLeft]);

export type WhereValArg<AttrType> =
  | WhereValArgEq<AttrType>
  | WhereValArgGte<AttrType>
  | WhereValArgIs<AttrType>
  | WhereValArgBetween<AttrType>
  | WhereValArgIn<AttrType>
  | WhereValArgLike<AttrType>
  | WhereValArgOverlap<AttrType>
  | WhereValArgContains<AttrType>
  | WhereValArgContained<AttrType>
  | WhereValArgStartsWith<AttrType>
  | WhereValArgRegexp<AttrType>
  | WhereValArgStrictLeft<AttrType>;

export function condition<M extends Model, AttrType = any> (
  op: WhereOp,
  col: WhereCol<M>,
  val: WhereValArg<AttrType>,
): (ctx?: Context) => WhereAttributeHash<Attributes<M>> {
  return function _condition (ctx?: Context): WhereAttributeHash<Attributes<M>> {
    if (typeof val === 'function' && val instanceof Function) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return <WhereAttributeHash<Attributes<M>>>{[col]: {[op]: val(ctx)}};
    } else {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return <WhereAttributeHash<Attributes<M>>>{[col]: {[op]: val}};
    }
  };
}

export const isTrue: <M extends Model>(
  col: WhereCol<M>,
) => <M extends Model>(ctx?: Context)
=> WhereAttributeHash<Attributes<M>> = (col) => condition(Op.is, col, true);

export const isFalse: <M extends Model>(col: WhereCol<M>)
=> (ctx?: Context) => WhereAttributeHash<Attributes<M>> = (
  col,
) => condition(Op.is, col, false);

export const isNull: <M extends Model>(col: WhereCol<M>)
=> (ctx?: Context) => WhereAttributeHash<Attributes<M>> = (
  col,
) => condition(Op.is, col, null);

export const gt: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgGte<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.gt, col, val);

export const gte: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgGte<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.gte, col, val);

export const lt: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgGte<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.lt, col, val);

export const lte: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgGte<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.lte, col, val);

export const ne: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgEq<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.ne, col, val);

export const eq: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgEq<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.eq, col, val);

export const not: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArg<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.not, col, val);

export const notTrue: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgIs<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> = (col, val) => not(col, true);

export const notNull: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgIs<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> = (col, val) => not(col, null);

export const between: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgBetween<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.between, col, val);

export const notBetween: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgBetween<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.notBetween, col, val);

export const isIn: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgIn<AttrType>,
) => (ctx?: Context) => WhereAttributeHash = (col, val) => condition(Op.in, col, val);

export const notIn: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgIn<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.notIn, col, val);

export const like: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgLike<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.like, col, val);

export const notLike: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgLike<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.notLike, col, val);

export const iLike: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgLike<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.iLike, col, val);

export const notILike: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgLike<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.notILike, col, val);

export const startsWith: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgStartsWith<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.startsWith, col, val);

export const endsWith: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgStartsWith<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.endsWith, col, val);

export const substring: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgStartsWith<AttrType>,
) => (ctx?: Context) => WhereAttributeHash = (col, val) => condition(Op.substring, col, val);

export const regexp: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgRegexp<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.regexp, col, val);

export const notRegexp: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgRegexp<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.notRegexp, col, val);

export const iRegexp: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgRegexp<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.iRegexp, col, val);

export const notIRegexp: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgRegexp<AttrType>,
) => (ctx?: Context) => WhereAttributeHash = (col, val) => condition(Op.notIRegexp, col, val);

export const overlap: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgOverlap<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.overlap, col, val);

export function contains<M extends Model, AttrType = any> (
  col: WhereCol<M>,
  val: WhereValArgContains<AttrType>,
): (ctx?: Context) => WhereAttributeHash<Attributes<M>> {
  return function _contains (ctx?: Context): WhereAttributeHash<Attributes<M>> {
    if (typeof val === 'function' && val instanceof Function) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return <WhereAttributeHash<Attributes<M>>>{[col]: {[Op.contains]: val(ctx)}};
    } else {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return <WhereAttributeHash<Attributes<M>>>{[col]: {[Op.contains]: val}};
    }
  };
}

export const contained: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgContained<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.contained, col, val);

export const adjacent: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgStrictLeft<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.adjacent, col, val);

export const strictLeft: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgStrictLeft<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.strictLeft, col, val);

export const strictRight: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgStrictLeft<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.strictRight, col, val);

export const noExtendRight: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgStrictLeft<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.noExtendRight, col, val);

export const noExtendLeft: <M extends Model, AttrType = any>(
  col: WhereCol<M>,
  val: WhereValArgStrictLeft<AttrType>,
) => (ctx?: Context) => WhereAttributeHash<Attributes<M>> =
(col, val) => condition(Op.noExtendLeft, col, val);

export function and<M extends Model> (
  ...args: Array<WhereArg<M>>
): (ctx?: Context) => WhereAttributeHash<Attributes<M>> {
  return function (ctx?: Context): WhereAttributeHash<Attributes<M>> {
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

export function or<M extends Model> (...args: Array<WhereArg<M>>): (ctx?: Context)
=> WhereAttributeHash<Attributes<M>> {
  return function (ctx?): WhereAttributeHash<Attributes<M>> {
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
export interface OrderReturn {
  order: Order[]
}

export function order (...args: OrderArg[]): (ctx?: Context) => OrderReturn {
  return function _order (ctx): OrderReturn {
    const values: Order = [];
    for (const arg of args) {
      if (typeof arg === 'function') {
        const temp = arg(ctx);
        if (temp !== undefined) {
          values.push(temp);
        }
      } else {
        values.push(arg);
      }
    }
    return {order: [values]};
  };
}

export const desc: (...args: OrderArg[])
=> (ctx?: Context) => OrderReturn = (...args) => order(...args, 'DESC');

export const descNullsFirst: (...args: OrderArg[]) => (ctx?: Context) => OrderReturn = (...args) =>
  order(...args, 'DESC nulls first');

export const descNullsLast: (...args: OrderArg[]) => (ctx?: Context) => OrderReturn = (...args) =>
  order(...args, 'DESC nulls last');

export const asc: (...args: OrderArg[])
=> (ctx?: Context) => OrderReturn = (...args) => order(...args, 'ASC');

export const ascNullsFirst: (...args: OrderArg[]) => (ctx?: Context) => OrderReturn = (...args) =>
  order(...args, 'ASC nulls first');

export const ascNullsLast: (...args: OrderArg[]) => (ctx?: Context) => OrderReturn = (...args) =>
  order(...args, 'ASC nulls last');

/** joins
 * --------------------------------------------------**/
export type JoinOptions = Pick<IncludeOptions, 'separate' | 'subQuery' | 'as' | 'right'
| 'required' | 'limit'>;

export function joinOption (
  key: keyof JoinOptions,
): (arg: OptionArg) => (ctx?: Context) => Pick<JoinOptions, keyof JoinOptions> {
  return function (
    arg: OptionArg,
  ): (ctx?: Context) => Pick<JoinOptions, keyof JoinOptions> {
    return function _option (ctx?: Context): Pick<JoinOptions, keyof JoinOptions> {
      if (typeof arg === 'function') {
        return {[key]: arg(ctx)};
      } else {
        return {[key]: arg};
      }
    };
  };
}

export const separate: (arg: BooleanArg) => (ctx?: Context)
=> Pick<JoinOptions, 'separate'> = joinOption('separate');
export const subQuery: (arg: BooleanArg) => (ctx?: Context)
=> Pick<JoinOptions, 'subQuery'> = joinOption('subQuery');
export const joinAlias: (arg: StringArg) => (ctx?: Context)
=> Pick<JoinOptions, 'as'> = joinOption('as');
export const limitJoin: (arg: NumberArg) => (ctx?: Context)
=> Pick<JoinOptions, 'limit'> = joinOption('limit');

export type JoinOptionReturn = (ctx?: Context) => JoinOptions;

export function on<M extends Model> (...args: Array<WhereArg<M>>): (ctx?: Context)
=> WhereOptions<Attributes<M>> {
  return function _on (ctx?: Context) {
    const criteria = {};
    for (const cond of args) {
      if (typeof cond === 'function') {
        const temp = cond(ctx);
        if (temp != null) {
          Object.assign(criteria, temp);
        }
      }
    }
    return {on: criteria};
  };
}

export type ModelArg<M extends Model> = ModelStatic<M> | ((ctx?: Context) => ModelStatic<M>);
export type ModelReturn = Pick<IncludeOptions, 'model' | keyof JoinOptions>;
export type ModelJoin = (ctx?: Context) => ModelReturn;

export function model<M extends Model> (arg: ModelArg<M>): (ctx?: Context) => ModelReturn {
  return function _model (ctx?: Context): ModelReturn {
    if (isCallable(arg) && typeof arg === 'function' && arg instanceof Function) {
      return {model: arg(ctx)};
    } else {
      return {model: arg as ModelStatic<M>};
    }
  };
}

export type JoinArg<M extends Model> = ModelJoin | Where<M> | Select | JoinOptionReturn | Join;
export interface JoinReturn {_join: IncludeOptions[]}
export type Join = (ctx?: Context) => JoinReturn;

export function join<M extends Model> (...args: Array<JoinArg<M>>): (ctx?: Context) => JoinReturn {
  const populateOptions = populateQueryOptions<M, IncludeOptions>(args);
  return function _join (ctx?: Context): JoinReturn {
    const options = populateOptions(ctx);
    return {_join: [options]};
  };
}

export const rightJoin: <M extends Model>(...args: Array<JoinArg<M>>)
=> (ctx?: Context) => JoinReturn = (...args) =>
  join(joinOption('right')(true), joinOption('required')(false), ...args);

export const innerJoin: <M extends Model>(...args: Array<JoinArg<M>>)
=> (ctx?: Context) => JoinReturn = (...args) => join(joinOption('required')(true), ...args);

export type Where<M extends Model> = (ctx?: Context) => WhereOptions<Attributes<M>>;

// TODO: through for joins

/** Group by queries
 * --------------------------------------------------**/

export function having<M extends Model> (...args: Array<WhereArg<M>>):
(ctx?: Context) => WhereOptions<Attributes<M>> {
  return function _having (ctx?: Context) {
    const criteria = {};
    for (const cond of args) {
      if (typeof cond === 'function') {
        const temp = cond(ctx);
        if (temp != null) {
          Object.assign(criteria, temp);
        }
      }
    }
    return {having: criteria};
  };
}

export type GroupByArg = StringArg | Fn | Col | ((ctx?: Context) => Fn | Col);
export interface GroupByReturn {group: Array<StringArg | Fn | Col>}

export function groupBy (...args: GroupByArg[]): (ctx?: Context) => GroupByReturn {
  return function _groupBy (ctx?: Context): GroupByReturn {
    const group: Array<StringArg | Fn | Col> = [];
    for (const arg of args) {
      if (typeof arg === 'function') {
        if (ctx != null) {
          group.push(arg(ctx));
        }
      }
    }

    return {group};
  };
}

/** Query methods
 * --------------------------------------------------**/

export type Select = (ctx?: Context) => SelectAttributes;
export type From<M extends Model> = (ctx?: Context) => {_from: ModelStatic<M>};
export type Option<M extends Model> = (
  ctx?: Context,
) => Pick<FindOptions<Attributes<M>>, keyof FindOptions<Attributes<M>>>;
export type CountOption<M extends Model> = (
  ctx?: Context,
) => Pick<CountOptions<Attributes<M>>, keyof CountOptions<Attributes<M>>>;

export type FindArgOrder = (ctx?: Context) => OrderReturn;

export type FindAllArg<M extends Model> = Select
| From<M>
| Option<M>
| Where<M>
| FindArgOrder
| Join;
export type FindAllArgReturn<M extends Model> = ReturnType<FindAllArg<M>>;

export function findAll<M extends Model> (
  ...args: Array<FindAllArg<M>>
): (ctx?: Context) => Promise<Either<Error, M[]>> {
  const populateOptions = populateQueryOptions<M, FindOptions<Attributes<M>> & {_from: M}>(args);
  return async function _findAllInner (ctx?: Context): Promise<Either<Error, M[]>> {
    try {
      const options = populateOptions(ctx);
      const model: ModelStatic<M> = options._from as unknown as ModelStatic<M>;
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

export function findAndCountAll<M extends Model> (
  ...args: Array<FindAllArg<M>>
): (ctx?: Context) => Promise<Either<Error, {rows: M[], count: number}>> {
  const populateOptions = populateQueryOptions<M, FindOptions<Attributes<M>> & {_from: M}>(args);
  return async function _findAndCountAllInner (ctx?: Context):
  Promise<Either<Error, {rows: M[], count: number}>> {
    try {
      const options = populateOptions(ctx);
      const model: ModelStatic<M> = options._from as unknown as ModelStatic<M>;
      return right(await model.findAndCountAll<M>(options));
    } catch (e: unknown) {
      if (e instanceof Error) {
        return left(e);
      } else {
        return left(new Error('Unknown error'));
      }
    }
  };
}

export function findOne<M extends Model> (
  ...args: Array<FindAllArg<M>>
): (ctx?: Context) => Promise<Either<Error, M>> {
  const populateOptions = populateQueryOptions<M, FindOptions<Attributes<M>> & {_from: M}>(args);
  return async function _findOneInner (ctx?: Context): Promise<Either<Error, M>> {
    try {
      const options = populateOptions(ctx);
      const model: ModelStatic<M> = options._from as unknown as ModelStatic<M>;
      const result = await model.findOne<M>(options);
      if (result != null) {
        return right(result);
      } else {
        return left(new Error('Row not found!'));
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        return left(e);
      } else {
        return left(new Error('Unknown error'));
      }
    }
  };
}

export function aggregate<T, M extends Model> (functionName: string):
(attribute: keyof Attributes<M>, ...args: Array<FindAllArg<M>>)
=> (ctx?: Context) => Promise<Either<Error, T>> {
  return function _aggregate (attribute: keyof Attributes<M>,
    ...args: Array<FindAllArg<M>>): (ctx?: Context)
    => Promise<Either<Error, T>> {
    const populateOptions = populateQueryOptions<M, FindOptions<Attributes<M>> & {_from: M}>(args);
    return async function _aggregateInner (ctx?: Context): Promise<Either<Error, T>> {
      try {
        const options = populateOptions(ctx);
        const model: ModelStatic<M> = options._from as unknown as ModelStatic<M>;
        return right(await model.aggregate<T, M>(attribute, functionName, options));
      } catch (e: unknown) {
        if (e instanceof Error) {
          return left(e);
        } else {
          return left(new Error('Unknown error'));
        }
      }
    };
  };
}

export const aggSum: <T, M extends Model>(attribute:
keyof Attributes<M>, ...args: Array<FindAllArg<M>>)
=> (ctx?: Context) => Promise<Either<Error, T>> = aggregate('sum');

export const aggMax: <T, M extends Model>(attribute:
keyof Attributes<M>, ...args: Array<FindAllArg<M>>)
=> (ctx?: Context) => Promise<Either<Error, T>> = aggregate('max');

export const aggMin: <T, M extends Model>(attribute:
keyof Attributes<M>, ...args: Array<FindAllArg<M>>)
=> (ctx?: Context) => Promise<Either<Error, T>> = aggregate('min');

export type CountRowsArg<M extends Model> = Select
| From<M>
| CountOption<M>
| Where<M>
| FindArgOrder;

export function countRows<M extends Model> (
  ...args: Array<CountRowsArg<M>>
): (ctx?: Context) => Promise<Either<Error, number>> {
  const populateOptions = populateQueryOptions<M, FindOptions<Attributes<M>> & {_from: M}>(args);
  return async function _countInner (ctx?: Context): Promise<Either<Error, number>> {
    try {
      const options = populateOptions(ctx);
      const model: ModelStatic<M> = options._from as unknown as ModelStatic<M>;
      return right(await model.count<M>(options));
    } catch (e: unknown) {
      if (e instanceof Error) {
        return left(e);
      } else {
        return left(new Error('Unknown error'));
      }
    }
  };
}

// export function findOrCreate<M extends Model> (
//   ...args: Array<CountRowsArg<M>>
// ): (ctx?: Context) => Promise<Either<Error, [M, boolean]>> {
//   const getModel = getValueFromArgs<ModelStatic<M>, M>('_from', args);
//   const populateOptions = populateQueryOptions<Attributes<M>, M>(args);
//   return async function _countInner (ctx?: Context): Promise<Either<Error, [M, boolean]>> {
//     try {
//       const model = getModel(ctx);
//       const options = populateOptions(ctx);
//       return right(await model.findOrCreate<M>(options));
//     } catch (e: unknown) {
//       if (e instanceof Error) {
//         return left(e);
//       } else {
//         return left(new Error('Unknown error'));
//       }
//     }
//   };
// }

// doc gen for params

// findCreateFind
// findOrBuild
// findOrCreate
// update
// upsert
