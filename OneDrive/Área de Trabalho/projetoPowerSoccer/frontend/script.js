// ==========================================
// 1. VARIÁVEIS GLOBAIS E SELETORES
// ==========================================
const campo = document.getElementById('campo');
const svgQuadra = document.getElementById('quadra-svg');

const modalAcao = document.getElementById('modal-acao');
const tituloModal = document.getElementById('modal-titulo');
const btnFecharModal = document.getElementById('fechar-modal');
const botoesAcao = document.querySelectorAll('#modal-acao .btn-acao'); 

const inputTempo = document.getElementById('tempo-video');
const displayTempo = document.getElementById('tempo-display');
const listaHistorico = document.getElementById('lista-historico');

const modalEdicao = document.getElementById('modal-edicao');
const selectEditarAcao = document.getElementById('editar-tipo-acao');
const inputEditarMinuto = document.getElementById('editar-minuto');
const escudoBloqueio = document.getElementById('escudo-bloqueio');

// Seletores para Substituição
const modalSubstituicao = document.getElementById('modal-substituicao');
const textoSubstituicao = document.getElementById('texto-substituicao');
const btnConfirmarSub = document.getElementById('btn-confirmar-sub');
const btnCancelarSub = document.getElementById('btn-cancelar-sub');
const containerTitulares = document.querySelector('.titulares');
const containerReservas = document.querySelector('.lista-reservas');

let cliqueX = 0;
let cliqueY = 0;
let jogadorSelecionado = 'Lucas (10)'; 
let atletaIdSelecionado = 1;
let tempoAtualFormatado = '00:00';

let lancesDaPartida = []; 
let idLanceEmEdicao = null;

let domJogadorSaindo = null;
let domJogadorEntrando = null;
let idSaindo = null;
let idEntrando = null;

// ==========================================
// 2. CONTROLE DO TEMPO E AUTO-SWITCH
// ==========================================
// Atualiza o texto visual enquanto o usuário arrasta
inputTempo.addEventListener('input', (e) => {
    const segundosTotais = e.target.value;
    const minutos = Math.floor(segundosTotais / 60).toString().padStart(2, '0');
    const segundos = (segundosTotais % 60).toString().padStart(2, '0');
    tempoAtualFormatado = `${minutos}:${segundos}`;
    displayTempo.textContent = tempoAtualFormatado;
});

// A INTELIGÊNCIA: Verifica se caiu na área vermelha ao soltar a barra
inputTempo.addEventListener('change', (e) => {
    const segundosSelecionados = parseInt(e.target.value);
    const intervalos = calcularIntervalosDoJogador(atletaIdSelecionado);
    
    const taJogando = intervalos.some(int => segundosSelecionados >= int.inicio && segundosSelecionados <= int.fim);
    
    if (!taJogando) {
        alert(`Atenção: ${jogadorSelecionado} estava no banco de reservas neste momento! O sistema vai trocar para o titular da posição.`);
        
        let achouSubstituto = false;
        
        document.querySelectorAll('.jogador').forEach(boxJogador => {
            if (achouSubstituto) return; 
            
            const idTestado = parseInt(boxJogador.getAttribute('data-id'));
            if (idTestado === atletaIdSelecionado) return; 
            
            const intervalosTeste = calcularIntervalosDoJogador(idTestado);
            const eleTavaNaQuadra = intervalosTeste.some(int => segundosSelecionados >= int.inicio && segundosSelecionados <= int.fim);
            
            if (eleTavaNaQuadra) {
                // Pula para o jogador que estava em quadra
                document.querySelectorAll('.jogador').forEach(j => j.classList.remove('ativo'));
                boxJogador.classList.add('ativo');
                
                jogadorSelecionado = boxJogador.querySelector('span').textContent;
                atletaIdSelecionado = idTestado;
                achouSubstituto = true;
                
                renderizarMapaELista(); 
            }
        });
    }
});

function atualizarBarraDeTempo(tempoTexto) {
    const partes = tempoTexto.split(':');
    if(partes.length !== 2) return;
    const segundos = (parseInt(partes[0]) * 60) + parseInt(partes[1]);
    inputTempo.value = segundos;
    tempoAtualFormatado = tempoTexto;
    displayTempo.textContent = tempoAtualFormatado;
}

