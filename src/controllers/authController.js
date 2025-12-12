// src/controllers/authController.js
// Controlador para Lógica de Autenticação (Login e Registro)

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
        console.error("Erro ao renderizar a página de autenticação:", error);
        res.status(500).send("Erro interno ao carregar a página.");
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
            console.error('Erro no registo Supabase:', error.message);
            return res.status(400).json({ message: error.message });
        }

        // Se o Supabase já criar sessão (sem confirmação de email), guarda-a
        if (session) {
            req.session.user = {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || name,
                access_token: session.access_token,
                refresh_token: session.refresh_token
            };
        }

        // Resposta para fetch (JSON) ou formulário normal
        if (req.headers.accept?.includes('application/json')) {
            return res.status(201).json({ message: 'Registado com sucesso!' });
        }

        res.redirect('/login?mode=login');
    } catch (err) {
        console.error('Erro inesperado no registo:', err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// --- LOGIN ---
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        const { session, error } = await signIn(email, password);

        if (error || !session) {
            console.error('Login falhou:', error?.message || 'Sessão não criada');
            return res.status(401).json({ 
                message: error?.message || 'Credenciais inválidas.' 
            });
        }

        // Tudo certo – guarda na sessão Express
        req.session.user = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            access_token: session.access_token,
            refresh_token: session.refresh_token
        };

        // Responde conforme o cliente pedir
        if (req.headers.accept?.includes('application/json')) {
            return res.json({ message: 'Login bem-sucedido' });
        }

        res.redirect('/dashboard');
    } catch (err) {
        console.error('Erro inesperado no login:', err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// --- LOGOUT ---
export const logoutUser = async (req, res) => {
    try {
        if (req.session.user?.access_token) {
            await signOut(); 
        }
    } catch (e) {
        console.error('Erro ao fazer logout no Supabase:', e);
    }

    req.session.destroy((err) => {
        if (err) console.error('Erro ao destruir sessão:', err);
        res.redirect('/login');
    });
};

// --- MIDDLEWARE DE PROTEÇÃO ---
export const requireAuth = (req, res, next) => {
    if (req.session?.user) {
        req.user = req.session.user; 
        return next();
    }
    res.redirect('/login');
};

// Exportação padrão (caso precises)
export default {
    renderAuthPage,
    loginUser,
    registerUser,
    logoutUser,
    requireAuth
};