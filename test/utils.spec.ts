import {
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  type FindOptions,
  type Attributes,
} from 'sequelize';
import {populateQueryOptions} from '../src/lib/utils';
import {benchmark, type FindAllArg, from, raw, select, type Context} from '../src/lib/functions';

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: number;
  declare name: string;
  declare email: string;
}

describe('testing populateQueryOptions', () => {
  const args: Array<FindAllArg<User>> = [
    from(User),
    select('name', () => 'id'),
    raw(true),
    benchmark(true),
  ];
  const ctx: Context = {};

  test('should return the correct option object', () => {
    expect(populateQueryOptions<User, FindOptions<Attributes<User>> & {_from: User}>(args)(ctx))
      .toStrictEqual({attributes: ['name', 'id'], raw: true, benchmark: true, _from: User});
  });
});
