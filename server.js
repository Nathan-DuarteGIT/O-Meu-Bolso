// Ponto de Entrada da Aplicação Express

// Importa módulos essenciais
import express from 'express';
import 'dotenv/config'; // Garante que o .env seja carregado
import path from 'path';
import { fileURLToPath } from 'url';

// Importa as rotas
import indexRouter from './src/routes/index.js';

// --- CONFIGURAÇÃO INICIAL DO EXPRESS ---
const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Middlewares Essenciais
app.use(express.json()); // Para analisar corpos de requisição JSON
app.use(express.urlencoded({ extended: true })); // Para analisar corpos de requisição de formulários

// 2. Configuração de Arquivos Estáticos (a pasta 'public')
// O Express irá servir arquivos como /css/style.css, /js/main.js, etc.
app.use(express.static(path.join(__dirname, 'public')));

// 3. Configuração do Motor de Views
// Vamos usar HTML simples por enquanto, mas se você precisar de templates dinâmicos
// você pode configurar aqui (ex: app.set('view engine', 'ejs');)
// Para esta fase inicial, vamos apenas servir um arquivo HTML estático.
// A pasta base para views será 'src/views'
app.set('views', path.join(__dirname, 'src', 'views'));
app.engine('html', (filePath, options, callback) => {
    import('fs').then(fs => {
        fs.readFile(filePath, 'utf-8', (err, content) => {
            if (err) return callback(err);
            // Simplesmente retorna o conteúdo HTML sem processamento de template
            return callback(null, content);
        });
    });
});
app.set('view engine', 'html'); // Define o HTML como o motor de views padrão

// --- ROTAS DA APLICAÇÃO ---
app.use('/', indexRouter);

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log("Variáveis de ambiente carregadas.");
});

// Exporta o app para testes ou outras necessidades (opcional, mas boa prática)
export default app;