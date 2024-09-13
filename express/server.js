'use strict';
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
const router = express.Router();

// MongoDB 연결 설정
const uri = process.env.MONGODB_URI; // MongoDB 연결 문자열 (예: mongodb://localhost:27017)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToDatabase() {
  if (!client.isConnected()) {
    await client.connect();
  }
  return client.db('game-store');
}

// GET 요청 처리
router.get('/', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const gamesCollection = db.collection('games');
    const games = await gamesCollection.find({}).toArray();
    res.json(games);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving games');
  }
});

// POST 요청 처리
router.post('/', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const gamesCollection = db.collection('games');
    const newGame = req.body;

    if (!newGame || !newGame.name) {
      return res.status(400).send('Invalid game data');
    }

    const result = await gamesCollection.updateOne(
      { name: newGame.name },
      { $set: newGame },
      { upsert: true } // 게임이 존재하지 않으면 새로 삽입
    );

    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating game');
  }
});

app.use(bodyParser.json());
app.use('/.netlify/functions/server', router);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

module.exports = app;
module.exports.handler = serverless(app);
