import 'dotenv/config';
import app from './app.js';
import { prisma } from './config/prisma.js';
import path from 'path';
import express from 'express';

app.use(express.static(path.join(process.cwd(), 'public')));


const port = Number(process.env.PORT || 4000);

async function start() {
  await prisma.$connect();
  app.listen(port, () => console.log(`🚀 API running on http://localhost:${port}`));
}

start().catch((e) => {
  console.error('Failed to start server', e);
  process.exit(1);
});
