const client = require('../lib/client');
// import our seed data:
const queens = require('./queens.js');
// const usersData = require('./users.js');
const { getEmoji } = require('../lib/emoji.js');

run();

async function run() {

  try {
    await client.connect();

    // const users = await Promise.all(
    //   usersData.map(user => {
    //     return client.query(`
    //                   INSERT INTO users (email, hash)
    //                   VALUES ($1, $2)
    //                   RETURNING *;
    //               `,
    //     [user.email, user.hash]);
    //   })
    // );
      
    // const user = users[0].rows[0];

    await Promise.all(
      queens.map(queen => {
        console.log(queen);
        return client.query(`
                    INSERT INTO queens (name, winner, miss_congeniality, quote)
                    VALUES ($1, $2, $3, $4);
                `,
        [queen.name, queen.winner, queen.missCongeniality, queen.quote]);
      })
    );
    

    console.log('seed data load complete', getEmoji(), getEmoji(), getEmoji());
  }
  catch(err) {
    console.log(err);
  }
  finally {
    client.end();
  }
    
}
