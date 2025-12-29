// Variáveis de Estado
let accounts = [];
let transactions = [];
let budgets = [];
let goals = [];
let categories = []; // Nova variável de estado para categorias
let currentLimitsMonth = new Date().getMonth() + 1;
let currentLimitsYear = new Date().getFullYear();

// --- FUNÇÕES AUXILIARES ---

// Função genérica para exibir erros
function showError(message) {
    alert("Erro: " + message);
    console.error(message);
}

// Modais (Lógica Visual mantida)
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}
function closeModal(id, event) {
    if (event) {
        event.preventDefault(); // Impede a submissão do formulário
    }
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}
// Fecha modal ao clicar fora
document.querySelectorAll('[id$="Modal"]').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); });
});

// --- API & CARREGAMENTO DE DADOS ---

async function fetchAllData() {
    try {
        // Carrega tudo em paralelo: Contas, Transações, Orçamentos, Metas e CATEGORIAS
        const [accRes, transRes, budRes, goalRes, catRes] = await Promise.all([
            fetch('/api/accounts'),
            fetch('/api/transactions'),
            fetch('/api/budgets'),
            fetch('/api/goals'),
            fetch('/api/categories')
        ]);

        if (accRes.ok) accounts = await accRes.json();
        if (transRes.ok) transactions = await transRes.json();
        if (budRes.ok) budgets = await budRes.json();
        if (goalRes.ok) goals = await goalRes.json();
        if (catRes.ok) categories = await catRes.json();

        // Renderiza tudo na ordem correta
        renderAccounts();
        renderTransactions(); // Precisa de accounts e categories carregados
        renderGoals();
        calculateBudgetsProgress(); // Precisa de transactions e budgets carregados

        updateCategorySelects();

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

// Função principal para atualizar selects em todo o lado
function updateCategorySelects() {
    // 1. Atualizar Select de Transações (preservando seleção atual se possível)
    const transType = document.getElementById('transactionType')?.value || 'expense';
    loadCategoryOptions(transType);

    // 2. Atualizar Select de Limites (preservando seleção atual se possível)
    const limitSelect = document.getElementById('limitCategory');
    if (limitSelect) {
        const currentVal = limitSelect.value;
        limitSelect.innerHTML = '';

        if (!categories || categories.length === 0) {
            const opt = document.createElement('option');
            opt.value = "";
            opt.textContent = "Não tem categorias";
            opt.disabled = true;
            opt.selected = true;
            limitSelect.appendChild(opt);
        } else {
            const defaultOpt = document.createElement('option');
            defaultOpt.value = "";
            defaultOpt.textContent = "Selecione uma categoria";
            defaultOpt.disabled = true;
            if (!currentVal) defaultOpt.selected = true;
            limitSelect.appendChild(defaultOpt);

            categories.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.nome;
                if (c.id === currentVal) opt.selected = true;
                limitSelect.appendChild(opt);
            });
        }
    }
}

// --- GESTÃO DE CONTAS ---

function renderAccounts() {
    const list = document.getElementById('accountsList');
    list.innerHTML = '';

    if (!accounts || accounts.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhuma conta registada ainda.</p>';
        return;
    }

    accounts.forEach(acc => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center bg-light-gray/20 p-4 rounded-xl mb-3';
        div.innerHTML = `
        <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center text-2xl">💳</div>
            <div>
                <p class="font-semibold text-navy">${acc.nome}</p>
                <p class="text-sm text-gray-500">${acc.tipo.charAt(0).toUpperCase() + acc.tipo.slice(1)}</p>
            </div>
        </div>
        <div class="text-right">
            <p class="text-xl font-bold text-navy">€${parseFloat(acc.saldo_atual).toFixed(2)}</p>
            <div class="mt-2 space-x-4">
                <button onclick="deleteAccount('${acc.id}')"
                    class="text-sm text-red-600 underline hover:text-red-800">Excluir</button>
            </div>
        </div>
        `;
        list.appendChild(div);
    });
}

