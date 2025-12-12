// Rotas de Autenticação (Login e Registro)

import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

// ----------------------------------------------------
// ROTAS DE VISUALIZAÇÃO (GET)
// ----------------------------------------------------

// GET /login E GET /register: Apontam para o mesmo controller que renderiza o formulário unificado.
router.get('/login', authController.renderAuthPage);
router.get('/register', authController.renderAuthPage);

// GET /logout: Termina a sessão
router.get('/logout', authController.logoutUser);

// ----------------------------------------------------
// ROTAS DE AÇÃO (POST)
// ----------------------------------------------------

// POST /login: Lida com a submissão do formulário de login
router.post('/login', authController.loginUser);

// POST /register: Lida com a submissão do formulário de registro
router.post('/register', authController.registerUser);

export default router;