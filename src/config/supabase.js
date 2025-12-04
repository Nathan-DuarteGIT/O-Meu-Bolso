// Configuração e inicialização do cliente Supabase
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'; // Usado para carregar as variáveis do .env

// O Supabase URL e Anon Key serão lidos do arquivo .env
const supabaseUrl = process.env.SUPABASE_URL;
// Usamos SUPABASE_ANON_KEY, que corresponde à chave pública do seu projeto.
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; 

// Verifica se as chaves estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("As variáveis SUPABASE_URL e SUPABASE_ANON_KEY devem ser definidas no arquivo .env");
}

// Inicializa o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Retorna a instância do cliente Supabase.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export default supabase;

// Exemplo de como você usaria isso em um service:
// import supabase from '../config/supabaseConfig.js';
// async function getTransactions() {
//     const { data, error } = await supabase.from('transactions').select('*');
//     // ...
// }