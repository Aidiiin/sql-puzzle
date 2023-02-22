/* eslint-disable */
import {right} from 'fp-ts/lib/Either';
import {
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  Sequelize,
  DataTypes,
  CreationOptional,
} from 'sequelize';
import {
  type Context,
  findAll,
  type FindAllArg,
  from,
  raw,
  select,
  as,
  max,
  logging,
  min,
  sum,
  count,
  distinct,
  fn,
  limit,
  offset,
  where,
  isNull,
  isFalse,
  isTrue,
  eq,
  lt,
  lte,
  gt,
  gte,
  ne,
  between,
  notBetween,
  isIn,
  notIn,
  like,
  notLike,
  iLike,
  notILike,
  startsWith,
  endsWith,
  substring,
  regexp,
  notRegexp,
  iRegexp,
  notIRegexp,
  overlap,
  contains,
  contained,
  and,
  or,
  not,
} from '../src/functions';
/* eslint-enable */

const db: Sequelize = new Sequelize('sqlite::memory:', {logging: false});

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: number;
  declare name: string;
  declare email: string | null;
  declare flag: boolean | null;
  // declare createdAt: CreationOptional<Date>;
  // declare updatedAt: CreationOptional<Date>;
}

// const now = new Date();
const records = [
  {
    id: 1,
    name: 'janedoe',
    email: 'janedoe@',
    flag: true,
    // createdAt: now,
    // updatedAt: now,
  },
  {
    id: 2,
    name: 'janedoe2',
    email: 'janedoe2@',
    flag: false,
    // createdAt: now,
    // updatedAt: now,
  },
  {
    id: 3,
    name: 'janedoe3',
    email: 'janedoe3@',
    flag: false,
    // createdAt: now,
    // updatedAt: now,
  },
  {
    id: 4,
    name: 'janedoe',
    email: 'janedoe4@',
    flag: false,
    // createdAt: now,
    // updatedAt: now,
  },
  {
    id: 5,
    name: 'janedoe5',
    email: null,
    flag: false,
    // createdAt: now,
    // updatedAt: now,
  },
];
const recordsWithoutDate = records.map((a) => {
  return {
    name: a.name,
    id: a.id,
    email: a.email,
  };
});

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    name: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
    email: {
      type: new DataTypes.STRING(128),
      allowNull: true,
    },
    flag: {
      type: new DataTypes.BOOLEAN(),
      allowNull: true,
    },
    // createdAt: DataTypes.DATE,
    // updatedAt: DataTypes.DATE,
  },
  {
    tableName: 'users',
    sequelize: db,
    timestamps: false,
  },
);
const args: Array<FindAllArg<User>> = [from(User), raw(true)];

const ctx: Context = {};

