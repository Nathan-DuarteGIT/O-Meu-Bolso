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
    const activeClasses = 'text-navy border-b-4 border-gold';
    const inactiveClasses = 'text-gray-500 hover:text-navy/70 border-b-4 border-transparent';

    tabLogin.className = `flex-1 py-3 text-lg font-bold transition duration-300 ${isLogin ? activeClasses : inactiveClasses}`;
    tabRegister.className = `flex-1 py-3 text-lg font-bold transition duration-300 ${!isLogin ? activeClasses : inactiveClasses}`;
    
    // 3. Atualiza a URL no navegador para persistir o estado após o refresh
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('mode', mode);
    window.history.pushState({ path: newUrl.href }, '', newUrl.href);
}

// Inicializa o formulário correto ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    // 1. Verifica o query parameter na URL (ex: /auth?mode=register)
    const urlParams = new URLSearchParams(window.location.search);
    const initialMode = urlParams.get('mode') || 'login';

    // 2. Garante que a função showForm está no escopo global
    // (A função é global pois foi definida sem const/let no topo)
    if (typeof showForm === 'function') {
        showForm(initialMode);
    } else {
        console.error("Função showForm não definida. Verifique a ordem dos scripts.");
    }
});