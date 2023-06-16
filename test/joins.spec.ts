/* eslint-disable */
import {right} from 'fp-ts/lib/Either';
import {
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  Sequelize,
  DataTypes,
  CreationOptional,
  Association,
  ForeignKey,
  NonAttribute,
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
  asc,
  desc,
  model,
  nest,
  joinAlias,
  join,
  innerJoin,
  rightJoin,
  order
} from '../src/lib/functions';
/* eslint-enable */

const db: Sequelize = new Sequelize('sqlite::memory:', {logging: false});

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: number;
  declare name: string;
  declare email: string | null;
  declare flag: boolean | null;
  // declare createdAt: CreationOptional<Date>;
  // declare updatedAt: CreationOptional<Date>;
  declare posts?: NonAttribute<Post[]>;
  declare comments?: NonAttribute<Comment[]>;
  declare static associations: {
    comments: Association<User, Comment>
    posts: Association<User, Post>
  };
}

class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  declare id: number;
  declare title: string;
  declare content: string;
  declare userId: ForeignKey<User['id']>;

  declare static associations: {
    user: Association<Post, User>
    images: Association<User, Image>
  };
}

class Comment extends Model<InferAttributes<Comment>, InferCreationAttributes<Comment>> {
  declare id: number;
  declare comment: string;
  // declare userId: ForeignKey<User['id']>;
  // declare postId: ForeignKey<Post['id']>;
}

class Image extends Model<InferAttributes<Image>, InferCreationAttributes<Image>> {
  declare id: number;
  declare path: string;
  // declare postId: ForeignKey<Post['id']>;
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

Post.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    title: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
    content: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
    // userId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
  },
  {
    tableName: 'posts',
    sequelize: db,
    timestamps: false,
  },
);
Comment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    comment: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
    // userId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
    // postId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
  },
  {
    tableName: 'comments',
    sequelize: db,
    timestamps: false,
  },
);
Image.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    path: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
    // postId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    // },
  },
  {
    tableName: 'images',
    sequelize: db,
    timestamps: false,
  },
);

User.hasMany(Post, {
  sourceKey: 'id',
  foreignKey: 'userId',
  as: 'posts',
});

User.hasMany(Comment, {
  sourceKey: 'id',
  foreignKey: 'userId',
  as: 'comments',
});

Post.hasMany(Image, {
  sourceKey: 'id',
  foreignKey: 'postId',
  as: 'images',
});

// Post.belongsTo(User, {targetKey: 'id'});
// Comment.belongsTo(User, {targetKey: 'id'});
// Image.belongsTo(Post, {targetKey: 'id'});
// User.hasOne(Address, { sourceKey: 'id' });

const posts = [
  {
    id: 1,
    title: 'post 1',
    content: 'post 1 content',
    userId: 1,
  },
  {
    id: 2,
    title: 'post 2',
    content: 'post 2 content',
    userId: 1,
  },
  {
    id: 3,
    title: 'post 3',
    content: 'post 3 content',
    userId: 2,
  },
];

const comments = [
  {
    id: 1,
    comment: 'comment 1 post 3 user 1',
    postId: 3,
    userId: 1,
  },
  {
    id: 2,
    comment: 'comment 2 post 1 user 1',
    postId: 1,
    userId: 1,
  },
  {
    id: 3,
    comment: 'comment 3 post 2 user 2',
    postId: 2,
    userId: 2,
  },
];

const images = [
  {
    id: 1,
    path: 'image 1 pah',
    postId: 3,
  },
  {
    id: 2,
    path: 'image 2 path',
    postId: 3,
  },
  {
    id: 3,
    path: 'image 3 path',
    postId: 1,
  },
];

const ctx: Context = {};

