// src/controllers/dashboardController.js
// Controlador para a área logada do Dashboard.
import express from 'express'; 
// Futuramente, precisaremos do Transaction Service aqui para obter dados.

/**
 * Renderiza a página principal do Dashboard (após login).
 * Esta rota já está protegida pelo requireAuth no ficheiro de rotas.
 * @param {express.Request} req
 * @param {express.Response} res
 */
export const renderDashboard = (req, res) => {
    try {
        // O ID do utilizador autenticado está disponível em req.userId
        // console.log(`A renderizar o dashboard para o utilizador ID: ${req.userId}`); 
        
        // Futuramente, passaremos dados dinâmicos como saldo, gráficos, etc.
        res.render('dashboard.html', { 
            title: "Meu Dashboard Financeiro",
            // user: req.user
        });
    } catch (error) {
        console.error("Erro ao renderizar o Dashboard:", error);
        res.status(500).send("Erro interno do servidor.");
    }
};

export default { renderDashboard };