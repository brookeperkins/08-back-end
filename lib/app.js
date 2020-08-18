const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

const fakeUser = {
  id: 1,
  email: 'seymourbutz@hotmail.com',
  hash: '12345',
};

app.get('/queens', async(req, res) => {
  const data = await client.query(`
  SELECT q.id, name, image_url, quote, winner.winner as winner_id
  FROM queens as q
  JOIN winners AS w
  ON q.winner_id = w.id
  `);

  res.json(data.rows);
});

app.get('/winners', async(req, res) => {
  const data = await client.query(`
        SELECT * FROM winners`);

  res.json(data.rows);
});

app.get('/queens/:id', async(req, res) => {
  const queenId = req.params.id;

  const data = await client.query(`
  SELECT q.id, name, quote, image_url, quote
  FROM queens as q
  JOIN winners as w
  ON q.winner_id = w.id
  WHERE q.id=$1
`, [queenId]);
  
  res.json(data.rows[0]);
});

app.delete('/queens/:id', async(req, res) => {
  const queenId = req.params.id;

  const data = await client.query('DELETE FROM queens WHERE queens.id=$1', [queenId]);

  res.json(data.rows[0]);
});

app.put('/queens/:id', async(req, res) => {
  const queenId = req.params.id;

  try {
    const aQueenIsBorn = {
      name: req.body.name,
      image_url: req.body.image_url,
      quote: req.body.quote,
      winner_id: req.body.winner_id
    };

    const data = await client.query(`
      UPDATE queens
        SET name=$1, image_url=$2, winner_id=$3, quote=$4
        WHERE queens.id = $5
        RETURNING *
    `, [aQueenIsBorn.name, aQueenIsBorn.image_url, aQueenIsBorn.winner_id, aQueenIsBorn.quote, queenId]);

    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/queens', async(req, res) => {
  const thatNewQueen = {
    name: req.body.name,
    image_url: req.body.image_url,
    winner_id: req.body.winner_id,
    quote: req.body.quote,
    user_id: 1
  };

  const data = await client.query(`
  INSERT INTO queens(name, quote, owner_id)
  VALUES($1, $2, $3, $4, $5)
  RETURNING *
`, [thatNewQueen.color, thatNewQueen.strings, fakeUser.id]);
  
  res.json(data.rows[0]);
});

app.use(require('./middleware/error'));

module.exports = app;
