// server.js
import express from 'express';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

import indexRouter from './src/routes/index.js';
import authRouter from './src/routes/auth.js';

// NOVIDADE: sessão + proteção
import session from 'express-session';
import { requireAuth } from './src/controllers/authController.js';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração de views HTML puro
app.set('views', path.join(__dirname, 'src', 'views'));
app.engine('html', (filePath, options, callback) => {
    import('fs').then(fs => {
        fs.readFile(filePath, 'utf-8', (err, content) => {
            if (err) return callback(err);
            return callback(null, content);
        });
    });
});
app.set('view engine', 'html');

// SESSÃO
app.use(session({
    secret: process.env.SESSION_SECRET || 'o-meu-bolso-2025-super-segredo',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 24*60*60*1000 }
}));

// Rotas
app.use('/', indexRouter);
app.use('/', authRouter);

// DASHBOARD PROTEGIDO
app.get('/dashboard', requireAuth, (req, res) => {
    res.sendFile('dashboard.html', { root: './src/views' });
});

// API para o nome do utilizador no dashboard
app.get('/api/user', requireAuth, (req, res) => {
    res.json({ name: req.user.name });
});

// 404
app.use((req, res) => res.status(404).send('Página não encontrada'));

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log("Variáveis de ambiente carregadas.");
});

export default app;