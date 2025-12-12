// src/controllers/authController.js
import express from 'express';
import { signUp, signIn, signOut } from '../services/authService.js';

// --- VISUALIZAÇÃO DE FORMULÁRIOS ---
export const renderAuthPage = (req, res) => {
    try {
        const initialMode = req.query.mode || 'login';
        res.render('auth.html', { 
            title: initialMode === 'login' ? "Login - O Meu Bolso" : "Registo - O Meu Bolso",
            initialMode
        });
    } catch (error) {
        console.error("Erro ao renderizar auth:", error);
        res.status(500).send("Erro interno.");
    }
};

// --- REGISTO ---
export const registerUser = async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Preencha todos os campos.' });
    }

    try {
        const { user, session, error } = await signUp(email, password, name);

        if (error) {
            return res.status(400).json({ message: error.message });
        }

        // Se o Supabase confirmar email automaticamente, já cria sessão
        if (session) {
            req.session.user = {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name || name,
                access_token: session.access_token,
                refresh_token: session.refresh_token
            };
        }

        // Resposta JSON para fetch ou redirect normal
        if (req.headers.accept?.includes('application/json')) {
            return res.status(201).json({ message: 'Registado com sucesso!' });
        }
        res.redirect('/login?mode=login');
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

// --- LOGIN (versão final com sessão Express) ---
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha obrigatórios.' });
    }

    try {
        const { data, error } = await signIn(email, password);

        if (error || !data.session) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // SESSÃO EXPRESS SEGURA
        req.session.user = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email.split('@')[0],
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
        };

        // Resposta para fetch (JSON) ou formulário normal (redirect)
        if (req.headers.accept?.includes('application/json')) {
            return res.json({ message: 'Login bem-sucedido' });
        }

        res.redirect('/dashboard');
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// --- LOGOUT ---
export const logoutUser = async (req, res) => {
    try {
        if (req.session.user?.access_token) {
            await signOut(req.session.user.access_token);
        }
    } catch (e) { /* ignorar */ }
    req.session.destroy();
    res.redirect('/login');
};

// --- MIDDLEWARE DE PROTEÇÃO ---
export const requireAuth = (req, res, next) => {
    if (req.session?.user) {
        req.user = req.session.user; // disponibiliza para as rotas
        return next();
    }
    res.redirect('/login');
};

export default { renderAuthPage, loginUser, registerUser, logoutUser, requireAuth };