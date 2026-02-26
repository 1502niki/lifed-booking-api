import express from 'express';
import availabilityRouter from './routes/availability';
import bookingsRouter from './routes/bookings';
import waitlistRouter from './routes/waitlist';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/availability', availabilityRouter);
app.use('/bookings', bookingsRouter);
//strech
app.use('/waitlist', waitlistRouter);

export default app;