// Criar Conta (POST)
document.getElementById('accountForm').addEventListener('submit', async e => {
    e.preventDefault();

    const nome = document.getElementById('accountName').value.trim();
    const tipo = document.getElementById('accountType').value;
    const saldo = parseFloat(document.getElementById('accountBalance').value);

    try {
        const res = await fetch('/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: nome,
                type: tipo,
                balance: saldo
            })
        });

        if (res.ok) {
            await fetchAllData();
            closeModal('accountModal');
            document.getElementById('accountForm').reset();
        } else {
            const err = await res.json();
            showError(err.error || 'Erro ao criar conta');
        }
    } catch (error) { showError(error.message); }
});

// Apagar Conta (DELETE)
window.deleteAccount = async function (id) {
    if (!confirm('Tens a certeza? Isto apagará também as transações associadas.')) return;

    try {
        const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
        if (res.ok) fetchAllData();
    } catch (error) { console.error(error); }
};
/*
document.getElementById('openAccountModal').addEventListener('click', () => {
    document.getElementById('accountModalTitle').textContent = 'Nova Conta';
    document.getElementById('accountForm').reset();
    openModal('accountModal');
});*/

function openAccountModalHandler() {
    document.getElementById('accountModalTitle').textContent = 'Nova Conta';
    document.getElementById('accountForm').reset();
    openModal('accountModal');
}


// --- GESTÃO DE TRANSAÇÕES ---

function loadAccountOptions() {
    const select = document.getElementById('transactionAccount');
    select.innerHTML = '<option value="">Selecione uma conta</option>';
    accounts.forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc.id;
        opt.textContent = `${acc.nome} (€${parseFloat(acc.saldo_atual).toFixed(2)})`;
        select.appendChild(opt);
    });
}

// Carrega as categorias no <select> do modal de transações
function loadCategoryOptions(selectedType = null) {
    const select = document.getElementById('transactionCategory');
    if (!select) return; // Se o elemento não existir no HTML, ignora

    select.innerHTML = '<option value="">Sem categoria</option>';

    // Filtra categorias se um tipo for passado, senão mostra todas
    const filteredCategories = selectedType
        ? categories.filter(c => c.tipo_movimento === selectedType)
        : categories;

    filteredCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.nome;
        select.appendChild(opt);
    });
}

// Listener para atualizar categorias quando o tipo de transação muda
document.getElementById('transactionType')?.addEventListener('change', (e) => {
    loadCategoryOptions(e.target.value);
});
// Melhor: alterar diretamente no load do modal
const originalOpenTransactionModal = document.getElementById('openTransactionModal').onclick;
document.getElementById('openTransactionModal').onclick = function () {
    loadAccountOptions();
    const currentType = document.getElementById('transactionType').value || 'expense';
    loadCategoryOptions(currentType);
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];

    // Adiciona o botão "Gerir categorias" abaixo do select
    const categoryDiv = document.querySelector('#transactionModal .mb-6:nth-last-child(3)'); // o penúltimo mb-6 antes da data
    if (categoryDiv && !categoryDiv.querySelector('.manage-categories-btn')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'manage-categories-btn mt-3 text-gold underline text-sm hover:text-opacity-80';
        btn.textContent = 'Gerir categorias';
        btn.onclick = () => {
            renderCategoriesList();
            openModal('categoriesModal');
        };
        categoryDiv.appendChild(btn);
    }

    openModal('transactionModal');
};

