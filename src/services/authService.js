// Lógica de Negócios para Autenticação usando Supabase
import supabase from '../config/supabase.js';

/**
 * Registra um novo utilizador no Supabase.
 * Retorna { user, session, error } diretamente, conforme esperado pelo Controller.
 */
export async function signUp(email, password, name) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name, // Guarda o nome nos metadados
                },
            },
        });

        if (error) {
            console.error('Erro no Supabase SignUp:', error);
            return { user: null, session: null, error: error };
        }

        // Retorna user e session separados para facilitar a desestruturação no controller
        return { user: data.user, session: data.session, error: null };

    } catch (err) {
        console.error('Erro inesperado durante o registro:', err);
        return { user: null, session: null, error: { message: 'Erro interno do servidor.' } };
    }
}

/**
 * Inicia a sessão de um utilizador no Supabase.
 * CORREÇÃO: Agora retorna o objeto 'data' completo (com user e session).
 */
export async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            console.error('Erro no Supabase SignIn:', error);
            // Retorna data null para manter a consistência
            return { data: null, error: error };
        }

        // ALTERADO AQUI:
        // Retornamos { data, error } para combinar com o "const { data, error } = await signIn..." do Controller
        return { data: data, error: null };

    } catch (err) {
        console.error('Erro inesperado durante o login:', err);
        return { data: null, error: { message: 'Erro interno do servidor.' } };
    }
}

/**
 * Termina a sessão do utilizador.
 */
export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Erro no Supabase SignOut:', error);
            return { error: error };
        }

        return { error: null };

    } catch (err) {
        console.error('Erro inesperado durante o logout:', err);
        return { error: { message: 'Erro interno do servidor.' } };
    }
}