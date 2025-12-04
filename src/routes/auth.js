// Rotas de Autenticação (Login e Registro)

import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

// ----------------------------------------------------
// ROTAS DE VISUALIZAÇÃO (GET)
// ----------------------------------------------------

// GET /login: Exibe o formulário de login
router.get('/login', authController.renderLoginPage);

// GET /register: Exibe o formulário de registro
router.get('/register', authController.renderRegisterPage);

// ----------------------------------------------------
// ROTAS DE AÇÃO (POST) - Será implementado depois com Supabase
// ----------------------------------------------------

// POST /login: Lida com a submissão do formulário de login
router.post('/login', authController.loginUser);

// POST /register: Lida com a submissão do formulário de registro
router.post('/register', authController.registerUser);

export default router;