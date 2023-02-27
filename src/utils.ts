/* eslint-disable */
import type {FindOptions, Transactionable, Attributes, Model, LOCK, IncludeOptions, ModelStatic} from 'sequelize';
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

export function isConstructor (f: any): boolean {
  try {
    Reflect.construct(String, [], f);
  } catch (e) {
    return false;
  }
  return true;
}

export function populateQueryOptions<TAttributes, M extends Model> (
  args: Array<FindAllArg<M>>,
): (ctx?: Context) => FindOptions<TAttributes> {
  return function (ctx?: Context): FindOptions<TAttributes> {
    const options: FindOptions = {};
    // todo: add about transaction in docs
    if (ctx != null) {
      options.transaction = ctx.transaction;
    }
    const values = args.map((arg: FindAllArg<M>) => {
      if (!isConstructor(arg) && typeof arg === 'function') {
        return arg(ctx);
      } else {
        return arg;
      }
    });
    const includes: IncludeOptions[] = [];
    console.log({acccccccccccc: JSON.stringify(values)});
    values.filter((val) => '_join' in val).forEach((val) => {
      if ('_join' in val && Array.isArray(val._join)) {
        val._join.forEach((join) => {
          includes.push(join);
        });
        // delete val._join;
      }
    });
    const result: FindOptions = values.reduce((acc: object, val: any) => {
      if (typeof val === 'object' && val != null) {
        return merge(acc, val);
      }
      return acc;
    }, {});

    console.log({result: JSON.stringify(result), incs: JSON.stringify(includes)});
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
