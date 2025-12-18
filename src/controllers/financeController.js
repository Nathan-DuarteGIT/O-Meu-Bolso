import { supabase } from '../config/supabase.js'; 

// --- CONTAS BANCÁRIAS (ACCOUNTS) ---
export const createAccount = async (req, res) => {
    const { name, balance, type } = req.body;
    // O middleware requireAuth define req.userId
    const userId = req.userId; 

    try {
        const { data, error } = await supabase
            .from('accounts')
            .insert([{ 
                nome: name, 
                tipo: type, 
                saldo_inicial: balance,    
                saldo_atual: balance,      
                user_id: userId 
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: 'Conta criada com sucesso', account: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- CATEGORIAS (Independentes) ---
// Útil para criar categorias de rendimento (income) ou despesas sem budget
export const createCategory = async (req, res) => {
    const { name, type, color } = req.body;
    const userId = req.userId;

    try {
        const { data, error } = await supabase
            .from('categories')
            .insert([{ 
                nome: name, 
                // Se o tipo não for enviado, assume 'income' (já que budgets cobrem as expenses)
                // Mas aceita 'expense' caso queiras criar categorias de despesa sem budget associado
                tipo_movimento: type || 'income', 
                cor: color || '#2ecc71', // Verde como padrão se for income/não especificado
                user_id: userId 
            }])
            .select()
            .single();

        if (error) {
            // Código de erro PostgreSQL para violação de unicidade (nome duplicado)
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Já existe uma categoria com este nome.' });
            }
            throw error;
        }

        res.status(201).json({ message: 'Categoria criada com sucesso', category: data });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- ORÇAMENTOS (BUDGETS) ---
// Lógica: Cria Categoria -> Cria Budget
export const createBudget = async (req, res) => {
    const { name, amount, period, color } = req.body; 
    const userId = req.userId;

    const currentMonth = new Date().toISOString().slice(0, 7); 
    const budgetPeriod = period || currentMonth;

    try {
        // 1. Cria Categoria (Tabela 'categories')
        const { data: categoryData, error: catError } = await supabase
            .from('categories') 
            .insert([{ 
                nome: name,       
                tipo_movimento: 'expense', 
                user_id: userId,
                cor: color || '#333333' 
            }])
            .select()
            .single();

        if (catError) throw catError;

        // 2. Cria Budget (Tabela 'budgets')
        const { data: budgetData, error: budgetError } = await supabase
            .from('budgets') 
            .insert([{ 
                limite: amount,          
                mes_ano: budgetPeriod,   
                category_id: categoryData.id, 
                user_id: userId 
            }])
            .select();

        if (budgetError) throw budgetError;

        res.status(201).json({ 
            message: 'Budget e Categoria criados', 
            budget: budgetData[0],
            category: categoryData
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- TRANSAÇÕES (TRANSACTIONS) ---
export const createTransaction = async (req, res) => {
    const { description, amount, date, type, account_id, category_id } = req.body;
    const userId = req.userId;

    try {
        // 1. Criar a transação
        const { data, error } = await supabase
            .from('transactions') 
            .insert([{ 
                descricao: description,  
                valor: amount,           
                data: date,             
                tipo: type, 
                account_id,             
                category_id,            
                user_id: userId 
            }])
            .select();

        if (error) throw error;

        // 2. Atualizar saldo da conta (saldo_atual)
        if (account_id) {
            const { data: account } = await supabase
                .from('accounts')
                .select('saldo_atual') 
                .eq('id', account_id)
                .single();
            
            let newBalance = Number(account.saldo_atual);
            
            if (type === 'expense') newBalance -= Number(amount);
            else newBalance += Number(amount);

            await supabase
                .from('accounts')
                .update({ saldo_atual: newBalance }) 
                .eq('id', account_id);
        }

        res.status(201).json({ message: 'Transação criada', transaction: data[0] });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- METAS DE POUPANÇA (SAVINGS_GOALS) ---
export const createGoal = async (req, res) => {
    const { name, target_amount, deadline } = req.body;
    const userId = req.userId;

    try {
        const { data, error } = await supabase
            .from('savings_goals') 
            .insert([{ 
                nome: name, 
                valor_alvo: target_amount,   
                valor_atual: 0,             
                data_alvo: deadline,         
                status: 'ativo',
                user_id: userId 
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: 'Meta criada', goal: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};