function renderTransactions() {
    const container = document.getElementById('transactionsList');
    container.innerHTML = '';

    if (!transactions || transactions.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhuma transação registada ainda.</p>';
        return;
    }

    // Ordenar por data (mais recente primeiro)
    const sorted = [...transactions].sort((a, b) => new Date(b.data) - new Date(a.data));

    sorted.forEach(trans => {
        const accountName = accounts.find(a => a.id === trans.account_id)?.nome || 'Desconhecida';

        // Encontrar nome da categoria pelo ID ou pelo objeto populado
        let catName = '';
        if (trans.category_id) {
            const catObj = categories.find(c => c.id === trans.category_id);
            catName = catObj ? catObj.nome : (trans.categories?.nome || '');
        }

        const div = document.createElement('div');
        div.className = 'flex justify-between items-center bg-light-gray/20 p-4 rounded-xl mb-3';
        div.innerHTML = `
        <div class="flex items-center space-x-4">
            <div class="w-12 h-12 ${trans.tipo === 'expense' ? 'bg-red-100' : 'bg-green-100'} rounded-full flex items-center justify-center text-2xl">
                ${trans.tipo === 'expense' ? '🛒' : '💰'}
            </div>
            <div>
                <p class="font-semibold text-navy">${trans.descricao}</p>
                <p class="text-sm text-gray-500">
                    ${new Date(trans.data).toLocaleDateString('pt-PT')} • ${accountName} 
                    ${catName ? `<span class="bg-white px-2 py-0.5 rounded ml-2 text-xs border">${catName}</span>` : ''}
                </p>
            </div>
        </div>
        <div class="text-right">
            <p class="text-xl font-bold ${trans.tipo === 'expense' ? 'text-red-600' : 'text-green-600'}">
                ${trans.tipo === 'expense' ? '-' : '+'} €${parseFloat(trans.valor).toFixed(2)}
            </p>
            <button onclick="deleteTransaction('${trans.id}')"
                class="text-sm text-red-600 underline hover:text-red-800 mt-2 block ml-auto">Excluir</button>
        </div>
        `;
        container.appendChild(div);
    });
}

// Criar Transação (POST)
document.getElementById('transactionForm').addEventListener('submit', async e => {
    e.preventDefault();

    const desc = document.getElementById('transactionDescription').value;
    const accId = document.getElementById('transactionAccount').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const type = document.getElementById('transactionType').value;
    const date = document.getElementById('transactionDate').value;

    // Pega o ID da categoria selecionada (pode ser vazio)
    const catInput = document.getElementById('transactionCategory');
    const categoryId = catInput && catInput.value ? catInput.value : null;

    try {
        const res = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description: desc,
                amount: amount,
                date: date,
                type: type,
                account_id: accId,
                category_id: categoryId // Envia o ID para o backend
            })
        });

        if (res.ok) {
            await fetchAllData(); // Recarrega para atualizar saldos e listas
            closeModal('transactionModal');
            document.getElementById('transactionForm').reset();
        } else {
            const err = await res.json();
            showError(err.error || 'Erro ao criar transação');
        }
    } catch (e) { showError(e.message); }
});

// Apagar Transação
window.deleteTransaction = async function (id) {
    if (!confirm('Apagar transação? O saldo da conta será revertido.')) return;
    try {
        const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
        if (res.ok) fetchAllData();
    } catch (e) { console.error(e); }
};

document.getElementById('openTransactionModal').addEventListener('click', () => {
    loadAccountOptions(); // Carrega contas

    // Carrega categorias baseado no tipo atual (default: expense)
    const currentType = document.getElementById('transactionType').value || 'expense';
    loadCategoryOptions(currentType);

    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    openModal('transactionModal');
});


// --- GESTÃO DE LIMITES (BUDGETS) ---

