// src/controllers/authController.js
// Controlador para Lógica de Autenticação (Login e Registro)
import express from 'express'; 
import { signUp, signIn, signOut } from '../services/authService.js';

// --- VISUALIZAÇÃO DE FORMULÁRIOS ---
/**
 * Renderiza a página unificada de Login/Registo.
 */
export const renderAuthPage = (req, res) => {
    // Se o utilizador já estiver autenticado, redireciona para o dashboard
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    
    try {
        // Obtém o modo inicial da URL (default é 'login')
        const initialMode = req.query.mode || 'login';
        res.render('auth.html', {
            title: initialMode === 'login' ? "Login - O Meu Bolso" : "Registo - O Meu Bolso",
            initialMode
        });
    } catch (error) {
        console.error("Erro ao renderizar a página de autenticação:", error);
        res.status(500).send("Erro interno ao carregar a página.");
    }
};

// --- REGISTO ---
/**
 * Lida com a submissão do formulário de registro.
 */
export const registerUser = async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).send('Por favor, preencha todos os campos.');
    }

    try {
        const { user, session, error } = await signUp(email, password, name);

        if (error) {
            console.error('Erro de registro:', error.message);
            return res.status(400).send(`Falha no registro: ${error.message}`);
        }

        if (session && user) {
            // SUCESSO DE REGISTRO E LOGIN IMEDIATO: 
            // 1. Armazena o ID e o token do Supabase na sessão do Express
            req.session.userId = user.id;
            req.session.accessToken = session.access_token;
            
            return res.redirect('/dashboard'); 
        } else {
            // Se o Supabase exigir confirmação de email (nenhuma sessão criada)
            // O frontend trata esta mensagem de sucesso
            return res.status(200).send("Registo efetuado com sucesso! Verifique o seu email para confirmar a conta.");
        }

    } catch (err) {
        console.error('Erro interno durante o registro:', err);
        return res.status(500).send('Erro interno do servidor durante o registro.');
    }
};

// --- LOGIN ---
/**
 * Lida com a submissão do formulário de login.
 */
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Por favor, preencha o email e a senha.');
    }

    try {
        const { session, error } = await signIn(email, password);

        if (error) {
            console.error('Erro de login:', error.message);
            return res.status(401).send(`Falha no login: ${error.message}`);
        }
        
        // SUCESSO DE LOGIN:
        // 1. Armazena o ID e o token do Supabase na sessão do Express
        req.session.userId = session.user.id;
        req.session.accessToken = session.access_token;

        return res.redirect('/dashboard');

    } catch (err) {
        console.error('Erro interno durante o login:', err);
        return res.status(500).send('Erro interno do servidor durante o login.');
    }
};


// --- LOGOUT ---
/**
 * Lida com o término da sessão.
 */
export const logoutUser = async (req, res) => {
    try {
        await signOut();
        
        req.session.destroy(err => {
            if (err) {
                console.error('Erro ao destruir sessão do Express:', err);
            }
            res.redirect('/');
        });
        
    } catch (err) {
        console.error('Erro interno durante o logout:', err);
        res.redirect('/');
    }
}

// --- MIDDLEWARE DE PROTEÇÃO ---
/**
 * Middleware para garantir que o utilizador está autenticado (tem uma sessão ativa).
 */
export const requireAuth = (req, res, next) => {
    // Verifica se a sessão tem um ID de utilizador válido
    if (req.session?.userId) {
        // Adiciona o ID de utilizador ao request para ser facilmente acessível em Controllers
        req.userId = req.session.userId;
        return next();
    }
    // Se não estiver autenticado, redireciona para a página de login
    res.redirect('/login');
};

// Exportação padrão 
export default {
    renderAuthPage,
    loginUser,
    registerUser,
    logoutUser,
    requireAuth
};