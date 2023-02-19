import {Either, left, right, tryCatch} from 'fp-ts/lib/Either';
import type {FindOptions, Transactionable, Attributes, Model, LOCK} from 'sequelize';
import lodash from 'lodash';
import {type Context, type FindAllArg, type FindAllArgReturn} from './functions';

export function getValueFromArgs<T, M extends Model>(
  funcName: string,
  args: Array<FindAllArg<M>>,
): (ctx?: Context) => T {
  const filteredArgs = args.filter((arg) => typeof arg === 'function' && arg.name === funcName);
  if (filteredArgs.length < 1 || typeof filteredArgs[0] !== 'function') {
    throw new Error(`getValueFromArgs invoked without passing '${funcName}' in args.`);
  }

  return function _getValueFromArgs(ctx?: Context): T {
    // TODO improve typing

    return filteredArgs[0](ctx) as T;
  };
}

export function populateQueryOptions<TAttributes, M extends Model>(
  args: Array<FindAllArg<M>>,
): (ctx?: Context) => FindOptions<TAttributes> {
  return function (ctx?: Context): FindOptions<TAttributes> {
    const options: FindOptions = {};
    // todo: add about transaction in docs
    if (ctx != null) {
      options.transaction = ctx.transaction;
    }
    const values: Array<FindAllArgReturn<M>> = args.map((arg: FindAllArg<M>) => {
      if (typeof arg === 'function') {
        return arg(ctx);
      } else {
        return arg;
      }
    });
    const result: FindOptions = values.reduce((acc: object, val: FindAllArgReturn<M>) => {
      if (typeof val === 'object' && val !== null) {
        return lodash.merge(acc, val);
      }
      return acc;
    }, {});
    return result;
  };
}
