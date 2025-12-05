// src/services/authService.js
// Lógica de Negócios para Autenticação usando Supabase

// Importa a instância do cliente Supabase que configurámos
import supabase from '../config/supabaseConfig.js';

/**
 * Registra um novo utilizador no Supabase.
 * @param {string} email - O email do utilizador.
 * @param {string} password - A senha do utilizador.
 * @param {string} name - O nome a ser incluído nos metadados do utilizador.
 * @returns {Promise<{user: object | null, session: object | null, error: object | null}>}
 */
export async function signUp(email, password, name) {
    try {
        // Usa o método signUp do Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                // Insere o nome como metadado do utilizador
                data: {
                    full_name: name,
                },
                // Se quiser forçar a confirmação de email, o Supabase trata disso por padrão
                // redirectTo: 'URL de redirecionamento após confirmação de email' 
            },
        });

        // NOTA: Se o email precisar de confirmação, 'user' e 'session' podem ser null 
        // e 'error' também pode ser null. Supabase lida com o estado.

        if (error) {
            console.error('Erro no Supabase SignUp:', error);
            return { user: null, session: null, error: error };
        }

        console.log('Utilizador Registrado com Sucesso. Data:', data);
        return { user: data.user, session: data.session, error: null };

    } catch (err) {
        console.error('Erro inesperado durante o registro:', err);
        return { user: null, session: null, error: { message: 'Erro interno do servidor.' } };
    }
}

/**
 * Inicia a sessão de um utilizador no Supabase.
 * @param {string} email - O email do utilizador.
 * @param {string} password - A senha do utilizador.
 * @returns {Promise<{session: object | null, error: object | null}>}
 */
export async function signIn(email, password) {
    try {
        // Usa o método signInWithPassword do Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            console.error('Erro no Supabase SignIn:', error);
            // Retorna o erro específico do Supabase (ex: credenciais inválidas)
            return { session: null, error: error };
        }

        console.log('Sessão Iniciada com Sucesso. Data:', data);
        return { session: data.session, error: null };

    } catch (err) {
        console.error('Erro inesperado durante o login:', err);
        return { session: null, error: { message: 'Erro interno do servidor.' } };
    }
}

/**
 * Termina a sessão do utilizador.
 * @returns {Promise<{error: object | null}>}
 */
export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Erro no Supabase SignOut:', error);
            return { error: error };
        }

        console.log('Sessão terminada com sucesso.');
        return { error: null };

    } catch (err) {
        console.error('Erro inesperado durante o logout:', err);
        return { error: { message: 'Erro interno do servidor.' } };
    }
}

/**
 * Obtém o utilizador atualmente autenticado e a sessão.
 * Nota: No ambiente Express (servidor), a sessão deve ser verificada via cookies/tokens. 
 * Esta função é mais um utilitário para o lado do cliente ou se o token for passado no header.
 * @returns {Promise<{user: object | null}>}
 */
export async function getCurrentUser() {
    try {
        // Obtém os dados de autenticação atuais
        const { data: { user } } = await supabase.auth.getUser();

        return { user: user };
    } catch (err) {
        console.error('Erro ao obter utilizador atual:', err);
        return { user: null };
    }
}