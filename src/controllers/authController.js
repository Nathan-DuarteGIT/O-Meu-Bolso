import express from 'express'; 
import { signUp, signIn, signOut } from '../services/authService.js';

/**
 * Renderiza a página de login.
 * @param {express.Request} req
 * @param {express.Response} res
 */
export const renderLoginPage = (req, res) => {
    try {
        // Renderiza o ficheiro 'login.html'
        res.render('login.html', { 
            title: "Entrar - Minhas Finanças"
        });
    } catch (error) {
        console.error("Erro ao renderizar a página de login:", error);
        res.status(500).send("Erro interno ao carregar a página.");
    }
};

/**
 * Renderiza a página de registro.
 * @param {express.Request} req
 * @param {express.Response} res
 */
export const renderRegisterPage = (req, res) => {
    try {
        // Renderiza o ficheiro 'register.html'
        res.render('register.html', { 
            title: "Criar Conta - Minhas Finanças"
        });
    } catch (error) {
        console.error("Erro ao renderizar a página de registro:", error);
        res.status(500).send("Erro interno ao carregar a página.");
    }
};


// --- AÇÕES DE AUTENTICAÇÃO (POST) ---

/**
 * Lida com a submissão do formulário de registro.
 */
export const registerUser = async (req, res) => {
    const { email, password, name } = req.body;

    // Validação básica
    if (!email || !password || !name) {
        return res.status(400).send('Por favor, preencha todos os campos.');
    }

    try {
        // 1. Chamar o serviço de registro do Supabase
        const { user, session, error } = await signUp(email, password, name);

        if (error) {
            console.error('Erro de registro:', error.message);
            // Redireciona de volta para o registro com uma mensagem de erro
            return res.status(400).send(`Falha no registro: ${error.message}`);
        }

        // 2. Trata o sucesso
        if (session) {
            // Se a sessão for criada imediatamente (sem confirmação de email)
            // Lógica para definir cookies de sessão aqui (Avançado, mas necessário para Express)
            // Por enquanto, apenas redireciona
            return res.redirect('/dashboard'); // Redireciona para o dashboard
        } else {
            // Se o Supabase exigir confirmação de email
            return res.send("Registo efetuado com sucesso! Verifique o seu email para confirmar a conta.");
        }

    } catch (err) {
        console.error('Erro interno durante o registro:', err);
        return res.status(500).send('Erro interno do servidor durante o registro.');
    }
};

/**
 * Lida com a submissão do formulário de login.
 */
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Por favor, preencha o email e a senha.');
    }

    try {
        // 1. Chamar o serviço de login do Supabase
        const { session, error } = await signIn(email, password);

        if (error) {
            console.error('Erro de login:', error.message);
            return res.status(401).send(`Falha no login: ${error.message}`);
        }

        // 2. Trata o sucesso
        // Lógica para definir cookies de sessão aqui (Avançado, mas necessário para Express)
        // Por enquanto, apenas redireciona
        return res.redirect('/dashboard');

    } catch (err) {
        console.error('Erro interno durante o login:', err);
        return res.status(500).send('Erro interno do servidor durante o login.');
    }
};

/**
 * Termina a sessão do utilizador.
 */
export const logoutUser = async (req, res) => {
    try {
        const { error } = await signOut();

        if (error) {
            console.error('Erro ao terminar sessão:', error.message);
            // Tenta sair de qualquer maneira, mesmo que haja um erro no Supabase
        }
        
        // Remove quaisquer cookies de sessão aqui (Avançado, mas necessário para Express)
        
        // Redireciona para a página principal
        return res.redirect('/');
    } catch (err) {
        console.error('Erro interno durante o logout:', err);
        return res.status(500).send('Erro interno do servidor durante o logout.');
    }
}

export default { 
    renderLoginPage, 
    renderRegisterPage, 
    loginUser, 
    registerUser,
    logoutUser // Adicionei a função de logout para futura referência
};