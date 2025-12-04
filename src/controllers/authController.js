import express from 'express'; 
// NOTA: O service de autenticação (authService) será criado mais tarde.

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


/**
 * Lida com a submissão do formulário de login.
 * (A lógica do Supabase será adicionada aqui)
 */
export const loginUser = (req, res) => {
    // Por enquanto, apenas um placeholder:
    console.log("Tentativa de Login:", req.body);
    // Lógica futura: 
    // 1. Chamar authService.signIn(email, password)
    // 2. Redirecionar para o dashboard ou mostrar erro
    res.send("Ação de Login Submetida (Para Implementar).");
};

/**
 * Lida com a submissão do formulário de registro.
 * (A lógica do Supabase será adicionada aqui)
 */
export const registerUser = (req, res) => {
    // Por enquanto, apenas um placeholder:
    console.log("Tentativa de Registro:", req.body);
    // Lógica futura: 
    // 1. Chamar authService.signUp(email, password)
    // 2. Redirecionar para verificação de email ou dashboard
    res.send("Ação de Registro Submetida (Para Implementar).");
};

export default { renderLoginPage, renderRegisterPage, loginUser, registerUser };