function renderBudgets(calculatedBudgets) {
    const list = document.getElementById('limitsList');
    list.innerHTML = '';

    if (!calculatedBudgets || calculatedBudgets.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhum limite mensal definido.</p>';
        return;
    }

    calculatedBudgets.forEach(b => {
        const spent = b.current || 0;
        const limit = b.limite || 0;
        const percentage = limit > 0 ? (spent / limit) * 100 : 0;
        const isOver = spent > limit;
        const barColor = isOver ? 'bg-red-600' : (percentage >= 90 ? 'bg-yellow-500' : 'bg-green-500');

        // Tenta pegar o nome da categoria da lista de categorias global ou do objeto budget
        let catName = 'Orçamento';
        if (b.category_id) {
            const cat = categories.find(c => c.id === b.category_id);
            catName = cat ? cat.nome : (b.categories?.nome || 'Desconhecida');
        } else {
            catName = b.name || 'Geral'; // Fallback para nome manual se existir
        }

        const div = document.createElement('div');
        div.className = `bg-light-gray/20 p-6 rounded-2xl shadow-md border-l-8 ${isOver ? 'border-red-600' : 'border-green-500'} mb-4`;
        div.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-bold text-navy">${catName}</h3>
                    <div class="mt-1">
                        <span class="text-lg font-bold text-navy">€${spent.toFixed(2)}</span>
                        <span class="text-sm text-gray-500"> de €${limit.toFixed(2)}</span>
                    </div>
                </div>
                <div class="flex space-x-3">
                    <button onclick="deleteBudget('${b.id}')" class="text-red-600 hover:text-red-800 text-xl" title="Excluir">🗑️</button>
                </div>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div class="${barColor} h-full transition-all duration-500" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
            ${isOver ? '<p class="text-red-600 text-xs font-bold mt-2">⚠️ Limite excedido!</p>' : ''}
        `;
        list.appendChild(div);
    });
}

// Calcular progresso
function calculateBudgetsProgress() {
    // 1. Filtra orçamentos do mês atual (formato YYYY-MM)
    const monthStr = `${currentLimitsYear}-${String(currentLimitsMonth).padStart(2, '0')}`;

    const activeBudgets = budgets.filter(b => b.mes_ano === monthStr);

    // 2. Calcula gastos cruzando transactions.category_id com budgets.category_id
    activeBudgets.forEach(b => {
        b.current = 0;

        transactions.forEach(t => {
            // Verifica se a transação é 'expense' (despesa)
            if (t.tipo === 'expense') {
                // Verifica a data
                const tDate = t.data.substring(0, 7); // YYYY-MM

                // Lógica de correspondência:
                // Se o budget tem category_id, soma apenas transações dessa categoria
                if (b.category_id && t.category_id === b.category_id && tDate === monthStr) {
                    b.current += parseFloat(t.valor);
                }
                // Se o budget não tem category_id (Genérico/Manual), lógica antiga ou ignorar
                else if (!b.category_id && tDate === monthStr) {
                    // Opcional: Lógica para orçamentos "Gerais"
                }
            }
        });
    });

    renderBudgets(activeBudgets);
}

// Criar Budget (POST)
// Criar Budget (POST)
document.getElementById('limitForm').addEventListener('submit', async e => {
    e.preventDefault();

    const catSelect = document.getElementById('limitCategory');
    const categoryId = catSelect.value;

    // Verifica se uma categoria válida foi selecionada
    if (!categoryId) {
        alert("Por favor selecione uma categoria válida.");
        return;
    }

    // Encontra o nome da categoria para enviar (fallback se o backend precisar do nome)
    const selectedCat = categories.find(c => c.id == categoryId);
    const name = selectedCat ? selectedCat.nome : 'Orçamento';

    const amount = parseFloat(document.getElementById('limitAmount').value);
    const m = document.getElementById('limitMonth').value.padStart(2, '0');
    const y = document.getElementById('limitYear').value;
    const period = `${y}-${m}`;

    try {
        const res = await fetch('/api/budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                amount: amount,
                period: period,
                category_id: categoryId // Envia o ID da categoria
            })
        });

        if (res.ok) {
            currentLimitsMonth = parseInt(m);
            currentLimitsYear = parseInt(y);
            await fetchAllData();
            closeModal('limitsModal');
            document.getElementById('limitForm').reset();
        } else {
            // Lê a resposta JSON do servidor para saber o erro real
            const err = await res.json();
            showError(err.error || 'Erro ao criar orçamento');
        }
    } catch (err) { showError(err.message); }
});


// Listener para abrir modal de limites e (opcional) carregar categorias lá também
document.getElementById('openLimitsModal').addEventListener('click', () => {
    document.getElementById('limitModalTitle').textContent = 'Novo Orçamento';
    document.getElementById('limitForm').reset();

    const limitSelect = document.getElementById('limitCategory');
    limitSelect.innerHTML = ''; // Limpa opções anteriores

    if (!categories || categories.length === 0) {
        // Caso NÃO existam categorias
        const opt = document.createElement('option');
        opt.value = "";
        opt.textContent = "Não tem categorias";
        opt.disabled = true;
        opt.selected = true;
        limitSelect.appendChild(opt);
    } else {
        // Caso existam categorias
        const defaultOpt = document.createElement('option');
        defaultOpt.value = "";
        defaultOpt.textContent = "Selecione uma categoria";
        defaultOpt.disabled = true;
        defaultOpt.selected = true;
        limitSelect.appendChild(defaultOpt);

        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nome;
            limitSelect.appendChild(opt);
        });
    }

    // Adiciona o botão "Gerir categorias"
    const categoryDiv = limitSelect.parentElement;
    if (!categoryDiv.querySelector('.manage-categories-btn')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'manage-categories-btn mt-3 text-gold underline text-sm hover:text-opacity-80 block';
        btn.textContent = 'Gerir categorias';
        btn.onclick = () => {
            renderCategoriesList();
            openModal('categoriesModal');
        };
        categoryDiv.appendChild(btn);
    }

    // Define data padrão
    document.getElementById('limitMonth').value = new Date().getMonth() + 1;
    document.getElementById('limitYear').value = new Date().getFullYear();

    openModal('limitsModal');
});

window.deleteBudget = async function (id) {
    if (!confirm('Apagar este orçamento?')) return;
    try {
        const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
        if (res.ok) fetchAllData();
    } catch (e) { console.error(e); }
};


// --- GESTÃO DE METAS (GOALS) ---

function renderGoals() {
    const list = document.getElementById('goalsList');
    list.innerHTML = '';

    if (!goals || goals.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-500 py-6">Nenhuma meta definida ainda.</p>';
        return;
    }

    goals.forEach(goal => {
        const current = parseFloat(goal.valor_atual || goal.current || 0);
        const target = parseFloat(goal.valor_alvo || goal.target || 1);
        const perc = Math.min((current / target) * 100, 100);
        const deadline = goal.data_alvo || goal.deadline
            ? new Date(goal.data_alvo || goal.deadline).toLocaleDateString('pt-PT')
            : 'Sem prazo';

        const div = document.createElement('div');
        div.className = 'bg-light-gray/20 p-6 rounded-2xl shadow-md border-l-8 border-gold mb-5';

        div.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-navy">${goal.nome || goal.name}</h3>
                    <p class="text-sm text-gray-600 mt-1">Prazo: ${deadline}</p>
                    <div class="mt-3">
                        <span class="text-lg font-bold text-navy">€${current.toFixed(2)}</span>
                        <span class="text-sm text-gray-500"> de €${target.toFixed(2)}</span>
                    </div>
                </div>
                <div class="flex space-x-3 items-center">
                    <button onclick="openContributionModal('${goal.id}', '${(goal.nome || goal.name).replace(/'/g, "\\'")}')"
                        class="bg-green-600 hover:bg-green-700 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition text-xl font-bold"
                        title="Adicionar dinheiro à meta">
                        €
                    </button>

                    <button onclick="deleteGoal('${goal.id}')" 
                        class="text-red-600 hover:text-red-800 text-xl" title="Excluir">
                        🗑️
                    </button>
                </div>
            </div>

            <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div class="bg-gold h-full transition-all duration-500" style="width: ${perc}%"></div>
            </div>

            <div class="flex justify-between mt-2 text-sm">
                <span>${perc.toFixed(0)}% concluído</span>
                ${perc >= 100 ? '<span class="text-green-600 font-bold">Meta atingida! 🎉</span>' : ''}
            </div>
        `;

        list.appendChild(div);
    });
}

