import { SCENE_PRESETS, EXPORT_PRESETS, CREDIT_COSTS } from '@shopshot/shared';
import { requireUserSession } from '../utils/auth';

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  return {
    scenePresets: SCENE_PRESETS,
    exportPresets: EXPORT_PRESETS,
    creditCosts: CREDIT_COSTS,
  };
});