describe('testing joins', () => {
  beforeAll(async () => {
    try {
      await db.sync();
      await User.bulkCreate(records);
      await Post.bulkCreate(posts);
      await Comment.bulkCreate(comments);
      await Image.bulkCreate(images);
    } catch (e) {
      console.log(e);
    }
  });

  afterAll(async () => {
    await db.close();
  });

  test('should return the user left outer joined with posts', async () => {
    const res = await findAll<User>(
      from(User), raw(true), nest(true),
      join(model(Post), joinAlias('posts')),
      asc('id'),
      // logging(true),
    )(ctx);

    expect(res).toEqual(right([
      {
        email: 'janedoe@',
        flag: 1,
        id: 1,
        name: 'janedoe',
        posts: {
          content: 'post 1 content',
          id: 1,
          title: 'post 1',
          userId: 1,
        },
      },
      {
        email: 'janedoe@',
        flag: 1,
        id: 1,
        name: 'janedoe',
        posts: {
          content: 'post 2 content',
          id: 2,
          title: 'post 2',
          userId: 1,
        },
      },
      {
        email: 'janedoe2@',
        flag: 0,
        id: 2,
        name: 'janedoe2',
        posts: {
          content: 'post 3 content',
          id: 3,
          title: 'post 3',
          userId: 2,
        },
      },
      {
        email: 'janedoe3@',
        flag: 0,
        id: 3,
        name: 'janedoe3',
        posts: {
          content: null,
          id: null,
          title: null,
          userId: null,
        },
      },
      {
        email: 'janedoe4@',
        flag: 0,
        id: 4,
        name: 'janedoe',
        posts: {
          content: null,
          id: null,
          title: null,
          userId: null,
        },
      },
      {
        email: null,
        flag: 0,
        id: 5,
        name: 'janedoe5',
        posts: {
          content: null,
          id: null,
          title: null,
          userId: null,
        },
      },
    ]));
  });

  test('should return the user inner joined with posts', async () => {
    const res = await findAll<User>(
      from(User),
      raw(true),
      nest(true),
      innerJoin(model(Post), joinAlias('posts')),
      asc('id'),
      // logging(true),
    )(ctx);

    expect(res).toEqual(right([
      {
        email: 'janedoe@',
        flag: 1,
        id: 1,
        name: 'janedoe',
        posts: {
          content: 'post 1 content',
          id: 1,
          title: 'post 1',
          userId: 1,
        },
      },
      {
        email: 'janedoe@',
        flag: 1,
        id: 1,
        name: 'janedoe',
        posts: {
          content: 'post 2 content',
          id: 2,
          title: 'post 2',
          userId: 1,
        },
      },
      {
        email: 'janedoe2@',
        flag: 0,
        id: 2,
        name: 'janedoe2',
        posts: {
          content: 'post 3 content',
          id: 3,
          title: 'post 3',
          userId: 2,
        },
      },
    ]));
  });

  test('should return user inner joined with posts inner joined with their images', async () => {
    const res = await findAll<User>(
      from(User), nest(true),
      innerJoin(
        model(Post),
        joinAlias('posts'),
        innerJoin(
          model(Image),
          joinAlias('images'),
        ),
      ),
      asc('id'),
      // logging(true),
    )(ctx);
    expect(res._tag).toEqual('Right');
    if (res._tag === 'Right') {
      expect(res.right.map((user) => {
        return user.get({plain: true});
      })).toEqual([
        {
          email: 'janedoe@',
          flag: true,
          id: 1,
          name: 'janedoe',
          posts: [
            {
              content: 'post 1 content',
              id: 1,
              images: [
                {
                  id: 3,
                  path: 'image 3 path',
                  postId: 1,
                },
              ],
              title: 'post 1',
              userId: 1,
            },
          ],
        },
        {
          email: 'janedoe2@',
          flag: false,
          id: 2,
          name: 'janedoe2',
          posts: [
            {
              content: 'post 3 content',
              id: 3,
              images: [
                {
                  id: 1,
                  path: 'image 1 pah',
                  postId: 3,
                },
                {
                  id: 2,
                  path: 'image 2 path',
                  postId: 3,
                },
              ],
              title: 'post 3',
              userId: 2,
            },
          ],
        },
      ],
      );
    }
  });

  test('should return users with posts with their path of images', async () => {
    const res = await findAll<User>(
      from(User), nest(true),
      innerJoin(
        model(Post),
        joinAlias('posts'),
        innerJoin(
          model(Image),
          joinAlias('images'),
          select<Image>('path'),
        ),
      ),
      asc('id'),
      // logging(true),
    )(ctx);
    expect(res._tag).toEqual('Right');
    if (res._tag === 'Right') {
      expect(res.right.map((user) => {
        return user.get({plain: true});
      })).toEqual([
        {
          email: 'janedoe@',
          flag: true,
          id: 1,
          name: 'janedoe',
          posts: [
            {
              content: 'post 1 content',
              id: 1,
              images: [
                {
                  path: 'image 3 path',
                },
              ],
              title: 'post 1',
              userId: 1,
            },
          ],
        },
        {
          email: 'janedoe2@',
          flag: false,
          id: 2,
          name: 'janedoe2',
          posts: [
            {
              content: 'post 3 content',
              id: 3,
              images: [
                {
                  path: 'image 1 pah',
                },
                {
                  path: 'image 2 path',
                },
              ],
              title: 'post 3',
              userId: 2,
            },
          ],
        },
      ],
      );
    }
  });

  // test('should return the user right joined with posts', async () => {
  //   const res = await findAll<User>(
  //     from(User),
  //     raw(true),
  //     nest(true),
  //     rightJoin(model(Post), joinAlias('posts')),
  //     asc('id'),
  //     logging(true),
  //   )(ctx);

  //   expect(res).toEqual(right();
  // });
});