// ==========================================
// 3. SELEÇÃO E SUBSTITUIÇÃO DE JOGADORES
// ==========================================
document.addEventListener('click', (e) => {
    const boxJogador = e.target.closest('.jogador');
    if (!boxJogador) return;

    const isReserva = boxJogador.closest('.lista-reservas') !== null;
    const titularAtivo = document.querySelector('.titulares .jogador.ativo');

    // Substituição!
    if (isReserva && titularAtivo) {
        domJogadorSaindo = titularAtivo;
        domJogadorEntrando = boxJogador;
        idSaindo = parseInt(titularAtivo.getAttribute('data-id'));
        idEntrando = parseInt(boxJogador.getAttribute('data-id'));

        const nomeSaindo = titularAtivo.querySelector('span').textContent;
        const nomeEntrando = boxJogador.querySelector('span').textContent;

        textoSubstituicao.innerHTML = `<strong>${nomeSaindo}</strong> será substituído por <strong>${nomeEntrando}</strong> aos <span class="cor-duo">${tempoAtualFormatado}</span>?`;
        
        modalSubstituicao.style.position = 'fixed';
        modalSubstituicao.style.left = '50%';
        modalSubstituicao.style.top = '50%';
        modalSubstituicao.style.transform = 'translate(-50%, -50%)';
        
        escudoBloqueio.classList.add('ativo');
        modalSubstituicao.classList.remove('escondido');
    } 
    // Apenas muda de aba
    else if (!isReserva) {
        document.querySelectorAll('.jogador').forEach(j => j.classList.remove('ativo'));
        boxJogador.classList.add('ativo');
        
        jogadorSelecionado = boxJogador.querySelector('span').textContent;
        atletaIdSelecionado = parseInt(boxJogador.getAttribute('data-id'));

        const lancesDoJogador = lancesDaPartida.filter(l => l.atleta_id === atletaIdSelecionado);
        if (lancesDoJogador.length > 0) {
            atualizarBarraDeTempo(lancesDoJogador[lancesDoJogador.length - 1].minuto_video);
        } else {
            atualizarBarraDeTempo("00:00");
        }
        renderizarMapaELista(); 
    }
});

btnCancelarSub.addEventListener('click', () => {
    modalSubstituicao.classList.add('escondido');
    escudoBloqueio.classList.remove('ativo');
});

btnConfirmarSub.addEventListener('click', () => {
    const dadosParaBanco = {
        atleta_id: idSaindo,
        jogador_entrou_id: idEntrando,
        minuto_video: tempoAtualFormatado,
        tipo_acao: 'Substituição',
        coord_x: null, coord_y: null
    };

    fetch('http://localhost:3000/api/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosParaBanco)
    }).then(() => {
        // Arranca a foto de quem sai
        const fotoSaindo = domJogadorSaindo.querySelector('.foto');
        if(fotoSaindo) fotoSaindo.remove();

        // Cria a foto de quem entra
        const nomeTexto = domJogadorEntrando.querySelector('span').textContent;
        const inicial = nomeTexto.charAt(0); 
        const divFoto = document.createElement('div');
        divFoto.classList.add('foto');
        divFoto.textContent = inicial;
        domJogadorEntrando.prepend(divFoto); 

        // Troca os dois de lugar
        containerTitulares.appendChild(domJogadorEntrando);
        containerReservas.appendChild(domJogadorSaindo);
        
        domJogadorSaindo.classList.remove('ativo');
        domJogadorEntrando.classList.add('ativo');
        
        jogadorSelecionado = domJogadorEntrando.querySelector('span').textContent;
        atletaIdSelecionado = idEntrando;

        modalSubstituicao.classList.add('escondido');
        escudoBloqueio.classList.remove('ativo');
        carregarDadosDoBanco();
    });
});

// ==========================================
// 4. CLIQUE NO MAPA PARA MARCAR LANCE
// ==========================================
svgQuadra.addEventListener('click', (e) => {
    const rect = svgQuadra.getBoundingClientRect();
    cliqueX = ((e.clientX - rect.left) / rect.width) * 100;
    cliqueY = ((e.clientY - rect.top) / rect.height) * 100;

    if(cliqueX < 0 || cliqueX > 100 || cliqueY < 0 || cliqueY > 100) return;

    // A Trava da Área Vermelha
    const segundos = parseInt(inputTempo.value);
    const intervalos = calcularIntervalosDoJogador(atletaIdSelecionado);
    const taJogando = intervalos.some(int => segundos >= int.inicio && segundos <= int.fim);
    
    if (!taJogando) {
        alert(`Impossível registrar lance. O ${jogadorSelecionado} está no banco neste momento do jogo.`);
        return;
    }

    tituloModal.textContent = `${jogadorSelecionado} aos ${tempoAtualFormatado}`;
    
    modalAcao.style.position = 'fixed';
    modalAcao.style.left = '50%';
    modalAcao.style.top = '50%';
    modalAcao.style.transform = 'translate(-50%, -50%)';
    
    escudoBloqueio.classList.add('ativo');
    modalAcao.classList.remove('escondido');
});

btnFecharModal.addEventListener('click', () => {
    modalAcao.classList.add('escondido');
    escudoBloqueio.classList.remove('ativo'); 
});

