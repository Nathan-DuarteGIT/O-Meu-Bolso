// Rotas da página principal e dashboard

import express from 'express';
import homeController from '../controllers/homecontroller.js'; 
import dashboardController from '../controllers/dashboardController.js'; 
import authController from '../controllers/authController.js'; // Importa o Controller de Autenticação

const router = express.Router();

// Rota para a Home Page (Landing Page)
router.get('/', homeController.index);

// Rota para o Dashboard (Área Logada) - PROTEGIDA
// O requireAuth garante que só utilizadores logados podem aceder.
router.get('/dashboard', authController.requireAuth, dashboardController.renderDashboard); 

export default router;