# sql-puzzle (WIP)
sql-puzzle is a composable and functional query builder for Sequelize.

## Examples
```js

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare id: number;
    declare name: string;
    declare email: string;
    declare flag: boolean;
  
}

const idFromUsers = [from(User), raw(true), select('id')]

await findAll(
  ...idFromUsers,
  limit(3),
  asc('name')
)(ctx)


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
)(ctx)
```
