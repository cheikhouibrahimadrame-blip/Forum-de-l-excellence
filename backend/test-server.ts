import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`✅ Test server started on port ${PORT}`);
});
