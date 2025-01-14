# sql-puzzle (WIP)

sql-puzzle is a type-safe, highly composable, and functional query builder. It is a lightweight wrapper for Sequelize and written in TypeScript. The key idea behind sql-puzzle is to enable composable logic and reusable code. This is accomplished by defining SQL constructs at the most granular level and building upon them.

![sql-puzzle](https://github.com/Aidiiin/sql-puzzle/assets/3137261/daf35c34-259d-4e94-9f68-3c14961bdffb)

## Install

Works with node v12, v14, v16, v18, and Sequelize v6.
```bash
npm install sequelize --save
npm install sql-puzzle --save
```

## Examples

```typescript
import {
  findAll, 
  where,
  and, 
  not, 
  or,
  as,
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

const res = await findAll(
  select('id', as('name', 'new_name')),
  from(Post), 
  nest(true),
  ...joinImages,
  asc('id'),
)(ctx);
```
