import {console} from 'fp-ts';
import {right} from 'fp-ts/lib/Either';
import {
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  Sequelize,
  DataTypes,
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
  eq,
} from '../src/functions';

const db: Sequelize = new Sequelize('sqlite::memory:', {logging: false});

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: number;
  declare name: string;
  declare email: string;
  // declare createdAt: CreationOptional<Date>;
  // declare updatedAt: CreationOptional<Date>;
}

// const now = new Date();
const records = [
  {
    id: 1,
    name: 'janedoe',
    email: 'janedoe@',
    // createdAt: now,
    // updatedAt: now,
  },
  {
    id: 2,
    name: 'janedoe2',
    email: 'janedoe2@',
    // createdAt: now,
    // updatedAt: now,
  },
  {
    id: 3,
    name: 'janedoe3',
    email: 'janedoe3@',
    // createdAt: now,
    // updatedAt: now,
  },
  {
    id: 4,
    name: 'janedoe',
    email: 'janedoe4@',
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
    expect(await findAll<User>(...args)(ctx)).toEqual(right(recordsWithoutDate));
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
          id: 4,
          name: 'janedoe',
          newid: 4,
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
          sumid: 10,
          name: 'janedoe',
        },
      ]),
    );
  });

  test('should return count of the rows ', async () => {
    expect(await findAll<User>(...args, select(as(count('id'), 'total')))(ctx)).toEqual(
      right([
        {
          total: 4,
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

  test('should return the row with id = 2', async () => {
    expect(await findAll<User>(...args, select('id'), where(eq('id', 2)), limit(1), logging(true))(ctx)).toEqual(
      right([
        {
          id: 2,
        },
      ]),
    );
  });
});
