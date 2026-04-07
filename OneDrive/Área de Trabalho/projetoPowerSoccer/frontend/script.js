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
    
    // 1. Reorganiza a tela para mostrar quem era titular ou reserva neste exato minuto
    reorganizarTitularesEReservas(segundosSelecionados);

    // 2. Usa a nova função corrigida para ver se ele tava em quadra
    const taJogando = estaEmQuadra(atletaIdSelecionado, segundosSelecionados);
    
    // 3. Se o cara selecionado não tava jogando, pula pra quem tava!
    if (!taJogando) {
        let achouSubstituto = false;
        
        document.querySelectorAll('.jogador').forEach(boxJogador => {
            if (achouSubstituto) return; 
            
            const idTestado = parseInt(boxJogador.getAttribute('data-id'));
            if (idTestado === atletaIdSelecionado) return; 
            
            const eleTavaNaQuadra = estaEmQuadra(idTestado, segundosSelecionados);
            
            if (eleTavaNaQuadra) {
                alert(`Atenção: O jogador atual estava no banco neste momento! O sistema mudou para o titular da posição.`);
                
                document.querySelectorAll('.jogador').forEach(j => j.classList.remove('ativo'));
                boxJogador.classList.add('ativo');
                
                jogadorSelecionado = boxJogador.querySelector('span').textContent;
                atletaIdSelecionado = idTestado;
                achouSubstituto = true;
                
                // Redesenha a lista do lado direito sem tirar a barra do lugar!
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
    // Apenas seleciona outro Titular
    else if (!isReserva) {
        document.querySelectorAll('.jogador').forEach(j => j.classList.remove('ativo'));
        boxJogador.classList.add('ativo');
        
        jogadorSelecionado = boxJogador.querySelector('span').textContent;
        atletaIdSelecionado = parseInt(boxJogador.getAttribute('data-id'));

        const lancesDoJogador = lancesDaPartida.filter(l => l.atleta_id === atletaIdSelecionado);
        
        if (lancesDoJogador.length > 0) {
            // Ordena para achar o MAIS RECENTE daquele jogador e pular pra lá
            const sorted = [...lancesDoJogador].sort((a, b) => {
                const tA = (parseInt(a.minuto_video.split(':')[0]) * 60) + parseInt(a.minuto_video.split(':')[1]);
                const tB = (parseInt(b.minuto_video.split(':')[0]) * 60) + parseInt(b.minuto_video.split(':')[1]);
                return tA - tB; 
            });
            atualizarBarraDeTempo(sorted[sorted.length - 1].minuto_video);
        } else {
            // Pula para a hora em que ele entrou em quadra
            const intervalos = calcularIntervalosDoJogador(atletaIdSelecionado);
            if(intervalos.length > 0) {
                const min = Math.floor(intervalos[0].inicio / 60).toString().padStart(2, '0');
                const sec = (intervalos[0].inicio % 60).toString().padStart(2, '0');
                atualizarBarraDeTempo(`${min}:${sec}`);
            } else {
                atualizarBarraDeTempo("00:00");
            }
        }
        
        // Se mudamos de tempo, arrumamos as caixas
        reorganizarTitularesEReservas(parseInt(inputTempo.value));
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
        // Atualiza a seleção e reconstrói
        document.querySelectorAll('.jogador').forEach(j => j.classList.remove('ativo'));
        domJogadorEntrando.classList.add('ativo');
        
        jogadorSelecionado = domJogadorEntrando.querySelector('span').textContent;
        atletaIdSelecionado = idEntrando;

        modalSubstituicao.classList.add('escondido');
        escudoBloqueio.classList.remove('ativo');
        
        carregarDadosDoBanco(); // O sistema vai reconstruir a tela perfeitamente sozinho
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

    const segundos = parseInt(inputTempo.value);
    const taJogando = estaEmQuadra(atletaIdSelecionado, segundos);
    
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

// A FUNÇÃO QUE CORRIGE O BUG MATEMÁTICO DOS SEGUNDOS EXATOS
function estaEmQuadra(idPesquisado, segundosAtual) {
    const intervalos = calcularIntervalosDoJogador(idPesquisado);
    return intervalos.some(int => {
        // Exceção: Se for exatamente o final do jogo (2400s), usamos o <= para o lance não ser bloqueado
        if (int.fim >= 2400 && segundosAtual >= 2400) {
            return segundosAtual >= int.inicio && segundosAtual <= int.fim;
        }
        // Magia: O final é SEMPRE um milissegundo a menos (< int.fim). Isso evita o "empate" de titulares!
        return segundosAtual >= int.inicio && segundosAtual < int.fim;
    });
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
// 6. A FUNÇÃO MESTRA (Reorganiza UI por Tempo)
// ==========================================
function reorganizarTitularesEReservas(segundosAtual) {
    const todosJogadores = document.querySelectorAll('.jogador');
    const boxReservas = document.querySelector('.lista-reservas');
    
    todosJogadores.forEach(div => {
        const id = parseInt(div.getAttribute('data-id'));
        
        // Substituído para usar nossa nova função mestra "estaEmQuadra"
        const isTitular = estaEmQuadra(id, segundosAtual);

        let fotoDiv = div.querySelector('.foto');

        if (isTitular) {
            containerTitulares.appendChild(div); // Coloca na coluna esquerda
            
            // Coloca a foto se não tiver
            if (!fotoDiv) {
                fotoDiv = document.createElement('div');
                fotoDiv.classList.add('foto');
                const fotoReal = div.getAttribute('data-foto');
                
                if (fotoReal && fotoReal !== 'null' && fotoReal !== '') {
                    fotoDiv.style.backgroundImage = `url('http://localhost:3000${fotoReal}')`;
                    fotoDiv.style.backgroundSize = 'cover';
                    fotoDiv.style.backgroundPosition = 'center';
                    fotoDiv.style.color = 'transparent';
                } else {
                    const nomeTexto = div.querySelector('span').textContent;
                    fotoDiv.textContent = nomeTexto.charAt(0);
                }
                div.prepend(fotoDiv);
            }
        } else {
            boxReservas.appendChild(div); // Joga pro banco
            if (fotoDiv) fotoDiv.remove(); // Tira a foto
        }
    });
}

// ==========================================
// 7. RENDERIZAÇÃO CRONOLÓGICA
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

    // O sistema reorganiza visualmente Titulares vs Reservas AGORA
    reorganizarTitularesEReservas(parseInt(inputTempo.value));

    const lancesFiltrados = lancesDaPartida
        .filter(l => l.atleta_id === atletaIdSelecionado || l.jogador_entrou_id === atletaIdSelecionado)
        .sort((a, b) => {
            const tempoA = (parseInt(a.minuto_video.split(':')[0]) * 60) + parseInt(a.minuto_video.split(':')[1]);
            const tempoB = (parseInt(b.minuto_video.split(':')[0]) * 60) + parseInt(b.minuto_video.split(':')[1]);
            return tempoB - tempoA; 
        });

    lancesFiltrados.forEach(lance => {
        if(lance.tipo_acao === 'Substituição') {
            const item = document.createElement('div');
            item.classList.add('item-historico');
            
            let textoHist = '';
            if (lance.atleta_id === atletaIdSelecionado) {
                textoHist = `<strong>🔄 FOI SUBSTITUÍDO (Foi pro banco)</strong>`;
                item.style.backgroundColor = 'var(--duo-red)';
                item.style.color = 'white';
            } else {
                textoHist = `<strong>🔄 ENTROU NA QUADRA (Titular)</strong>`;
                item.style.backgroundColor = 'var(--duo-green-primary)';
                item.style.color = 'white';
            }

            item.innerHTML = `
                <div class="info-historico" style="width:100%; text-align:center;">
                    ${textoHist} <br><small>⏱️ ${lance.minuto_video}</small>
                </div>
            `;
            listaHistorico.appendChild(item); 
            return; 
        }

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
            // Ao clicar no histórico, também reorganizamos quem tava em quadra
            reorganizarTitularesEReservas(parseInt(inputTempo.value));
            
            const bolinhaAlvo = document.getElementById(`bolinha-${lance.id}`);
            if(bolinhaAlvo) {
                bolinhaAlvo.classList.add('ponto-destaque');
                setTimeout(() => bolinhaAlvo.classList.remove('ponto-destaque'), 1500);
            }
        });

        listaHistorico.appendChild(item); 
    });

    atualizarCoresDaBarra();
}

// ==========================================
// 8. EDIÇÃO E ELIMINAÇÃO
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

function fazerLogout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'login.html';
}

if (document.getElementById('nome-treinador')) {
    const user = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (user) document.getElementById('nome-treinador').textContent = `Olá, ${user.nome}`;
}

// ==========================================
// 9. CARREGAR JOGADORES DO BANCO
// ==========================================
function carregarAtletasDoBanco() {
    fetch('http://localhost:3000/api/atletas')
        .then(res => res.json())
        .then(atletas => {
            containerTitulares.innerHTML = '<h3>⚽ Titulares</h3>';
            const divListaReservas = document.querySelector('.lista-reservas');
            divListaReservas.innerHTML = '';

            atletas.forEach(atleta => {
                const div = document.createElement('div');
                div.classList.add('jogador');
                if (atleta.id === atletaIdSelecionado) div.classList.add('ativo');
                
                div.setAttribute('data-id', atleta.id);
                div.setAttribute('data-foto', atleta.foto || ''); 

                div.innerHTML = `<span>${atleta.nome} (${atleta.numero_camisa})</span>`;
                divListaReservas.appendChild(div); // Coloca todo mundo na reserva no início
            });

            // Chama o motor de dados (que também chamará a nossa nova função de reorganizar)
            carregarDadosDoBanco();
        })
        .catch(err => console.error('Erro ao carregar atletas:', err));
}

// ==========================================
// BOOT DO SISTEMA
// ==========================================
carregarAtletasDoBanco();