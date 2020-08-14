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
  hash: '123h45',
};

app.get('/queens', async(req, res) => {
  const data = await client.query('SELECT * from queens');

  res.json(data.rows);
});

app.get('/queens/:id', async(req, res) => {
  const queenId = req.params.id;

  const data = await client.query(`SELECT * from queens where id=${queenId}`);
  
  res.json(data.rows[0]);
});

app.post('/queens', async(req, res) => {
  const thatNewQueen = {
    name: req.body.name,
    quote: req.body.quote,
  };

  const data = await client.query(`
  INSERT INTO queens(name, quote, owner_id)
  VALUES($1, $2, $3)
  RETURNING *
`, [thatNewQueen.color, thatNewQueen.strings, fakeUser.id]);
  
  res.json(data.rows[0]);
});

app.use(require('./middleware/error'));

module.exports = app;
