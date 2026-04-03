import { Request, Response } from 'express';
import logger from '../utils/logger';

// In-memory storage for homepage content
let homepageContent = {
  hero: {
    title: "Bienvenue à l'École Primaire Forum de L'excellence",
    subtitle: "École primaire privée située à Medinatoul Salam, Mbour. Un cadre sûr et bienveillant pour construire les bases scolaires et humaines.",
    primaryButtonText: "Inscrivez-vous",
    secondaryButtonText: "Découvrez nos programmes"
  },
  stats: [
    { id: '1', value: '600+', label: 'Élèves' },
    { id: '2', value: '95%', label: 'Taux de réussite CP-CM2' },
    { id: '3', value: '35', label: 'Enseignants' },
    { id: '4', value: '12', label: "Années au service des enfants" }
  ],
  features: [
    { id: '1', icon: 'GraduationCap', title: 'Excellence en primaire', description: "Un apprentissage solide en lecture, écriture, maths et sciences, adapté aux jeunes enfants." },
    { id: '2', icon: 'Users', title: 'Équipe bienveillante', description: "Enseignants formés à la pédagogie active et au suivi personnalisé des élèves du primaire." },
    { id: '3', icon: 'BookOpen', title: 'Apprentissages ludiques', description: "Ateliers, projets et activités artistiques pour apprendre en confiance et en amusement." },
    { id: '4', icon: 'Award', title: 'Environnement sûr', description: "Classes lumineuses, bibliothèque jeunesse, terrain de jeux sécurisé et espaces verts." }
  ],
  news: [
    { id: '1', title: 'Kermesse solidaire 2025', date: '15 Mai 2025', excerpt: 'Les classes de CP à CM2 ont collecté des livres pour la bibliothèque de quartier.' },
    { id: '2', title: 'Nouvel espace de jeux', date: '20 Avril 2025', excerpt: "Ouverture d'une aire de jeux ombragée pour la maternelle et le cycle élémentaire." }
  ],
  cta: {
    title: "Prêt à rejoindre notre école primaire ?",
    description: "Inscriptions ouvertes pour l'année scolaire 2025-2026. Offrez à votre enfant un environnement sûr et stimulant.",
    primaryButtonText: "Commencer l'inscription",
    secondaryButtonText: "Explorer nos programmes"
  }
};

// GET - Récupérer le contenu de la homepage (public)
export const getHomepageContent = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      data: homepageContent
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching homepage content:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// POST - Mettre à jour le contenu de la homepage (Admin seulement)
export const updateHomepageContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const content = req.body;

    // Validation basique
    if (!content.hero || !Array.isArray(content.stats) || !Array.isArray(content.features) || !Array.isArray(content.news) || !content.cta) {
      res.status(400).json({
        success: false,
        error: 'Contenu invalide. Toutes les sections sont requises.'
      });
      return;
    }

    // Mettre à jour le contenu
    homepageContent = {
      hero: content.hero,
      stats: content.stats,
      features: content.features,
      news: content.news,
      cta: content.cta
    };

    res.json({
      success: true,
      message: 'Homepage mise à jour avec succès',
      data: homepageContent
    });
  } catch (error) {
    logger.error({ error }, 'Error updating homepage content:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};
