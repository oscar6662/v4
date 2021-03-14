import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import express from 'express';
import dotenv from 'dotenv';

import { fetchEarthquakes } from './proxy.js';
import { get } from './cache.js';
import { timerStart, timerEnd } from './time.js';

dotenv.config();

const {
  PORT: port = 3001, // Mun verða proxyað af browser-sync í development
} = process.env;

const app = express();
const path = dirname(fileURLToPath(import.meta.url));
app.use('/css', express.static(join(path, '../client/css')));
app.use(express.static(join(path, '../public')));
app.use('/public/dist', express.static(join(path, '../public/dist')));

app.get('/', async (req, res) => {
  res.sendFile('vef2-2021-v4/client/index.html', { root: '..' });
});

app.get('/data', async (req, res) => {
  if (await get(req.query.type + req.query.period) != null) {
    const start = timerStart();
    let data = await get(req.query.type + req.query.period);
    data = { data, info: { cached: true, elapsed: timerEnd(start) } };
    return res.json(data);
  }
  const start = timerStart();
  let data = await fetchEarthquakes(req.query.type, req.query.period);
  data = { data, info: { cached: false, elapsed: timerEnd(start) } };
  return res.json(data);
});

/**
 * Middleware sem sér um 404 villur.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 */
// eslint-disable-next-line no-unused-vars
function notFoundHandler(req, res, next) {
  const title = 'Síða fannst ekki';
  res.status(404).send(title);
}

/**
 * Middleware sem sér um villumeðhöndlun.
 *
 * @param {object} err Villa sem kom upp
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const title = 'Villa kom upp';
  res.status(500).render('error', { title });
}

app.use(notFoundHandler);
app.use(errorHandler);

// Verðum að setja bara *port* svo virki á heroku
app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
