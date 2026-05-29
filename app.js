// BOLAO LANDAU 2026 - Sistema de Apuracao
let participantes = [];
let ranking = [];
let historico = [];

// CARREGAR DADOS DO LOCALSTORAGE
function carregarDados() {
  const p = localStorage.getItem('participantes');
  const r = localStorage.getItem('ranking');
  const h = localStorage.getItem('historico');
  if (p) participantes = JSON.parse(p);
  if (r) ranking = JSON.parse(r);
  if (h) historico = JSON.parse(h);
  atualizarInterfaceParticipantes();
  atualizarRanking();
  atualizarHistorico();
  if (participantes.length > 0) gerarLinhasPalpites();
}

function salvarDados() {
  localStorage.setItem('participantes', JSON.stringify(participantes));
  localStorage.setItem('ranking', JSON.stringify(ranking));
  localStorage.setItem('historico', JSON.stringify(historico));
}

// NAVEGACAO ABAS
function showTab(nome) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
  event.target.classList.add('active');
  document.getElementById('tab-' + nome).classList.remove('hidden');
}

// PARTICIPANTES
function adicionarParticipante() {
  const input = document.getElementById('novo-participante');
  const nome = input.value.trim();
  if (!nome) return alert('Digite o nome do participante');
  if (participantes.includes(nome)) return alert('Participante ja existe');
  participantes.push(nome);
  salvarDados();
  atualizarInterfaceParticipantes();
  gerarLinhasPalpites();
  input.value = '';
}

function removerParticipante(nome) {
  if (!confirm(`Remover ${nome}?`)) return;
  participantes = participantes.filter(p => p !== nome);
  ranking = ranking.filter(r => r.nome !== nome);
  salvarDados();
  atualizarInterfaceParticipantes();
  atualizarRanking();
  gerarLinhasPalpites();
}

function atualizarInterfaceParticipantes() {
  const lista = document.getElementById('lista-participantes-gerenciar');
  if (participantes.length === 0) {
    lista.innerHTML = '<p class="vazio">Nenhum participante cadastrado</p>';
    return;
  }
  lista.innerHTML = participantes.map(p => `
    <div class="participante-item">
      <span>${p}</span>
      <button class="btn-remover" onclick="removerParticipante('${p}')">X</button>
    </div>
  `).join('');
}

function gerarLinhasPalpites() {
  const lista = document.getElementById('lista-palpites');
  if (participantes.length === 0) {
    lista.innerHTML = '<p class="vazio">Adicione participantes primeiro</p>';
    return;
  }
  lista.innerHTML = participantes.map(p => `
    <div class="palpite-linha">
      <input type="text" value="${p}" readonly />
      <input type="number" id="palpite-${p}-casa" min="0" max="20" placeholder="0" />
      <span>X</span>
      <input type="number" id="palpite-${p}-fora" min="0" max="20" placeholder="0" />
    </div>
  `).join('');
}

function adicionarLinhaPalpite() {
  const nome = prompt('Nome do participante:');
  if (!nome) return;
  if (!participantes.includes(nome)) {
    participantes.push(nome);
    salvarDados();
    atualizarInterfaceParticipantes();
  }
  gerarLinhasPalpites();
}

// LOGICA DE PONTUACAO
function calcularPontos(resultadoOficial, palpite) {
  const rCasa = parseInt(resultadoOficial.casa);
  const rFora = parseInt(resultadoOficial.fora);
  const pCasa = parseInt(palpite.casa);
  const pFora = parseInt(palpite.fora);
  
  if (isNaN(pCasa) || isNaN(pFora)) return { pontos: 0, criterio: 'palpite_invalido' };
  
  // Placar exato
  if (rCasa === pCasa && rFora === pFora) {
    return { pontos: 5, criterio: 'placar_exato' };
  }
  
  // Resultado correto (vencedor ou empate)
  const resultadoReal = rCasa > rFora ? 'casa' : rFora > rCasa ? 'fora' : 'empate';
  const resultadoPalpite = pCasa > pFora ? 'casa' : pFora > pCasa ? 'fora' : 'empate';
  
  if (resultadoReal === resultadoPalpite) {
    return { pontos: 3, criterio: 'acertou_resultado' };
  }
  
  // Acertou gols de um time
  if (rCasa === pCasa || rFora === pFora) {
    return { pontos: 1, criterio: 'acertou_um_time' };
  }
  
  return { pontos: 0, criterio: 'errou_tudo' };
}

function gerarComentario(nome, pontos, criterio) {
  const comentarios = {
    placar_exato: [`${nome} e vidente!`, `${nome} acertou tudo!`, `${nome} tirou da cartola!`],
    acertou_resultado: [`${nome} acertou o vencedor`, `${nome} ta ligado`, `${nome} pegou a essencia`],
    acertou_um_time: [`${nome} quase`, `${nome} pegou um gol`, `${nome} salvou a honra`],
    errou_tudo: [`${nome} errou feio`, `${nome} precisa estudar`, `${nome} chutou longe`],
    palpite_invalido: [`${nome} nao enviou palpite valido`]
  };
  const lista = comentarios[criterio] || [];
  return lista[Math.floor(Math.random() * lista.length)];
}

