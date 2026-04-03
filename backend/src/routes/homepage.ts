import { Router } from 'express';
import { getHomepageContent, updateHomepageContent } from '../controllers/homepageController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Route publique - récupérer le contenu de la homepage
router.get('/', getHomepageContent);

// Route admin - mettre à jour le contenu (Admin seulement)
router.post('/', authenticate, authorize(['ADMIN']), updateHomepageContent);

export default router;