describe('testing findAll', () => {
  beforeAll(async () => {
    try {
      await db.sync();
      await User.bulkCreate(records);
    } catch (e) {
      console.log(e);
    }
  });

  afterAll(async () => {
    await db.close();
  });

  test('should return all of the created records', async () => {
    expect(await findAll<User>(from(User), raw(true), select('email', 'id', 'name'))(ctx)).toEqual(
      right(recordsWithoutDate),
    );
  });

  test('should return only selected columns', async () => {
    expect(
      await findAll<User>(
        ...args,
        select('name', () => 'id'),
      )(ctx),
    ).toEqual(
      right(
        recordsWithoutDate.map((a) => {
          return {
            name: a.name,
            id: a.id,
          };
        }),
      ),
    );
  });

  test('should return rows with renamed columns', async () => {
    expect(
      await findAll<User>(
        ...args,
        select('name', () => 'id', as('email', 'email2')),
      )(ctx),
    ).toEqual(
      right(
        recordsWithoutDate.map((a) => {
          return {
            name: a.name,
            id: a.id,
            email2: a.email,
          };
        }),
      ),
    );
  });

  test('should return the row with the max id with an alias', async () => {
    expect(
      await findAll<User>(
        ...args,
        select('name', () => 'id', as(max('id'), 'newid')),
      )(ctx),
    ).toEqual(
      right([
        {
          id: 5,
          name: 'janedoe5',
          newid: 5,
        },
      ]),
    );
  });

  test('should return the row with the min id with an alias', async () => {
    expect(
      await findAll<User>(
        ...args,
        select('name', () => 'id', as(min('id'), 'newid')),
      )(ctx),
    ).toEqual(
      right([
        {
          id: 1,
          name: 'janedoe',
          newid: 1,
        },
      ]),
    );
  });

  test('should return sum of ids', async () => {
    expect(await findAll<User>(...args, select('name', as(sum('id'), 'sumid')))(ctx)).toEqual(
      right([
        {
          sumid: 15,
          name: 'janedoe',
        },
      ]),
    );
  });

  test('should return count of the rows ', async () => {
    expect(await findAll<User>(...args, select(as(count('id'), 'total')))(ctx)).toEqual(
      right([
        {
          total: 5,
        },
      ]),
    );
  });

  test('should return rows with altered names', async () => {
    expect(await findAll<User>(...args, select(as(fn('replace', 'name', 'j', 'm'), 'new_name')))(ctx)).toEqual(
      right([
        {
          new_name: 'manedoe',
        },
        {
          new_name: 'manedoe2',
        },
        {
          new_name: 'manedoe3',
        },
        {
          new_name: 'manedoe',
        },
        {
          new_name: 'manedoe5',
        },
      ]),
    );
  });

  test('should return rows with distinct names', async () => {
    expect(await findAll<User>(...args, select(as(distinct('name'), 'dname')))(ctx)).toEqual(
      right([
        {
          dname: 'janedoe',
        },
        {
          dname: 'janedoe2',
        },
        {
          dname: 'janedoe3',
        },
        {
          dname: 'janedoe5',
        },
      ]),
    );
  });

  test('should return two rows', async () => {
    expect(await findAll<User>(...args, select('id'), limit(2))(ctx)).toEqual(
      right([
        {
          id: 1,
        },
        {
          id: 2,
        },
      ]),
    );
  });

  test('should return the second row', async () => {
    expect(await findAll<User>(...args, select('id'), limit(1), offset(1))(ctx)).toEqual(
      right([
        {
          id: 2,
        },
      ]),
    );
  });

  test('should return the row where flag is true', async () => {
    expect(await findAll<User>(...args, select('id'), where(isTrue('flag')), limit(1))(ctx)).toEqual(
      right([
        {
          id: 1,
        },
      ]),
    );
  });

  test('should return the row where flag is false', async () => {
    expect(await findAll<User>(...args, select('id'), where(isFalse('flag')), limit(1))(ctx)).toEqual(
      right([
        {
          id: 2,
        },
      ]),
    );
  });

  test('should return the row where email is null', async () => {
    expect(await findAll<User>(...args, select('id'), where(isNull('email')), limit(1))(ctx)).toEqual(
      right([
        {
          id: 5,
        },
      ]),
    );
  });

  test('should return the row with id = 2', async () => {
    expect(await findAll<User>(...args, select('id'), where(eq('id', 2)), limit(1))(ctx)).toEqual(
      right([
        {
          id: 2,
        },
      ]),
    );
  });

  test('should return the row where id lt 2', async () => {
    expect(await findAll<User>(...args, select('id'), where(lt('id', 2)), limit(1))(ctx)).toEqual(
      right([
        {
          id: 1,
        },
      ]),
    );
  });

  test('should return the row where id lte 2', async () => {
    expect(await findAll<User>(...args, select('id'), where(lte('id', 2)), limit(2))(ctx)).toEqual(
      right([
        {
          id: 1,
        },
        {
          id: 2,
        },
      ]),
    );
  });

  test('should return the row where id gt 4', async () => {
    expect(await findAll<User>(...args, select('id'), where(gt('id', 4)), limit(1))(ctx)).toEqual(
      right([
        {
          id: 5,
        },
      ]),
    );
  });

  test('should return the row where id gte 5', async () => {
    expect(await findAll<User>(...args, select('id'), where(gte('id', 5)), limit(1))(ctx)).toEqual(
      right([
        {
          id: 5,
        },
      ]),
    );
  });

  test('should return the row where id not equal 1', async () => {
    expect(await findAll<User>(...args, select('id'), where(ne('id', 1)), limit(1))(ctx)).toEqual(
      right([
        {
          id: 2,
        },
      ]),
    );
  });

  test('should return the row where id equal 3', async () => {
    expect(await findAll<User>(...args, select('id'), where(eq('id', 3)), limit(1))(ctx)).toEqual(
      right([
        {
          id: 3,
        },
      ]),
    );
  });

  test('should return the row where id betwee 3 and 5', async () => {
    expect(await findAll<User>(...args, select('id'), where(between('id', [3, 5])), limit(2))(ctx)).toEqual(
      right([
        {
          id: 3,
        },
        {
          id: 4,
        },
      ]),
    );
  });

  test('should return the row where id not betwee 2 and 100', async () => {
    expect(await findAll<User>(...args, select('id'), where(notBetween('id', [2, 100])), limit(2))(ctx)).toEqual(
      right([
        {
          id: 1,
        },
      ]),
    );
  });

  test('should return the row where id in [2, 3]', async () => {
    expect(await findAll<User>(...args, select('id'), where(isIn('id', [2, 3])), limit(2))(ctx)).toEqual(
      right([
        {
          id: 2,
        },
        {
          id: 3,
        },
      ]),
    );
  });

  test('should return the row where id not in [1,3]', async () => {
    expect(await findAll<User>(...args, select('id'), where(notIn('id', [1, 3])), limit(1))(ctx)).toEqual(
      right([
        {
          id: 2,
        },
      ]),
    );
  });

  test('should return the row where name is like janedoe5', async () => {
    expect(await findAll<User>(...args, select('id'), where(like('name', 'janedoe5')), limit(1))(ctx)).toEqual(
      right([
        {
          id: 5,
        },
      ]),
    );
  });

  // test('should return the row where name is ilike janedoe5', async () => {
  //   expect(await findAll<User>(...args, select('id'), where(iLike('name', 'JAnedoe5')), limit(1))(ctx)).toEqual(
  //     right([
  //       {
  //         id: 5,
  //       }
  //     ]),
  //   );
  // });

  test('should return the row where name is notlike janedoe5', async () => {
    expect(await findAll<User>(...args, select('id'), where(notLike('name', 'janedoe5')), limit(1))(ctx)).toEqual(
      right([
        {
          id: 1,
        },
      ]),
    );
  });

  // test('should return the row where name is notILike janedoe5', async () => {
  //   expect(await findAll<User>(...args, select('id'), where(notILike('name', 'Janedoe5')), limit(1))(ctx)).toEqual(
  //     right([
  //       {
  //         id: 1,
  //       }
  //     ]),
  //   );
  // });

  // startsWith,
  // endsWith,
  // substring,
  // regexp,
  // notRegexp,
  // iRegexp,
  // notIRegexp,
  // overlap,
  // contains,
  // contained,

  test('should return the row where id equal 3 and name = janedoe3', async () => {
    expect(
      await findAll<User>(...args, select('id'), where(and(eq('id', 3), eq('name', 'janedoe3'))), limit(1))(ctx),
    ).toEqual(
      right([
        {
          id: 3,
        },
      ]),
    );
  });

  test('should return the row where id equal 3 or name = janedoe2', async () => {
    expect(
      await findAll<User>(
        ...args,
        select('id'),
        where(
          or(
            eq('id', () => 3),
            eq('name', 'janedoe2'),
          ),
        ),
        limit(2),
      )(ctx),
    ).toEqual(
      right([
        {
          id: 2,
        },
        {
          id: 3,
        },
      ]),
    );
  });

  test('should return the row where flas is true and (id equal 3 or name = janedoe2)', async () => {
    expect(
      await findAll<User>(
        ...args,
        select('id'),
        where(
          and(
            isTrue('flag'),
            or(
              eq('id', () => 3),
              eq('name', 'janedoe2'),
            ),
          ),
        ),
        limit(2),
      )(ctx),
    ).toEqual(right([]));
  });

  test('should return the row where flas is true and (id equal 3 or name = janedoe2)', async () => {
    expect(
      await findAll<User>(
        ...args,
        select('id'),
        where(
          and(
            not('flag', () => true),
            or(
              eq('id', () => 3),
              eq('name', 'janedoe2'),
            ),
          ),
        ),
        limit(2),
      )(ctx),
    ).toEqual(
      right([
        {
          id: 2,
        },
        {
          id: 3,
        },
      ]),
    );
  });
});
