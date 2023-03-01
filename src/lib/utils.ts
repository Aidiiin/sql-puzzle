/* eslint-disable */
import {FindOptions, Transactionable, Attributes, Model, LOCK, IncludeOptions, ModelStatic} from 'sequelize';
import {type Context, type FindAllArg, type FindAllArgReturn} from './functions.js';
/* eslint-enable */

/**
 * Used to distinguish between classes and functions.
 * @param f input
 * @returns boolean
 */
export function isCallable (f: any): boolean {
  if (typeof f !== 'function') {
    return false;
  } else if (f.prototype === undefined) { // arrow functinos and class methods doesn't have this property
    return true;
  } else if (Object.getPrototypeOf(f.prototype).constructor === Model) {
    return false;
  } else {
    return true;
  }
}

export function populateQueryOptions<M extends Model, R> (
  args: Array<FindAllArg<M>>,
): (ctx?: Context) => R {
  return function (ctx?: Context): R {
    const options: FindOptions = {};
    // todo: add about transaction in docs
    if (ctx != null) {
      options.transaction = ctx.transaction;
    }
    const values = args.map((arg: FindAllArg<M>) => {
      if (isCallable(arg) && typeof arg === 'function' && arg instanceof Function) {
        return arg(ctx);
      } else {
        return arg;
      }
    });
    const includes: IncludeOptions[] = [];
    values.filter((val) => '_join' in val).forEach((val) => {
      if ('_join' in val && Array.isArray(val._join)) {
        val._join.forEach((join) => {
          includes.push(join);
        });
      }
    });
    const result: any = values.reduce((acc: object, val: any) => {
      if (typeof val === 'object' && val != null) {
        return merge(acc, val);
      }
      return acc;
    }, {});

    if (includes.length > 0) {
      result.include = includes;
    }
    return result;
  };
}

function merge (acc: object, obj: object): object {
  return {...acc, ...obj};
}
