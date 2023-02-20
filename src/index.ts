// export * from 'init';

import {Sequelize, type InferAttributes, type InferCreationAttributes, DataTypes, Model, Op, WhereAttributeHash} from 'sequelize';

// function test() {
//   return async function test2Func() {
//     throw new Error('asd');
//   };
// }

// test()();
void (async () => {
  const db: Sequelize = new Sequelize('sqlite::memory:', {logging: false});

  class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare id: number;
    declare name: string;
    declare email: string;
    // declare createdAt: CreationOptional<Date>;
    // declare updatedAt: CreationOptional<Date>;
  }

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

  await db.sync();
  await User.bulkCreate(records);

  // console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXXXX',{id: {[Op.eq]: 2}});
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const w:WhereAttributeHash<User> = {id: {[Op.eq]: 1}} as WhereAttributeHash<User>;
  console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXXXX',w);
  //    ^? 
  const ress = await User.findAll({where: w, raw: true});
  console.log(ress);
})().then(() => {
  console.log('DONE');
});
