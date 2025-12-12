// public/js/auth.js
// Script para gerenciar a alternância entre os formulários de Login e Registo (SPA-like)

/**
 * Alterna a exibição entre o formulário de login e registro.
 * Também atualiza a URL e o estilo dos botões (tabs).
 * @param {string} mode - 'login' ou 'register'
 */
function showForm(mode) {
    const isLogin = mode === 'login';

    // Elementos do Formulário
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');

    // Botões (Tabs)
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    // Título
    const authTitle = document.getElementById('auth-title');

    // 1. Alterna a visibilidade dos formulários
    if (isLogin) {
        formLogin.classList.remove('hidden');
        formRegister.classList.add('hidden');
        authTitle.textContent = 'Login';
    } else {
        formLogin.classList.add('hidden');
        formRegister.classList.remove('hidden');
        authTitle.textContent = 'Registo';
    }

    // 2. Atualiza os estilos dos botões
    // Uso de classes Tailwind para o estilo de ativação
    const activeClasses = 'text-navy border-b-4 border-gold';
    const inactiveClasses = 'text-gray-500 hover:text-navy/70 border-b-4 border-transparent';

    tabLogin.className = `flex-1 py-3 text-lg font-bold transition duration-300 ${isLogin ? activeClasses : inactiveClasses}`;
    tabRegister.className = `flex-1 py-3 text-lg font-bold transition duration-300 ${!isLogin ? activeClasses : inactiveClasses}`;
    
    // 3. Atualiza a URL no navegador para persistir o estado após o refresh
    // Usamos window.history.pushState para evitar o recarregamento completo da página
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('mode', mode);
    window.history.pushState({ path: newUrl.href }, '', newUrl.href);
}

/**
 * Lida com a submissão dos formulários de Login e Registo via AJAX (fetch).
 * @param {Event} event 
 */
async function handleFormSubmit(event) {
    event.preventDefault(); // Impede o recarregamento da página
    
    const form = event.target;
    const formData = new FormData(form);
    // Converte os dados do formulário para um objeto JSON
    const data = Object.fromEntries(formData.entries());
    // O endpoint é determinado pelo ID do formulário
    const endpoint = form.id === 'form-login' ? '/login' : '/register';

    const submitButton = form.querySelector('button[type="submit"]');
    const isLogin = endpoint === '/login';
    
    // 1. Estado de Carregamento
    // Salva o texto original para restauração
    const originalText = submitButton.textContent;
    
    submitButton.disabled = true;
    submitButton.textContent = isLogin ? 'A Entrar...' : 'A Registar...';
    
    // Elemento para mensagens de feedback (necessita de um elemento com id="auth-message" no auth.html)
    const messageContainer = document.getElementById('auth-message');
    if (messageContainer) {
        messageContainer.textContent = ''; 
        messageContainer.classList.remove('text-red-500', 'text-green-500');
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                // Muito importante: indica ao Express que o corpo é JSON
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(data)
        });

        // 2. Verifica se houve redirecionamento (normalmente sucesso de login/registro)
        if (response.redirected) {
            window.location.href = response.url; // Redireciona o navegador
            return;
        }

        // Tenta obter a mensagem de texto da resposta (Express envia mensagens de erro como texto)
        const responseText = await response.text();

        if (response.ok) {
            // Sucesso de Registo (se não redirecionou imediatamente)
            if (endpoint === '/register') {
                const successMessage = "Registo efetuado com sucesso! Verifique o seu email para confirmar a conta.";
                if (messageContainer) {
                    messageContainer.textContent = successMessage;
                    messageContainer.classList.add('text-green-500'); // Cor de sucesso
                } else {
                    console.log(successMessage);
                }
                showForm('login'); // Alterna para o formulário de Login
            }
        } else {
            // 3. Erro (ex: Senha errada, email já existe)
            const errorMessage = responseText || "Ocorreu um erro desconhecido na autenticação.";
            if (messageContainer) {
                messageContainer.textContent = errorMessage;
                messageContainer.classList.add('text-red-500'); // Cor de erro
            } else {
                console.error(`Falha na autenticação: ${errorMessage}`);
            }
        }

    } catch (error) {
        // Erro de rede
        const networkError = 'Erro de conexão com o servidor. Verifique a sua rede.';
        if (messageContainer) {
            messageContainer.textContent = networkError;
            messageContainer.classList.add('text-red-500');
        } else {
            console.error(networkError, error);
        }
    } finally {
        // 4. Restaura o estado do botão
        submitButton.disabled = false;
        submitButton.textContent = originalText; 
    }
}


// Inicializa o formulário correto e anexa os event listeners
document.addEventListener('DOMContentLoaded', () => {
    // 1. Lógica de Alternância de Views
    const urlParams = new URLSearchParams(window.location.search);
    const initialMode = urlParams.get('mode') || 'login';

    if (typeof showForm === 'function') {
        showForm(initialMode);
    } else {
        console.error("Função showForm não definida. Verifique a ordem dos scripts.");
    }
    
    // 2. Lógica de Submissão de Formulário (UNIFICADA)
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');

    if (formLogin) {
        // Anexa o handler unificado para a submissão de Login
        formLogin.addEventListener('submit', handleFormSubmit);
    }
    if (formRegister) {
        // Anexa o handler unificado para a submissão de Registo
        formRegister.addEventListener('submit', handleFormSubmit);
    }
});