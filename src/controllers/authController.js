import jwt from 'jsonwebtoken';
import { signUp, signIn, signOut } from '../services/authService.js';

// Segredo para assinar os tokens (em produção deve estar no .env)
const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_secreto_muda_isto';

// --- VISUALIZAÇÃO DE FORMULÁRIOS ---
export const renderAuthPage = (req, res) => {
    // Verifica se já existe um token válido no cookie
    const token = req.cookies?.token;

    if (token) {
        try {
            jwt.verify(token, JWT_SECRET);
            return res.redirect('/dashboard');
        } catch (e) {
            // Token inválido, continua para mostrar a página de login
        }
    }
    
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
        return res.status(400).send('Por favor, preencha todos os campos.');
    }

    try {
        // Nota: Passamos o name para o signUp para ser guardado nos metadados do utilizador
        const { user, session, error } = await signUp(email, password, name);

        if (error) {
            console.error('Erro de registro:', error.message);
            return res.status(400).send(`Falha no registro: ${error.message}`);
        }

        if (user) {
            // SUCESSO: Gerar Token JWT Próprio
            // Incluímos o 'name' no payload para estar disponível no Dashboard
            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email,
                    name: name // O nome que veio do formulário
                }, 
                JWT_SECRET, 
                { expiresIn: '1d' }
            );

            // Guardar no Cookie (Essencial para o res.redirect funcionar)
            res.cookie('token', token, {
                httpOnly: true, // Impede acesso via JS no browser (segurança)
                secure: process.env.NODE_ENV === 'production',
                maxAge: 24 * 60 * 60 * 1000 // 1 dia
            });
            
            return res.redirect('/login'); 
        } else {
            return res.status(200).send("Registo efetuado! Verifique o email.");
        }

    } catch (err) {
        console.error('Erro interno durante o registro:', err);
        return res.status(500).send('Erro interno do servidor.');
    }
};

// --- LOGIN ---
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Por favor, preencha o email e a senha.');
    }

    try {
        const { data, error } = await signIn(email, password);

        if (error) {
            return res.status(401).send(`Falha no login: ${error.message}`);
        }
        
        // A resposta do Supabase geralmente vem em data.user e data.session
        const user = data.user;

        // --- NOVA VERIFICAÇÃO DE SEGURANÇA ---
        // Verifica se o email foi confirmado. 
        // Se email_confirmed_at for null, bloqueia o acesso.
        if (!user.email_confirmed_at) {
            // Opcional: Podes fazer logout imediato no supabase para limpar a sessão lá
            // await supabase.auth.signOut(); 

            return res.status(403).send(`
                <h1>Conta não verificada</h1>
                <p>Por favor, verifique a sua caixa de entrada (e spam) e clique no link de confirmação enviado para <strong>${email}</strong> antes de fazer login.</p>
                <a href="/login">Voltar ao Login</a>
            `);
        }
        // -------------------------------------
        
        // Tenta obter o nome dos metadados do Supabase ou usa um fallback
        const userName = user.user_metadata?.name || user.user_metadata?.full_name || "Utilizador";

        // SUCESSO: Gerar Token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                name: userName 
            }, 
            JWT_SECRET, 
            { expiresIn: '1d' }
        );

        // Define o Cookie com o Token
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.redirect('/dashboard');

    } catch (err) {
        console.error('Erro interno durante o login:', err);
        return res.status(500).send('Erro interno do servidor.');
    }
};

// --- LOGOUT ---
export const logoutUser = async (req, res) => {
    try {
        await signOut(); // Logout do Supabase
        
        // Limpa o cookie do JWT
        res.clearCookie('token');
        res.redirect('/');
        
    } catch (err) {
        console.error('Erro interno durante o logout:', err);
        res.redirect('/');
    }
}

// --- MIDDLEWARE DE PROTEÇÃO (CORRIGIDO) ---
export const requireAuth = (req, res, next) => {
    // 1. Tenta obter o token dos cookies (Web) ou do Header (API)
    let token = req.cookies?.token;

    // Se não houver cookie, verifica se veio no Header (Authorization: Bearer ...)
    if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            token = parts[1];
        }
    }

    // 2. Se não houver token, rejeita
    if (!token) {
        // Se for API, retorna JSON. Se for Web, redireciona.
        if (req.path.startsWith('/api')) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        return res.redirect('/login');
    }

    // 3. Verifica o token
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // SUCESSO: Define req.user com os dados do token (incluindo o name!)
        req.user = decoded;
        req.userId = decoded.id; // Mantém compatibilidade com código antigo

        next();
    } catch (error) {
        console.log("Token inválido:", error.message);
        res.clearCookie('token');
        return res.redirect('/login');
    }
};

export default {
    renderAuthPage,
    loginUser,
    registerUser,
    logoutUser,
    requireAuth
};