botoesAcao.forEach(botao => {
    botao.addEventListener('click', (e) => {
        const tipoAcao = e.target.getAttribute('data-tipo');
        if(!tipoAcao) return; 
        
        const dadosParaBanco = {
            atleta_id: atletaIdSelecionado,
            minuto_video: tempoAtualFormatado,
            tipo_acao: tipoAcao,
            coord_x: cliqueX.toFixed(2),
            coord_y: cliqueY.toFixed(2)
        };

        fetch('http://localhost:3000/api/eventos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosParaBanco)
        }).then(() => {
            carregarDadosDoBanco(); 
            modalAcao.classList.add('escondido');
            escudoBloqueio.classList.remove('ativo'); 
        });
    });
});

// ==========================================
// 5. MOTOR DE TEMPO E INTERVALOS
// ==========================================
function calcularIntervalosDoJogador(idPesquisado) {
    let intervalos = [];
    let tempoEntrada = [1, 2].includes(idPesquisado) ? 0 : null; 
    
    const substituicoes = lancesDaPartida
        .filter(l => l.tipo_acao === 'Substituição')
        .sort((a, b) => {
            const tA = (parseInt(a.minuto_video.split(':')[0]) * 60) + parseInt(a.minuto_video.split(':')[1]);
            const tB = (parseInt(b.minuto_video.split(':')[0]) * 60) + parseInt(b.minuto_video.split(':')[1]);
            return tA - tB; 
        });

    substituicoes.forEach(sub => {
        const tempoSubSegundos = (parseInt(sub.minuto_video.split(':')[0]) * 60) + parseInt(sub.minuto_video.split(':')[1]);
        
        if (sub.atleta_id === idPesquisado && tempoEntrada !== null) {
            intervalos.push({ inicio: tempoEntrada, fim: tempoSubSegundos });
            tempoEntrada = null; 
        }
        else if (sub.jogador_entrou_id === idPesquisado) {
            tempoEntrada = tempoSubSegundos;
        }
    });

    if (tempoEntrada !== null) {
        intervalos.push({ inicio: tempoEntrada, fim: 2400 }); 
    }

    return intervalos; 
}

function atualizarCoresDaBarra() {
    const intervalos = calcularIntervalosDoJogador(atletaIdSelecionado);
    const maxSegundos = 2400; 
    let gradientes = [];
    let ultimoFim = 0;

    intervalos.forEach(int => {
        if (int.inicio > ultimoFim) {
            const percBancoInicio = (ultimoFim / maxSegundos) * 100;
            const percBancoFim = (int.inicio / maxSegundos) * 100;
            gradientes.push(`var(--duo-red) ${percBancoInicio}% ${percBancoFim}%`);
        }
        
        const percQuadraInicio = (int.inicio / maxSegundos) * 100;
        const percQuadraFim = (int.fim / maxSegundos) * 100;
        gradientes.push(`#444 ${percQuadraInicio}% ${percQuadraFim}%`);
        
        ultimoFim = int.fim;
    });

    if (ultimoFim < maxSegundos) {
        const percFinal = (ultimoFim / maxSegundos) * 100;
        gradientes.push(`var(--duo-red) ${percFinal}% 100%`);
    }

    inputTempo.style.background = `linear-gradient(to right, ${gradientes.join(', ')})`;
}

// ==========================================
// 6. RENDERIZAÇÃO CRONOLÓGICA (MÁGICA FINAL)
// ==========================================
function carregarDadosDoBanco() {
    fetch('http://localhost:3000/api/eventos/partida/1') 
        .then(resposta => resposta.json())
        .then(lances => {
            lancesDaPartida = lances; 
            renderizarMapaELista();
        });
}

