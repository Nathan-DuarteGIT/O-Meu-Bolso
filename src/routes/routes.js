import express from 'express';
import { requireAuth } from '../controllers/authController.js'; // Ajusta o caminho se necessário
import * as financeController from '../controllers/financeController.js';

const router = express.Router();

// Aplica o middleware de autenticação a TODAS as rotas abaixo
// Isto garante que req.userId existe e bloqueia acessos não autorizados
router.use(requireAuth);

// --- USER ---
router.get('/user', financeController.getUser);

// --- ACCOUNTS ---
router.get('/accounts', financeController.getAccounts);
router.post('/accounts', financeController.createAccount);
router.put('/accounts/:id', financeController.updateAccount); // Nova rota de edição
router.delete('/accounts/:id', financeController.deleteAccount);

// --- TRANSACTIONS ---
router.get('/transactions', financeController.getTransactions);
router.post('/transactions', financeController.createTransaction);
router.put('/transactions/:id', financeController.updateTransaction); // Nova rota de edição
router.delete('/transactions/:id', financeController.deleteTransaction);

// --- BUDGETS ---
router.get('/budgets', financeController.getBudgets);
router.post('/budgets', financeController.createBudget);
router.put('/budgets/:id', financeController.updateBudget); // Nova rota de edição
router.delete('/budgets/:id', financeController.deleteBudget);

// --- GOALS ---
router.get('/goals', financeController.getGoals);
router.post('/goals', financeController.createGoal);
router.put('/goals/:id', financeController.updateGoal); // Nova rota de edição
router.delete('/goals/:id', financeController.deleteGoal);
router.post('/goals/:id/contributions', financeController.addGoalContribution); // Nova rota para adicionar contribuição

// --- CATEGORIES ---
router.get('/categories', financeController.getCategories); // Nova rota de leitura
router.post('/categories', financeController.createCategory);

export default router;