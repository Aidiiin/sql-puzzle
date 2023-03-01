# sql-puzzle (WIP)

sql-puzzle is a higly composable and functional query builder. It is a lightweight wrapper for Sequelize and is written in TypeScript.

## Examples

```typescript
import {
  findAll, 
  where,
  and, 
  not, 
  or, 
  eq, 
  from, 
  select,
  raw, 
  limit, 
  type Context, 
  asc, 
  joinAlias, 
  model, 
  innerJoin, 
  nest,
} from 'sql-puzzle';

// define your models as instructed by Sequelize documents
class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare id: number;
    declare name: string;
    declare email: string;
    declare flag: boolean;
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
}

class Image extends Model<InferAttributes<Image>, InferCreationAttributes<Image>> {
  declare id: number;
  declare path: string;
}

const ctx = {};
const idFromUsers = [from(User), raw(true), select('id')]
await findAll(
  ...idFromUsers,
  limit(3),
  asc('name')
)(ctx);

// build complex conditions
await findAll(
  ...idFromUsers,
  where(
    and(
      not('flag', () => true),
      or(
        eq('id', () => 3),
        eq('name', 'aidin'),
      ),
    ),
  ),
  limit(20)
)(ctx);



// define reusable sql constructs
const fromPosts = [from('post')]
const selectTitlefromPosts = [...fromPosts, select('title')]
const joinImages = [
  innerJoin(
    model(Image),
    joinAlias('images'),
    ...selectImagePath,
  )
];
const orderByTitleAndIdDesc = [desc('title', 'id')];
// use dynamic values
const limitByValue = [limit((ctx) => ctx.count)];

// mix and match sql constructs to build new queries
const res = await findAll(
  ...selectTitlefromPosts, 
  ...joinImages,
  ...orderByTitleAndIdDesc,
)(ctx);

const res = await findAll(
  ...selectTitlefromPosts, 
  ...joinImages,
)(ctx);

const res = await findAll(
  ...selectTitlefromPosts, 
  ...limitByValue
)(ctx);



const selectImagePath = select('path')
const joinPosts = [
  innerJoin(
    model(Post),
    joinAlias('posts'),
    ...joinImages
  )
];

const res = await findAll(
  from(User), nest(true),
  ...joinPosts,
  asc('id'),
)(ctx);

const res = await findAll(
  from(Post), 
  nest(true),
  ...joinImages,
  asc('id'),
)(ctx);
```
