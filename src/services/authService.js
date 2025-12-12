// src/services/authService.js
// Lógica de Negócios para Autenticação usando Supabase

// Importa a instância do cliente Supabase que configurámos
import supabase from '../config/supabaseConfig.js';

/**
 * Registra um novo utilizador no Supabase.
 * @param {string} email - O email do utilizador.
 * @param {string} password - A senha do utilizador.
 * @param {string} name - O nome a ser incluído nos metadados do utilizador.
 */
export async function signUp(email, password, name) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                },
            },
        });

        if (error) {
            console.error('Erro no Supabase SignUp:', error);
            return { user: null, session: null, error: error };
        }

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
 */
export async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            console.error('Erro no Supabase SignIn:', error);
            return { session: null, error: error };
        }

        return { session: data.session, error: null };

    } catch (err) {
        console.error('Erro inesperado durante o login:', err);
        return { session: null, error: { message: 'Erro interno do servidor.' } };
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