import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'shopshot-ai',
  eventKey: process.env.INNGEST_EVENT_KEY,
});
