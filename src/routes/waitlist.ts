import { Router, Request, Response } from 'express';
import { store } from '../data/store';

const router = Router();

//strech
router.get('/', (_req: Request, res: Response) => {
  return res.json({
    total: store.waitlist.length,
    waitlist: store.waitlist,
  });
});

export default router;