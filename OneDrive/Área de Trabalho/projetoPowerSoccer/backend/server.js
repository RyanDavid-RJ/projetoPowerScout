const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
// NOVOS:
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const porta = 3000;

// Permite que o seu HTML (Frontend) converse com a API sem bloqueios de segurança
app.use(cors());

// Permite que a API receba os dados das coordenadas em formato JSON
app.use(express.json());

// Cria a pasta "uploads" automaticamente se ela não existir
const dir = './uploads';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

// Configuração do Multer (Cria o nome do arquivo com a data atual para não repetir)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// PERMISSÃO MÁGICA: Permite que o frontend acesse a pasta uploads livremente
app.use('/uploads', express.static('uploads'));

// 1. Criando a conexão com o banco de dados
const conexao = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'alunolab', // A senha do seu MySQL Workbench
    database: 'power_soccer' // O nome do banco que criamos
});

// 2. Testando a conexão na hora que o servidor ligar
conexao.connect((erro) => {
    if (erro) {
        console.error('❌ Erro ao conectar no MySQL:', erro.message);
        return;
    }
    console.log('✅ Conexão com o banco power_soccer estabelecida com sucesso!');
});

// 3. Rota de teste para ver se a API está viva
app.get('/', (req, res) => {
    res.json({ mensagem: 'A API do Scout Power Soccer está rodando!' });
});

// Rota para salvar a ação do jogo (Atualizada para Substituição)
app.post('/api/eventos', (req, res) => {
    // Agora recebemos também o jogador_entrou_id
    const { atleta_id, minuto_video, tipo_acao, coord_x, coord_y, jogador_entrou_id } = req.body;
    
    const sql = `INSERT INTO eventos_scout (partida_id, atleta_id, usuario_id, periodo, minuto_video, tipo_acao, coord_x, coord_y, jogador_entrou_id) 
                 VALUES (1, ?, 1, '1º Tempo', ?, ?, ?, ?, ?)`;
    
    // Passamos o jogador_entrou_id para o MySQL (ou nulo se for um lance normal)
    conexao.query(sql, [atleta_id, minuto_video, tipo_acao, coord_x || null, coord_y || null, jogador_entrou_id || null], (erro, resultados) => {
        if (erro) {
            console.error('Erro ao salvar no banco:', erro);
            return res.status(500).json({ erro: 'Erro interno ao salvar' });
        }
        res.status(201).json({ mensagem: 'Ação salva!', id_registro: resultados.insertId });
    });
});


// Rota para buscar as Estatísticas Globais dos Jogadores
app.get('/api/estatisticas', (req, res) => {
    const sql = `
        SELECT 
            a.nome AS atleta,
            SUM(CASE WHEN e.tipo_acao = 'Passe Certo' THEN 1 ELSE 0 END) AS passes_certos,
            SUM(CASE WHEN e.tipo_acao = 'Passe Errado' THEN 1 ELSE 0 END) AS passes_errados,
            SUM(CASE WHEN e.tipo_acao = 'Interceptação' THEN 1 ELSE 0 END) AS interceptacoes,
            SUM(CASE WHEN e.tipo_acao = 'Finalização' THEN 1 ELSE 0 END) AS finalizacoes,
            SUM(CASE WHEN e.tipo_acao = 'Gol' THEN 1 ELSE 0 END) AS gols
        FROM atletas a
        LEFT JOIN eventos_scout e ON a.id = e.atleta_id
        GROUP BY a.id, a.nome
        ORDER BY gols DESC, passes_certos DESC;
    `;

    conexao.query(sql, (erro, resultados) => {
        if (erro) {
            console.error('Erro ao buscar estatísticas:', erro);
            return res.status(500).json({ erro: 'Erro interno' });
        }
        res.json(resultados);
    });
});

// Rota para buscar os lances de uma partida específica (para redesenhar o mapa)
app.get('/api/eventos/partida/:id', (req, res) => {
    const idPartida = req.params.id;
    const sql = `
        SELECT e.*, a.nome AS nome_atleta 
        FROM eventos_scout e
        JOIN atletas a ON e.atleta_id = a.id
        WHERE e.partida_id = ?
    `;
    
    conexao.query(sql, [idPartida], (erro, resultados) => {
        if (erro) return res.status(500).json({ erro: 'Erro ao buscar lances' });
        res.json(resultados);
    });
});

// Rota para deletar um lance específico
app.delete('/api/eventos/:id', (req, res) => {
    const idLance = req.params.id;
    const sql = 'DELETE FROM eventos_scout WHERE id = ?';

    conexao.query(sql, [idLance], (erro, resultados) => {
        if (erro) {
            console.error('Erro ao deletar:', erro);
            return res.status(500).json({ erro: 'Erro ao deletar o lance' });
        }
        res.json({ mensagem: 'Lance deletado com sucesso!' });
    });
});

// Rota para ATUALIZAR (Alterar) um lance
app.put('/api/eventos/:id', (req, res) => {
    const idLance = req.params.id;
    const { tipo_acao, minuto_video } = req.body;
    
    const sql = 'UPDATE eventos_scout SET tipo_acao = ?, minuto_video = ? WHERE id = ?';

    conexao.query(sql, [tipo_acao, minuto_video, idLance], (erro, resultados) => {
        if (erro) return res.status(500).json({ erro: 'Erro ao atualizar' });
        res.json({ mensagem: 'Lance atualizado com sucesso!' });
    });
});

// Rota para CADASTRAR JOGADOR com foto
app.post('/api/atletas', upload.single('foto'), (req, res) => {
    const { nome, numero_camisa } = req.body;
    
    // Se o cara mandou foto, guarda o caminho. Se não, fica null
    const fotoPath = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Cadastra fixo na equipe 1 (Seleção Brasileira) por enquanto
    const sql = 'INSERT INTO atletas (nome, numero_camisa, equipe_id, foto) VALUES (?, ?, 1, ?)';
    
    conexao.query(sql, [nome, numero_camisa, fotoPath], (erro, resultados) => {
        if (erro) {
            console.error('Erro ao cadastrar jogador:', erro);
            return res.status(500).json({ erro: 'Erro interno ao salvar jogador' });
        }
        res.status(201).json({ mensagem: 'Atleta cadastrado com sucesso!', id: resultados.insertId });
    });
});

// Rota para BUSCAR todos os atletas cadastrados
app.get('/api/atletas', (req, res) => {
    const sql = 'SELECT * FROM atletas ORDER BY id ASC';
    conexao.query(sql, (erro, resultados) => {
        if (erro) {
            console.error('Erro ao buscar atletas:', erro);
            return res.status(500).json({ erro: 'Erro ao buscar atletas' });
        }
        res.json(resultados);
    });
});

// 4. Ligando o servidor
app.listen(porta, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${porta}`);
});

// ---------------------------------------------
// ROTA DE LOGIN E AUTENTICAÇÃO
// ---------------------------------------------
app.post('/api/login', (req, res) => {
    const { email } = req.body;
    
    // Procura o usuário no banco de dados pelo email
    const sql = 'SELECT id, nome, email FROM usuarios WHERE email = ?';

    conexao.query(sql, [email], (erro, resultados) => {
        if (erro) {
            console.error('Erro na verificação de login:', erro);
            return res.status(500).json({ erro: 'Erro interno no servidor' });
        }

        // Se o array tiver algum resultado, o e-mail existe no banco!
        if (resultados.length > 0) {
            res.json({ sucesso: true, usuario: resultados[0] });
        } else {
            // E-mail não encontrado, barra a entrada
            res.status(401).json({ sucesso: false, mensagem: 'Usuário não autorizado' });
        }
    });
});