// Criar Meta (POST)
document.getElementById('goalForm').addEventListener('submit', async e => {
    e.preventDefault();

    const name = document.getElementById('goalName').value;
    const target = parseFloat(document.getElementById('goalTarget').value);
    const deadline = document.getElementById('goalDeadline').value;
    const current = parseFloat(document.getElementById('goalCurrent').value) || 0;

    try {
        const res = await fetch('/api/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                target_amount: target, // API espera 'target_amount'
                inicial_value: current,
                deadline: deadline
            })
        });

        if (res.ok) {
            await fetchAllData();
            closeModal('goalModal');
            document.getElementById('goalForm').reset();
        } else {
            showError('Erro ao criar meta');
        }
    } catch (e) { showError(e.message); }
});

window.deleteGoal = async function (id) {
    if (!confirm('Apagar meta?')) return;
    try {
        const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
        if (res.ok) fetchAllData();
    } catch (e) { console.error(e); }
};

document.getElementById('openGoalModal').addEventListener('click', () => {
    document.getElementById('goalModalTitle').textContent = 'Nova Meta';
    document.getElementById('goalForm').reset();
    openModal('goalModal');
});

// Função para carregar e renderizar a lista de categorias no modal
function renderCategoriesList() {
    const list = document.getElementById('categoriesList');
    list.innerHTML = '';

    if (!categories || categories.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-500 py-8">Nenhuma categoria criada ainda.</p>';
        return;
    }

    categories.forEach(cat => {
        const typeLabel = cat.tipo_movimento === 'expense' ? 'Despesa' : 'Rendimento';

        const typeColor = cat.tipo_movimento === 'expense' ? 'text-red-600' :
            cat.tipo_movimento === 'income' ? 'text-green-600' :
                'text-gold';

        const div = document.createElement('div');
        div.className = 'flex justify-between items-center bg-light-gray/20 p-4 rounded-xl';
        div.innerHTML = `
                <div>
                    <p class="font-semibold">${cat.nome}</p>
                    <p class="text-sm text-gray-500"><span class="${typeColor}">${typeLabel}</span></p>
                </div>
                <div class="flex space-x-3">
                    <button onclick="openEditCategory('${cat.id}', '${cat.nome.replace(/'/g, "\\'")}', '${cat.type}')"
                        class="text-gold hover:text-opacity-80 text-xl" title="Editar">Edit</button>
                    <button onclick="deleteCategory('${cat.id}')"
                        class="text-red-600 hover:text-red-800 text-xl" title="Excluir">Delete</button>
                </div>
            `;
        list.appendChild(div);
    });
}

