import {type InferAttributes, type InferCreationAttributes, Model, ModelStatic} from 'sequelize';
import {getValueFromArgs, populateQueryOptions} from '../src/utils';
import {benchmark, FindAllArg, from, raw, select, type Context} from '../src/functions';

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: number;
  declare name: string;
  declare email: string;
}

describe('testing getValueFromArgs', () => {

  const args: Array<FindAllArg<User>> = [from(User), select('name', () => 'id')];
  const ctx: Context = {};

  test('should return the value from the given name', () => {
    expect(getValueFromArgs<ModelStatic<User>, User>('_select', args)(ctx)).toStrictEqual({attributes: ['name', 'id']});
  });

  test('should return the model object', () => {
    expect(getValueFromArgs<ModelStatic<User>, User>('_from', args)(ctx)).toEqual(User);
  });
});


describe('testing populateQueryOptions', () => {

  const args: Array<FindAllArg<User>> = [from(User), select('name', () => 'id'), raw(true), benchmark(true)];
  const ctx: Context = {};

  test('should return the correct option object', () => {
    expect(populateQueryOptions<ModelStatic<User>, User>(args)(ctx)).toStrictEqual({attributes: ['name', 'id'], raw: true, benchmark: true});
  });

});
