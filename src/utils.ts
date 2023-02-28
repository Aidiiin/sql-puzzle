/* eslint-disable */
import {FindOptions, Transactionable, Attributes, Model, LOCK, IncludeOptions, ModelStatic} from 'sequelize';
import {type Context, type FindAllArg, type FindAllArgReturn} from './functions';
/* eslint-enable */

export function getValueFromArgs<T, M extends Model> (
  funcName: string,
  args: Array<FindAllArg<M>>,
): (ctx?: Context) => T {
  const filteredArgs = args.filter((arg) => typeof arg === 'function' && arg.name === funcName);
  if (filteredArgs.length < 1 || typeof filteredArgs[0] !== 'function') {
    throw new Error(`getValueFromArgs invoked without passing '${funcName}' in args.`);
  }

  return function _getValueFromArgs (ctx?: Context): T {
    // TODO improve typing
    if (typeof filteredArgs[0] === 'function') {
      return filteredArgs[0](ctx) as T;
    } else {
      return null as T;
    }
  };
}

// export function isJustCallable (f: any): boolean {
//   // try {
//   //   Reflect.construct(String, [], f);
//   // } catch (e) {
//   //   return false;
//   // }
//   // return true;
//   if (typeof f !== 'function') {
//     return false;
//   } else if (f.prototype === undefined) {
//     return true;
//   } else {
//     try {
//     } catch (e) {
//       return false;
//     }
//     return true;
//   }
// }

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

// interface ReusableFunction extends Function {
//   __bindedArgs?: any[]
// }

// export function makeReusableFunction (func: ReusableFunction): ReusableFunction {
//   return function _reusableFunction (...args: any[]): any {
//     if (args.length > 0) {
//       const toBindArgs = [];
//       for (const arg of args) {
//         if (typeof arg === 'function' && Array.isArray(arg.__bindedArgs)) {
//           // get bounded args of the function
//           toBindArgs.push(...arg.__bindedArgs);
//         } else {
//           toBindArgs.push(arg);
//         }
//       }

//       const res: ReusableFunction = makeReusableFunction(func.bind(null, ...toBindArgs));
//       res.__bindedArgs = toBindArgs;
//       return res;
//     } else {
//       return func();
//     }
//   };
// }
