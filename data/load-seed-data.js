const client = require('../lib/client');
// import our seed data:
const queens = require('./queens.js');
const usersData = require('./users.js');
const winTypes = require('./winners.js');
const { getEmoji } = require('../lib/emoji.js');

run();

async function run() {

  try {
    await client.connect();

    const users = await Promise.all(
      usersData.map(user => {
        return client.query(`
                      INSERT INTO users (email, hash)
                      VALUES ($1, $2)
                      RETURNING *;
                  `,
        [user.email, user.hash]);
      })
    );
      
    const user = users[0].rows[0];

    await Promise.all(
      winTypes.map(winner => {
        return client.query(`
                      INSERT INTO winners (winner_type)
                      VALUES ($1);
                    `,
        [winner.winner_type]);
      })
    );


    await Promise.all(
      queens.map(queen => {
        return client.query(`
                    INSERT INTO queens (name, image_url, quote, owner_id, winner_id)
                    VALUES ($1, $2, $3, $4, $5);
                `,
        [queen.name, queen.image_url, queen.quote, user.id, queen.winner_id]);
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