// Abre o modal de edição de categoria
window.openEditCategory = function (id, name, type) {
    document.getElementById('categoryId').value = id;
    document.getElementById('categoryName').value = name;
    document.getElementById('categoryType').value = type;
    document.getElementById('categorySubmitText').textContent = 'Guardar Alterações';
};

// Reseta o formulário de categoria
function resetCategoryForm() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categorySubmitText').textContent = 'Adicionar Categoria';
}

// Excluir categoria
window.deleteCategory = async function (id) {
    if (!confirm('Tens a certeza que queres excluir esta categoria? Transações existentes manterão o nome antigo.')) return;

    try {
        const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        if (res.ok) {
            categories = categories.filter(c => c.id !== id);
            renderCategoriesList();
            updateCategorySelects(); 
        }
    } catch (e) { console.error(e); }
};

// Atualiza os <select> de categoria nos modais de transação e limite
function updateCategorySelects() {
    // Para transações
    loadCategoryOptions(document.getElementById('transactionType')?.value || 'expense');

    // Para limites
    const limitSelect = document.getElementById('limitCategory');
    if (limitSelect) {
        limitSelect.innerHTML = '<option value="" disabled selected>Selecione uma categoria</option>';
        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nome;
            limitSelect.appendChild(opt);
        });
    }
}

