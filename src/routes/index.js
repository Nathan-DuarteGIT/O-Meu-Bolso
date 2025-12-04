// Rotas da página principal e dashboard

import express from 'express';
import homeController from '../controllers/homeController.js';

const router = express.Router();

// Rota para a Landing Page (Dashboard)
// A função index no controller irá renderizar o nosso HTML
router.get('/', homeController.index);

export default router;