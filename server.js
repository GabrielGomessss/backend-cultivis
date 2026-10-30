
const express = require('express');

const app = express();

app.use(express.json());

// Porta do servidor
const PORT = process.env.PORT || 3000;

// Rota principal
app.get('/', (req, res) => {
    res.json({
        projeto: 'CULTIVIS',
        mensagem: 'Servidor funcionando!',
        status: 'online'
    });
});

// Rota para receber os dados do ESP32
app.post('/api/leituras', (req, res) => {

    const { temperatura, umidade, ph } = req.body;

    console.log('Dados recebidos do ESP32:');

    console.log({
        temperatura,
        umidade,
        ph
    });

    res.status(200).json({
        sucesso: true,
        mensagem: 'Leitura recebida pelo CULTIVIS!'
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`CULTIVIS Server rodando na porta ${PORT}`);
});
