// Rotas de Autenticação (Login e Registro)

import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

// ----------------------------------------------------
// ROTAS DE VISUALIZAÇÃO (GET)
// ----------------------------------------------------

// GET /login OU GET /register
// Ambos os caminhos levam ao mesmo Controller, que usa a query string (?mode=register)
router.get('/login', authController.renderAuthPage);
router.get('/register', authController.renderAuthPage);

// ----------------------------------------------------
// ROTAS DE AÇÃO (POST) - Será implementado depois com Supabase
// ----------------------------------------------------

// POST /login: Lida com a submissão do formulário de login
router.post('/login', authController.loginUser);

// POST /register: Lida com a submissão do formulário de registro
router.post('/register', authController.registerUser);

export default router;