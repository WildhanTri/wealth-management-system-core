import { Router } from 'express';
import {
  getUserProfile,
  upsertUserProfile,
  completeOnboarding,
  resetUserData,
} from '../controllers/userProfile.controller.js';
import { validate } from '../middlewares/validator.js';
import { userProfileSchema, onboardingSetupSchema } from '../validations/userProfile.schema.js';

const router = Router();

router.get('/', getUserProfile);
router.post('/', validate(userProfileSchema), upsertUserProfile);
router.put('/', validate(userProfileSchema), upsertUserProfile);
router.post('/onboard', validate(onboardingSetupSchema), completeOnboarding);
router.post('/reset', resetUserData);

export default router;