function renderizarMapaELista() {
    document.querySelectorAll('.ponto').forEach(ponto => ponto.remove());
    listaHistorico.innerHTML = ''; 

    // O Filtro poderoso: Traz as ações DELE, e as substituições ONDE ELE ENTROU
    const lancesFiltrados = lancesDaPartida
        .filter(l => l.atleta_id === atletaIdSelecionado || l.jogador_entrou_id === atletaIdSelecionado)
        .sort((a, b) => {
            const tempoA = (parseInt(a.minuto_video.split(':')[0]) * 60) + parseInt(a.minuto_video.split(':')[1]);
            const tempoB = (parseInt(b.minuto_video.split(':')[0]) * 60) + parseInt(b.minuto_video.split(':')[1]);
            return tempoB - tempoA; // Ordenação Cronológica (Mais recente no topo)
        });

    lancesFiltrados.forEach(lance => {
        
        // --- SE FOR SUBSTITUIÇÃO (Visual da lista diferente, sem bolinha no mapa) ---
        if(lance.tipo_acao === 'Substituição') {
            const item = document.createElement('div');
            item.classList.add('item-historico');
            
            let textoHist = '';
            if (lance.atleta_id === atletaIdSelecionado) {
                // Ele Saiu
                textoHist = `<strong>🔄 FOI SUBSTITUÍDO (Foi pro banco)</strong>`;
                item.style.backgroundColor = 'var(--duo-red)';
                item.style.color = 'white';
            } else {
                // Ele Entrou
                textoHist = `<strong>🔄 ENTROU NA QUADRA (Titular)</strong>`;
                item.style.backgroundColor = 'var(--duo-green-primary)';
                item.style.color = 'white';
            }

            item.innerHTML = `
                <div class="info-historico" style="width:100%; text-align:center;">
                    ${textoHist} <br><small>⏱️ ${lance.minuto_video}</small>
                </div>
            `;
            // ATENÇÃO AQUI: AppendChild porque a lista já está ordenada!
            listaHistorico.appendChild(item); 
            return; 
        }

        // --- SE FOR LANCE NORMAL (Gera Bolinha) ---
        const bolinha = document.createElement('div');
        bolinha.classList.add('ponto');
        bolinha.id = `bolinha-${lance.id}`;
        
        if(lance.tipo_acao === 'Passe Certo') bolinha.classList.add('passe-certo');
        if(lance.tipo_acao === 'Passe Errado') bolinha.classList.add('passe-errado');
        if(lance.tipo_acao === 'Interceptação') bolinha.classList.add('interceptacao');
        if(lance.tipo_acao === 'Finalização') bolinha.classList.add('finalizacao');
        if(lance.tipo_acao === 'Gol') bolinha.classList.add('gol');

        bolinha.style.left = `${lance.coord_x}%`;
        bolinha.style.top = `${lance.coord_y}%`;
        campo.appendChild(bolinha);

        const item = document.createElement('div');
        item.classList.add('item-historico');
        item.style.cursor = 'pointer'; 
        
        item.innerHTML = `
            <div class="info-historico"><strong>${lance.nome_atleta}</strong>: ${lance.tipo_acao} <br><small>⏱️ ${lance.minuto_video}</small></div>
            <button class="btn-excluir" onclick="abrirModalEdicao(event, ${lance.id}, '${lance.tipo_acao}', '${lance.minuto_video}')" title="Opções">⚙️</button>
        `;

        item.addEventListener('click', () => {
            atualizarBarraDeTempo(lance.minuto_video);
            const bolinhaAlvo = document.getElementById(`bolinha-${lance.id}`);
            if(bolinhaAlvo) {
                bolinhaAlvo.classList.add('ponto-destaque');
                setTimeout(() => bolinhaAlvo.classList.remove('ponto-destaque'), 1500);
            }
        });

        listaHistorico.appendChild(item); 
    });

    // Pinta a barra de vermelho dinamicamente
    atualizarCoresDaBarra();
}

// ==========================================
// 7. EDIÇÃO E ELIMINAÇÃO (MANTIDO)
// ==========================================
function abrirModalEdicao(eventoContexto, id, acaoAtual, minutoAtual) {
    eventoContexto.stopPropagation(); 
    idLanceEmEdicao = id;
    selectEditarAcao.value = acaoAtual;
    inputEditarMinuto.value = minutoAtual;
    modalEdicao.style.position = 'fixed';
    modalEdicao.style.left = `50%`;
    modalEdicao.style.top = `50%`;
    modalEdicao.style.transform = `translate(-50%, -50%)`;
    escudoBloqueio.classList.add('ativo');
    modalEdicao.classList.remove('escondido');
}

document.getElementById('btn-cancelar-edicao').addEventListener('click', () => {
    modalEdicao.classList.add('escondido');
    escudoBloqueio.classList.remove('ativo'); 
});

document.getElementById('btn-salvar-edicao').addEventListener('click', () => {
    const dadosEditados = { tipo_acao: selectEditarAcao.value, minuto_video: inputEditarMinuto.value };
    fetch(`http://localhost:3000/api/eventos/${idLanceEmEdicao}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dadosEditados)
    }).then(() => {
        carregarDadosDoBanco();
        modalEdicao.classList.add('escondido');
        escudoBloqueio.classList.remove('ativo'); 
    });
});

document.getElementById('btn-eliminar-definitivo').addEventListener('click', () => {
    if(!confirm('Atenção: Esta ação não pode ser desfeita. Excluir lance?')) return;
    fetch(`http://localhost:3000/api/eventos/${idLanceEmEdicao}`, { method: 'DELETE' })
        .then(() => {
            carregarDadosDoBanco();
            modalEdicao.classList.add('escondido');
            escudoBloqueio.classList.remove('ativo'); 
        });
});

// ==========================================
// BOOT DO SISTEMA
// ==========================================
carregarDadosDoBanco();