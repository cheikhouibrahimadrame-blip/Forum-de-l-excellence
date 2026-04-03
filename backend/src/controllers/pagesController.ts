import { Request, Response } from 'express';
import logger from '../utils/logger';

// In-memory storage (will persist to DB later with migrations)
let pagesContent = {
  admissions: {
    hero: {
      title: 'Admissions - Forum de L\'excellence',
      subtitle: 'Inscrivez votre enfant dans notre établissement d\'excellence',
      image: '/admissions-hero.jpg'
    },
    content: {
      requirements: 'Prérequis d\'admission',
      process: 'Processus d\'inscription',
      timeline: 'Calendrier d\'admissions',
      contact: 'Informations de contact'
    }
  },
  programs: {
    hero: {
      title: 'Nos Programmes - Forum de L\'excellence',
      subtitle: 'Découvrez nos cursus pédagogiques',
      image: '/programs-hero.jpg'
    },
    content: {
      description: 'Description générale',
      curriculum: 'Curriculum scolaire',
      languages: 'Langues enseignées',
      activities: 'Activités parascolaires'
    }
  },
  campusLife: {
    hero: {
      title: 'Vie du Campus - Forum de L\'excellence',
      subtitle: 'Expériences et activités de nos étudiants',
      image: '/campus-hero.jpg'
    },
    gallery: [
      { src: '/forum/WhatsApp%20Video%202026-01-26%20at%2020.19.01.mp4', alt: 'Forum de l\'Excellence - Vidéo 1', type: 'video' },
      { src: '/forum/WhatsApp%20Video%202026-01-26%20at%2020.19.29.mp4', alt: 'Forum de l\'Excellence - Vidéo 2', type: 'video' },
      { src: '/forum/WhatsApp%20Video%202026-01-26%20at%2020.19.29%20(1).mp4', alt: 'Forum de l\'Excellence - Vidéo 3', type: 'video' },
      { src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.33.jpeg', alt: 'Forum de l\'Excellence - Activité 1', type: 'image' },
      { src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.50.jpeg', alt: 'Forum de l\'Excellence - Activité 2', type: 'image' },
      { src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.51.jpeg', alt: 'Forum de l\'Excellence - Activité 3', type: 'image' },
      { src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.54.jpeg', alt: 'Forum de l\'Excellence - Activité 4', type: 'image' },
      { src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.55.jpeg', alt: 'Forum de l\'Excellence - Activité 5', type: 'image' },
      { src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.55%20(1).jpeg', alt: 'Forum de l\'Excellence - Activité 6', type: 'image' },
      { src: '/forum/WhatsApp%20Image%202026-01-26%20at%2020.19.55%20(2).jpeg', alt: 'Forum de l\'Excellence - Activité 7', type: 'image' }
    ],
    content: {
      events: 'Événements du campus',
      clubs: 'Clubs et associations',
      facilities: 'Installations',
      news: 'Actualités du campus'
    }
  }
};

// GET - Récupérer le contenu d'une page
export const getPageContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page } = req.params;
    
    if (!['admissions', 'programs', 'campusLife'].includes(page)) {
      res.status(400).json({
        success: false,
        error: 'Page invalide'
      });
      return;
    }

    const content = pagesContent[page as keyof typeof pagesContent];
    
    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching page content:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// POST - Mettre à jour le contenu d'une page (Admin seulement)
export const updatePageContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page } = req.params;
    const content = req.body;

    if (!['admissions', 'programs', 'campusLife'].includes(page)) {
      res.status(400).json({
        success: false,
        error: 'Page invalide'
      });
      return;
    }

    // Validation basique
    if (!content.hero || !content.content) {
      res.status(400).json({
        success: false,
        error: 'Contenu invalide. Les sections hero et content sont requises.'
      });
      return;
    }

    // Mettre à jour le contenu
    if (page === 'campusLife') {
      pagesContent.campusLife = {
        hero: content.hero,
        content: content.content,
        gallery: Array.isArray(content.gallery) && content.gallery.length > 0
          ? content.gallery
          : pagesContent.campusLife.gallery
      };
    } else if (page === 'admissions') {
      pagesContent.admissions = {
        hero: content.hero,
        content: content.content
      };
    } else if (page === 'programs') {
      pagesContent.programs = {
        hero: content.hero,
        content: content.content
      };
    }

    res.json({
      success: true,
      message: `Page ${page} mise à jour avec succès`,
      data: pagesContent[page as keyof typeof pagesContent]
    });
  } catch (error) {
    logger.error({ error }, 'Error updating page content:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// GET - Récupérer toutes les pages
export const getAllPages = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      data: pagesContent
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching all pages:');
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};
