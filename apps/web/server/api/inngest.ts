import { serve } from 'inngest/nuxt';
import { inngest } from '../inngest/client';
import { processImageJob } from '../inngest/functions/process-image-job';

export default serve({
  client: inngest,
  functions: [processImageJob],
});
