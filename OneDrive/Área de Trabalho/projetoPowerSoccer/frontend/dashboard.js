const tabelaCorpo = document.getElementById('tabela-corpo');

// Função para buscar e renderizar os dados
function carregarEstatisticas() {
    fetch('http://localhost:3000/api/estatisticas')
        .then(resposta => resposta.json())
        .then(dados => {
            tabelaCorpo.innerHTML = ''; // Limpa a tabela antes de preencher

            dados.forEach(linha => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: bold;">${linha.atleta}</td>
                    <td style="color: #FFEB3B;">${linha.gols}</td>
                    <td style="color: #9C27B0;">${linha.finalizacoes}</td>
                    <td style="color: #2196F3;">${linha.passes_certos}</td>
                    <td style="color: #F44336;">${linha.passes_errados}</td>
                    <td style="color: #FF9800;">${linha.interceptacoes}</td>
                `;
                tabelaCorpo.appendChild(tr);
            });
            // Chama a função para desenhar o gráfico após carregar os dados
            desenharGrafico(dados);
        })
        .catch(erro => console.error('Erro ao carregar os dados:', erro));
}

// Executa a função assim que a página abrir
carregarEstatisticas();

// Variável global para guardar o gráfico e podermos atualizá-lo depois
let meuGrafico;

function desenharGrafico(dadosDaApi) {
    // 1. Extraímos apenas os nomes dos atletas para o eixo X
    const nomes = dadosDaApi.map(linha => linha.atleta);
    
    // 2. Extraímos apenas os números de passes certos para o eixo Y
    const passesCertos = dadosDaApi.map(linha => linha.passes_certos);

    const contexto = document.getElementById('graficoPasses').getContext('2d');

    meuGrafico = new Chart(contexto, {
        type: 'bar', // Tipo de gráfico: barras verticaais
        data: {
            labels: nomes, // Eixo X (Lucas, João, etc)
            datasets: [{
                label: 'Passes Certos',
                data: passesCertos, // Eixo Y (10, 5, etc)
                backgroundColor: '#2196F3', // Cor das barras (Azul)
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true } // Garante que o gráfico comece do zero
            }
        }
    });
}