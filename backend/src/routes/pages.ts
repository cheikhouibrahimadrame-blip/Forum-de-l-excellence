import { Router } from 'express';
import { 
  getPageContent, 
  updatePageContent, 
  getAllPages 
} from '../controllers/pagesController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Routes publiques - récupérer le contenu
router.get('/:page', getPageContent);
router.get('/', getAllPages);

// Routes admin - mettre à jour le contenu (Admin seulement)
router.post('/:page', authenticate, authorize(['ADMIN']), updatePageContent);

export default router;