// APURACAO
function apurarRodada() {
  const timeCasa = document.getElementById('time-casa').value.trim();
  const golsCasa = document.getElementById('gols-casa').value;
  const timeFora = document.getElementById('time-fora').value.trim();
  const golsFora = document.getElementById('gols-fora').value;
  const nomeRodada = document.getElementById('nome-rodada').value.trim() || 'Rodada sem nome';
  
  if (!timeCasa || !timeFora || golsCasa === '' || golsFora === '') {
    return alert('Preencha todos os campos do resultado oficial');
  }
  
  const resultadoOficial = { casa: golsCasa, fora: golsFora };
  const resultados = [];
  
  participantes.forEach(p => {
    const pCasa = document.getElementById(`palpite-${p}-casa`).value;
    const pFora = document.getElementById(`palpite-${p}-fora`).value;
    const { pontos, criterio } = calcularPontos(resultadoOficial, { casa: pCasa, fora: pFora });
    const comentario = gerarComentario(p, pontos, criterio);
    resultados.push({ nome: p, palpite: `${pCasa} x ${pFora}`, pontos, criterio, comentario });
  });
  
  // Atualizar ranking
  resultados.forEach(r => {
    const jogador = ranking.find(j => j.nome === r.nome);
    if (jogador) {
      jogador.pontos += r.pontos;
      jogador.rodadas += 1;
    } else {
      ranking.push({ nome: r.nome, pontos: r.pontos, rodadas: 1 });
    }
  });
  
  // Salvar historico
  historico.push({
    rodada: nomeRodada,
    jogo: `${timeCasa} ${golsCasa} x ${golsFora} ${timeFora}`,
    resultados
  });
  
  salvarDados();
  exibirResultado(nomeRodada, timeCasa, golsCasa, timeFora, golsFora, resultados);
  atualizarRanking();
  atualizarHistorico();
}

function exibirResultado(rodada, tCasa, gCasa, tFora, gFora, resultados) {
  const div = document.getElementById('resultado-apuracao');
  div.classList.remove('hidden');
  
  const total = resultados.reduce((s, r) => s + r.pontos, 0);
  const media = (total / resultados.length).toFixed(1);
  
  const narrador = `Rodada ${rodada} finalizada! ${tCasa} ${gCasa} x ${gFora} ${tFora}. ` +
    `Total de ${total} pontos distribuidos, media de ${media} por participante.`;
  
  const tabela = `
    <table>
      <tr>
        <th>Participante</th>
        <th>Palpite</th>
        <th>Pontos</th>
        <th>Comentario</th>
      </tr>
      ${resultados.map(r => `
        <tr>
          <td>${r.nome}</td>
          <td>${r.palpite}</td>
          <td><span class="badge badge-${r.pontos}">${r.pontos}</span></td>
          <td>${r.comentario}</td>
        </tr>
      `).join('')}
    </table>
  `;
  
  div.innerHTML = `
    <h3>Resultado da Apuracao</h3>
    <div class="narrador">${narrador}</div>
    ${tabela}
  `;
  
  div.scrollIntoView({ behavior: 'smooth' });
}

function limparApuracao() {
  document.getElementById('time-casa').value = '';
  document.getElementById('gols-casa').value = '';
  document.getElementById('time-fora').value = '';
  document.getElementById('gols-fora').value = '';
  document.getElementById('nome-rodada').value = '';
  participantes.forEach(p => {
    document.getElementById(`palpite-${p}-casa`).value = '';
    document.getElementById(`palpite-${p}-fora`).value = '';
  });
  document.getElementById('resultado-apuracao').classList.add('hidden');
}

// RANKING
function atualizarRanking() {
  const div = document.getElementById('tabela-ranking');
  if (ranking.length === 0) {
    div.innerHTML = '<p class="vazio">Nenhuma rodada apurada ainda.</p>';
    return;
  }
  
  ranking.sort((a, b) => b.pontos - a.pontos);
  
  div.innerHTML = ranking.map((j, i) => `
    <div class="ranking-item">
      <div class="pos pos-${i + 1}">${i + 1}</div>
      <div class="ranking-nome">${j.nome}</div>
      <div class="ranking-rodadas">${j.rodadas} rodadas</div>
      <div class="ranking-pontos">${j.pontos}</div>
    </div>
  `).join('');
}

function exportarRanking() {
  const json = JSON.stringify({ ranking, historico }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bolao-landau-2026.json';
  a.click();
}

function resetarRanking() {
  if (!confirm('Zerar todo o ranking e historico?')) return;
  ranking = [];
  historico = [];
  salvarDados();
  atualizarRanking();
  atualizarHistorico();
}

// HISTORICO
function atualizarHistorico() {
  const div = document.getElementById('lista-historico');
  if (historico.length === 0) {
    div.innerHTML = '<p class="vazio">Nenhuma rodada registrada ainda.</p>';
    return;
  }
  
  div.innerHTML = historico.map((h, i) => `
    <div class="historico-item">
      <h4>${h.rodada}</h4>
      <div class="placar">${h.jogo}</div>
      <div>${h.resultados.map(r => `${r.nome}: ${r.pontos}pts`).join(' | ')}</div>
    </div>
  `).join('');
}

function limparHistorico() {
  if (!confirm('Limpar todo o historico?')) return;
  historico = [];
  salvarDados();
  atualizarHistorico();
}

// INICIALIZAR
window.addEventListener('DOMContentLoaded', carregarDados);
