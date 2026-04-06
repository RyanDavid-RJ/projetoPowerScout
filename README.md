⚽ PowerScout - Sistema de Análise para Power Soccer
🎯 Objetivo do Projeto
Desenvolver uma aplicação Web Full Stack para captação, gerenciamento e visualização de dados táticos (scout) em partidas de Power Soccer. O sistema visa substituir as pranchetas físicas por uma interface digital interativa, permitindo que a comissão técnica registre ações em tempo real (ou via vídeo), analise o desempenho individual de atletas e gere mapas de calor e estatísticas globais para embasar decisões táticas.

🏗️ Arquitetura e Tecnologias
O MVP (Produto Mínimo Viável) foi estruturado utilizando tecnologias de mercado padrão, sem frameworks pesados no frontend, para garantir performance e facilidade de manutenção:

Backend: API RESTful construída com Node.js e Express.

Banco de Dados: MySQL relacional (Tabelas: Atletas, Partidas, Eventos/Lances).

Frontend: HTML5, CSS3 moderno (Variáveis, Flexbox, Grid) e Vanilla JavaScript.

Visualização de Dados: Integração com Chart.js para dashboards estatísticos.

🚀 Entregas e Funcionalidades Concluídas (O que fizemos hoje)
1. Integração Full-Stack (O Coração do Sistema)

Estabelecemos a comunicação bidirecional perfeita entre o Frontend (Interface), o Backend (Rotas da API) e o Banco de Dados (MySQL).

Criamos o CRUD básico de eventos operando em tempo real (POST para salvar lances, GET para desenhar o mapa, PUT para editar minutagem/ação e DELETE para exclusão de erros).

2. Interface Gráfica e Design System (UX/UI)

Implementamos um Design System inspirado no Duolingo, focado em alta usabilidade durante partidas dinâmicas: uso de cores vibrantes para ações distintas, cantos arredondados (squircle), tipografia geométrica limpa e botões com feedback tátil (sombra e escala).

Vetorização e responsividade total do mapa do campo (SVG) via propriedade aspect-ratio, resolvendo bugs de coordenadas independentemente do nível de zoom do navegador.

3. Motor de Tempo e Substituições Inteligentes (A Matemática Tática)

Construímos uma máquina de estados complexa para gerenciar a entrada e saída de jogadores sem limite de substituições.

Mapeamento de Intervalos: O sistema calcula algoritmicamente os minutos exatos em que cada jogador esteve em quadra.

Auto-Switch e Bloqueios: A barra de tempo é pintada dinamicamente indicando os períodos em que o atleta esteve no banco (zona vermelha). Tentativas de clique nessas zonas geram bloqueios de segurança ou transferem automaticamente o foco da interface para o jogador que estava ativo naquele minuto.

4. Dashboard Base e Histórico Cronológico

Criação de uma tela separada de estatísticas que consome cálculos complexos (SUM(CASE WHEN...)) processados nativamente pelo MySQL.

Coluna de histórico na tela principal que organiza todos os lances cronologicamente, com sistema de edição em modal centrado (Backdrop Screen) que impede interações acidentais no mapa de fundo.
