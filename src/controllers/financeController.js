import supabase from '../config/supabase.js';

// --- USER INFO ---
export const getUser = async (req, res) => {
    try {
        const { data: { user }, error } = await supabase.auth.admin.getUserById(req.userId);
        if (error) throw error;
        
        const name = user.user_metadata?.name || user.user_metadata?.full_name || "Utilizador";
        res.json({ name });
    } catch (error) {
        res.json({ name: "Utilizador" });
    }
};

// --- CONTAS (ACCOUNTS) ---

export const getAccounts = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', req.userId)
            .order('nome'); // Opcional: ordenar por nome
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createAccount = async (req, res) => {
    const { name, balance, type } = req.body;
    try {
        const { data, error } = await supabase
            .from('accounts')
            .insert([{ 
                nome: name, 
                tipo: type, 
                saldo_inicial: balance,    
                saldo_atual: balance,      
                user_id: req.userId 
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateAccount = async (req, res) => {
    const { id } = req.params;
    const { name, type, balance } = req.body; // 'balance' aqui seria uma correção manual do saldo atual

    try {
        const { data, error } = await supabase
            .from('accounts')
            .update({ 
                nome: name, 
                tipo: type,
                saldo_atual: balance // Permite corrigir o saldo manualmente
            })
            .eq('id', id)
            .eq('user_id', req.userId)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteAccount = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from('accounts')
            .delete()
            .eq('id', id)
            .eq('user_id', req.userId);

        if (error) throw error;
        res.json({ message: "Conta apagada" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- ORÇAMENTOS (BUDGETS) ---

export const getBudgets = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('budgets')
            .select('*, categories(nome)')
            .eq('user_id', req.userId);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createBudget = async (req, res) => {
    const { name, amount, period, color } = req.body; 
    const currentMonth = new Date().toISOString().slice(0, 7); 
    const budgetPeriod = period || currentMonth;

    try {
        const { data: categoryData, error: catError } = await supabase
            .from('categories') 
            .insert([{ 
                nome: name,       
                tipo_movimento: 'expense', 
                user_id: req.userId,
                cor: color || '#333333' 
            }])
            .select()
            .single();

        if (catError) throw catError;

        const { data: budgetData, error: budgetError } = await supabase
            .from('budgets') 
            .insert([{ 
                limite: amount,          
                mes_ano: budgetPeriod,   
                category_id: categoryData.id, 
                user_id: req.userId,
                alert_percentagem: 100 
            }])
            .select();

        if (budgetError) throw budgetError;

        res.status(201).json({ ...budgetData[0], categories: categoryData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateBudget = async (req, res) => {
    const { id } = req.params;
    const { amount, period } = req.body;

    try {
        const { data, error } = await supabase
            .from('budgets')
            .update({ 
                limite: amount,
                mes_ano: period 
            })
            .eq('id', id)
            .eq('user_id', req.userId)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteBudget = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from('budgets')
            .delete()
            .eq('id', id)
            .eq('user_id', req.userId);

        if (error) throw error;
        res.json({ message: "Orçamento apagado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// --- TRANSAÇÕES (TRANSACTIONS) ---

export const getTransactions = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*, categories(nome)')
            .eq('user_id', req.userId)
            .order('data', { ascending: false }); // Ordenar por data (mais recente)

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createTransaction = async (req, res) => {
    const { description, amount, date, type, account_id, category_id } = req.body;

    try {
        const { data, error } = await supabase
            .from('transactions') 
            .insert([{ 
                descricao: description,  
                valor: amount,           
                data: date,             
                tipo: type, 
                account_id,             
                category_id,            
                user_id: req.userId 
            }])
            .select();

        if (error) throw error;

        // Atualizar saldo da conta
        if (account_id) {
            const { data: account } = await supabase
                .from('accounts').select('saldo_atual').eq('id', account_id).single();
            
            let newBalance = Number(account.saldo_atual);
            if (type === 'expense') newBalance -= Number(amount);
            else newBalance += Number(amount);

            await supabase.from('accounts').update({ saldo_atual: newBalance }).eq('id', account_id);
        }

        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateTransaction = async (req, res) => {
    const { id } = req.params;
    const { description, amount, date, type, account_id, category_id } = req.body;

    try {
        // 1. Obter a transação ANTIGA para reverter o saldo
        const { data: oldTrans, error: findError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.userId)
            .single();

        if (findError) throw findError;

        // 2. Reverter o efeito da transação antiga na conta antiga
        if (oldTrans.account_id) {
            const { data: oldAcc } = await supabase.from('accounts').select('saldo_atual').eq('id', oldTrans.account_id).single();
            if (oldAcc) {
                let bal = Number(oldAcc.saldo_atual);
                // Se era despesa, devolve o dinheiro (+). Se era receita, retira (-).
                if (oldTrans.tipo === 'expense') bal += Number(oldTrans.valor);
                else bal -= Number(oldTrans.valor);
                
                await supabase.from('accounts').update({ saldo_atual: bal }).eq('id', oldTrans.account_id);
            }
        }

        // 3. Atualizar a transação com os NOVOS dados
        const { data: updatedTrans, error: updateError } = await supabase
            .from('transactions')
            .update({ 
                descricao: description,  
                valor: amount,           
                data: date,             
                tipo: type, 
                account_id,             
                category_id
            })
            .eq('id', id)
            .eq('user_id', req.userId)
            .select()
            .single();

        if (updateError) throw updateError;

        // 4. Aplicar o efeito da NOVA transação na conta (pode ser a mesma ou outra nova)
        if (account_id) {
            const { data: newAcc } = await supabase.from('accounts').select('saldo_atual').eq('id', account_id).single();
            if (newAcc) {
                let bal = Number(newAcc.saldo_atual);
                // Aplica a nova lógica
                if (type === 'expense') bal -= Number(amount);
                else bal += Number(amount);

                await supabase.from('accounts').update({ saldo_atual: bal }).eq('id', account_id);
            }
        }

        res.json(updatedTrans);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteTransaction = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Antes de apagar, saber o valor para reverter
        const { data: trans, error: findError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.userId)
            .single();
            
        if (findError) throw findError;

        // 2. Reverter Saldo
        if (trans.account_id) {
            const { data: account } = await supabase
                .from('accounts').select('saldo_atual').eq('id', trans.account_id).single();

            if (account) {
                let newBalance = Number(account.saldo_atual);
                if (trans.tipo === 'expense') newBalance += Number(trans.valor);
                else newBalance -= Number(trans.valor);

                await supabase.from('accounts').update({ saldo_atual: newBalance }).eq('id', trans.account_id);
            }
        }

        // 3. Apagar
        const { error: delError } = await supabase.from('transactions').delete().eq('id', id);
        if (delError) throw delError;

        res.json({ message: "Transação apagada e saldo revertido" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// --- METAS (GOALS) ---

export const getGoals = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('savings_goals')
            .select('*')
            .eq('user_id', req.userId);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createGoal = async (req, res) => {
    const { name, target_amount, deadline } = req.body;

    try {
        const { data, error } = await supabase
            .from('savings_goals') 
            .insert([{ 
                nome: name, 
                valor_alvo: target_amount,   
                valor_atual: 0,             
                data_alvo: deadline,         
                status: 'ativo',
                user_id: req.userId 
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateGoal = async (req, res) => {
    const { id } = req.params;
    const { name, target_amount, current_amount, deadline } = req.body;

    try {
        const { data, error } = await supabase
            .from('savings_goals')
            .update({ 
                nome: name, 
                valor_alvo: target_amount,
                valor_atual: current_amount, // Permite atualizar quanto já poupaste
                data_alvo: deadline 
            })
            .eq('id', id)
            .eq('user_id', req.userId)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteGoal = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from('savings_goals')
            .delete()
            .eq('id', id)
            .eq('user_id', req.userId);

        if (error) throw error;
        res.json({ message: "Meta apagada" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- CATEGORIAS ---

export const getCategories = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', req.userId)
            .order('nome');
            
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createCategory = async (req, res) => {
    const { name, type, color } = req.body;
    try {
        const { data, error } = await supabase
            .from('categories')
            .insert([{ 
                nome: name, 
                tipo_movimento: type || 'income', 
                cor: color || '#2ecc71', 
                user_id: req.userId 
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') return res.status(409).json({ error: 'Já existe.' });
            throw error;
        }
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};