// Formulário de categoria (criar/editar)
document.getElementById('categoryForm').addEventListener('submit', async e => {
    e.preventDefault();

    const id = document.getElementById('categoryId').value;
    const name = document.getElementById('categoryName').value.trim();
    const type = document.getElementById('categoryType').value;

    if (!name) return alert('O nome da categoria é obrigatório.');

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/categories/${id}` : '/api/categories';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, type: type })
        });

        if (res.ok) {
            await fetchAllData(); // Recarrega categorias atualizadas
            renderCategoriesList();
            updateCategorySelects();
            resetCategoryForm();
        } else {
            const err = await res.json();
            alert(err.error || 'Erro ao guardar categoria');
        }
    } catch (e) { console.error(e); }
});

// --- INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Carregar nome do utilizador
    fetch('/api/user')
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => {
            const name = data.name ? data.name.split(' ')[0] : "Utilizador";
            const els = document.querySelectorAll('#userName, #headerName');
            els.forEach(el => el.textContent = name);
        })
        .catch(() => { });

    // 2. Carregar dados financeiros
    fetchAllData();

    // 3. Botão Logout
    document.getElementById('btn-logout')?.addEventListener('click', () => window.location.href = '/logout');
});



/* ==========================================
   CONVERSOR DE MOEDAS EM TEMPO REAL
   ========================================== */

// Configuração
const apiHost = 'https://api.frankfurter.app';
// Define aqui as moedas que queres que apareçam na grelha
const targetCurrencies = [
    { code: 'USD', flag: '🇺🇸', name: 'Dólar' },
    { code: 'BRL', flag: '🇧🇷', name: 'Real' },
    { code: 'GBP', flag: '🇬🇧', name: 'Libra' },
    { code: 'JPY', flag: '🇯🇵', name: 'Iene' },
    { code: 'CHF', flag: '🇨🇭', name: 'Franco' },
    { code: 'CNY', flag: '🇨🇳', name: 'Yuan' }
];

let currentRates = {}; // Variável para guardar as taxas

document.addEventListener('DOMContentLoaded', () => {
    initConverter();
});

async function initConverter() {
    const grid = document.getElementById('currencyGrid');
    const input = document.getElementById('euroInput');
    const updateText = document.getElementById('lastUpdateText');

    try {
        // 1. Buscar taxas UMA vez ao carregar a página
        const response = await fetch(`${apiHost}/latest?from=EUR`);
        const data = await response.json();

        currentRates = data.rates;
        updateText.textContent = `Taxas de referência: ${data.date}`;

        // 2. Renderizar a estrutura inicial
        renderCurrencyCards();

        // 3. Adicionar evento de "input" para cálculo instantâneo
        input.addEventListener('input', (e) => {
            calculateValues(e.target.value);
        });

        // 4. Calcular valor inicial (1€)
        calculateValues(input.value);

    } catch (error) {
        console.error('Erro ao carregar taxas:', error);
        grid.innerHTML = `
            <div class="col-span-2 text-center text-red-500 py-2 text-sm">
                Falha ao ligar à API. Verifique a internet.
            </div>`;
    }
}

function renderCurrencyCards() {
    const grid = document.getElementById('currencyGrid');
    grid.innerHTML = ''; // Limpar loader

    targetCurrencies.forEach(currency => {
        // Verifica se a API devolveu taxa para esta moeda
        if (currentRates[currency.code]) {
            const card = document.createElement('div');
            card.className = "bg-light-gray/10 p-3 rounded-xl border border-light-gray/50 flex flex-col justify-between hover:border-gold transition-colors duration-300";

            card.innerHTML = `
                <div class="flex justify-between items-start mb-1">
                    <span class="text-xs font-bold text-gray-500 uppercase">${currency.code}</span>
                    <span class="text-lg grayscale opacity-80">${currency.flag}</span>
                </div>
                <div class="text-right">
                    <span id="val-${currency.code}" class="text-xl font-extrabold text-navy block leading-none">...</span>
                    <span class="text-[10px] text-gray-400">${currency.name}</span>
                </div>
            `;
            grid.appendChild(card);
        }
    });
}

function calculateValues(euroValue) {
    // Se o input estiver vazio ou inválido, assumir 0
    let amount = parseFloat(euroValue);
    if (isNaN(amount) || amount < 0) amount = 0;

    targetCurrencies.forEach(currency => {
        const rate = currentRates[currency.code];
        if (rate) {
            const resultElement = document.getElementById(`val-${currency.code}`);
            if (resultElement) {
                // Multiplicação simples: Valor Input * Taxa
                const finalValue = amount * rate;

                // Formatação bonita (ex: 1,234.56)
                resultElement.textContent = finalValue.toLocaleString('pt-PT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }
        }
    });
}