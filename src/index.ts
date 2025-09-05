import express from 'express';
import { config } from './config';

const app = express();
const PORT = config.port;

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'AltraBot is running' });
});

app.get('/', (req, res) => {
  res.send('AltraBot WhatsApp Bot - Service is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
