import {console} from 'fp-ts';
import {right} from 'fp-ts/lib/Either';
import {
  type InferAttributes,
  type CreationOptional,
  type InferCreationAttributes,
  Model,
  Sequelize,
  DataTypes,
} from 'sequelize';
import {type Context, findAll, type FindAllArg, from, raw, select} from '../src/functions';

const op1 = (x: string): object =>
  function _op1() {
    return {
      option1: x,
    };
  };
const op2 = (x: number): object =>
  function _op2() {
    return {
      option2: x,
    };
  };

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
});
