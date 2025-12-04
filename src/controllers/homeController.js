// Controlador para o dashboard e páginas principais
import path from 'path';

/**
 * Renderiza a Landing Page/Dashboard.
 * @param {express.Request} req
 * @param {express.Response} res
 */
export const index = (req, res) => {
    try {
        // Renderiza o arquivo 'dashboard.html' que está em 'src/views/dashboard.html'
        // NOTA: Para este projeto simples, vamos colocar o dashboard.html na raiz de src/views,
        // mas é comum movê-lo para 'src/views/dashboard/index.html'
        res.render('home.html', { 
            title: "O Meu Bolso - Home" 
            // Variáveis podem ser passadas aqui se você usar um template engine como EJS
        });
    } catch (error) {
        console.error("Erro ao renderizar a home:", error);
        res.status(500).send("Erro interno do servidor.");
    }
};

export default { index };