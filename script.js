// ========== Login ==========

function login() {
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();

  if (!email || !senha) {
    alert('Preencha todos os campos!');
    return;
  }

  // Simula login armazenando no localStorage
  localStorage.setItem('logado', 'true');
  localStorage.setItem('usuario', email);

  window.location.href = 'dashboard.html';
}

function verificarLogin() {
  if (localStorage.getItem('logado') !== 'true') {
    window.location.href = 'index.html';
  }
}

function logout() {
  localStorage.removeItem('logado');
  localStorage.removeItem('usuario');
  window.location.href = 'index.html';
}

// ========== Lançamentos ==========

function adicionarLancamento() {
  const desc = document.getElementById('desc').value.trim();
  const valor = parseFloat(document.getElementById('valor').value);
  const tipo = document.getElementById('tipo').value;
  const responsavel = document.getElementById('responsavel').value;

  if (!desc || isNaN(valor)) {
    alert('Preencha a descrição e valor corretamente');
    return;
  }

  let lancamentos = JSON.parse(localStorage.getItem('lancamentos')) || [];

  lancamentos.push({
    id: Date.now(),
    descricao: desc,
    valor: valor,
    tipo: tipo,
    responsavel: responsavel,
    data: new Date().toISOString()
  });

  localStorage.setItem('lancamentos', JSON.stringify(lancamentos));

  document.getElementById('desc').value = '';
  document.getElementById('valor').value = '';

  carregarLancamentos();
  desenharGrafico();
  atualizarCarteiraResumo();
}

function carregarLancamentos() {
  const lista = document.getElementById('lista');
  if (!lista) return;

  let lancamentos = JSON.parse(localStorage.getItem('lancamentos')) || [];

  lista.innerHTML = '';

  lancamentos.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.descricao} (£${item.valor.toFixed(2)}) - ${item.tipo} - <strong>${item.responsavel}</strong>
      <button onclick="removerLancamento(${item.id})">X</button>
    `;
    lista.appendChild(li);
  });
}

function removerLancamento(id) {
  let lancamentos = JSON.parse(localStorage.getItem('lancamentos')) || [];
  lancamentos = lancamentos.filter(l => l.id !== id);
  localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
  carregarLancamentos();
  desenharGrafico();
  atualizarCarteiraResumo();
}

// Gráfico mensal da evolução (ganhos e despesas separados por pessoa)
function desenharGrafico() {
  const ctx = document.getElementById('grafico');
  if (!ctx) return;

  let lancamentos = JSON.parse(localStorage.getItem('lancamentos')) || [];

  // Agrupar por mês e responsável
  const meses = [];
  const dadosVitor = { ganho: [], despesa: [] };
  const dadosLaina = { ganho: [], despesa: [] };

  // Função auxiliar para extrair mês/ano string "YYYY-MM"
  function getMesAno(dataISO) {
    return dataISO.slice(0,7);
  }

  // Coletar todos os meses únicos
  lancamentos.forEach(l => {
    const mesAno = getMesAno(l.data);
    if (!meses.includes(mesAno)) meses.push(mesAno);
  });

  meses.sort();

  // Inicializar arrays com zeros
  meses.forEach(() => {
    dadosVitor.ganho.push(0);
    dadosVitor.despesa.push(0);
    dadosLaina.ganho.push(0);
    dadosLaina.despesa.push(0);
  });

  // Preencher os valores
  lancamentos.forEach(l => {
    const mesAno = getMesAno(l.data);
    const idx = meses.indexOf(mesAno);
    if (l.responsavel === 'vitor') {
      if (l.tipo === 'ganho') dadosVitor.ganho[idx] += l.valor;
      else dadosVitor.despesa[idx] += l.valor;
    } else {
      if (l.tipo === 'ganho') dadosLaina.ganho[idx] += l.valor;
      else dadosLaina.despesa[idx] += l.valor;
    }
  });

  // Remover gráfico anterior para evitar sobreposição
  if (window.chartInstance) window.chartInstance.destroy();

  window.chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: meses,
      datasets: [
        {
          label: 'Ganhos Vitor',
          data: dadosVitor.ganho,
          borderColor: 'rgba(75, 192, 192, 1)',
          fill: false,
          tension: 0.3,
        },
        {
          label: 'Despesas Vitor',
          data: dadosVitor.despesa,
          borderColor: 'rgba(255, 99, 132, 1)',
          fill: false,
          tension: 0.3,
        },
        {
          label: 'Ganhos Laina',
          data: dadosLaina.ganho,
          borderColor: 'rgba(54, 162, 235, 1)',
          fill: false,
          tension: 0.3,
        },
        {
          label: 'Despesas Laina',
          data: dadosLaina.despesa,
          borderColor: 'rgba(255, 206, 86, 1)',
          fill: false,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      stacked: false,
      plugins: {
        title: {
          display: true,
          text: 'Evolução Mensal de Ganhos e Despesas',
          font: { size: 18 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: val => `£${val}` }
        }
      }
    }
  });
}

// ========== Investimentos ==========

function adicionarInvestimento(event) {
  event.preventDefault();

  const tipo = document.getElementById('tipoInvestimento').value.trim();
  const valor = parseFloat(document.getElementById('valorInvestimento').value);
  const data = document.getElementById('dataInvestimento').value;
  const rentEsperada = parseFloat(document.getElementById('rentabilidadeEsperada').value);

  if (!tipo || isNaN(valor) || !data || isNaN(rentEsperada)) {
    alert('Preencha todos os campos corretamente.');
    return;
  }

  let investimentos = JSON.parse(localStorage.getItem('investimentos')) || [];

  investimentos.push({
    id: Date.now(),
    tipo,
    valor,
    data,
    rentabilidadeEsperada: rentEsperada,
    rentabilidadeReal: null, // pode atualizar depois
    status: 'ativo',
  });

  localStorage.setItem('investimentos', JSON.stringify(investimentos));

  document.getElementById('formInvestimento').reset();

  carregarTudoInvestimentos();
  atualizarCarteiraResumo();
}

function carregarTudoInvestimentos() {
  const lista = document.getElementById('listaInvestimentos');
  if (!lista) return;

  let investimentos = JSON.parse(localStorage.getItem('investimentos')) || [];

  lista.innerHTML = '';

  investimentos.forEach(inv => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${inv.tipo} - £${inv.valor.toFixed(2)} - ${inv.data} - ${inv.rentabilidadeEsperada.toFixed(2)}%
      <button onclick="removerInvestimento(${inv.id})">X</button>
    `;
    lista.appendChild(li);
  });

  desenharGraficoInvestimentos();
}

function removerInvestimento(id) {
  let investimentos = JSON.parse(localStorage.getItem('investimentos')) || [];
  investimentos = investimentos.filter(inv => inv.id !== id);
  localStorage.setItem('investimentos', JSON.stringify(investimentos));
  carregarTudoInvestimentos();
  atualizarCarteiraResumo();
}

function desenharGraficoInvestimentos() {
  const ctx = document.getElementById('graficoInvestimentos');
  if (!ctx) return;

  let investimentos = JSON.parse(localStorage.getItem('investimentos')) || [];

  // Agrupar por mês (data aporte) e somar valor investido
  const meses = [];
  const valoresPorMes = {};

  investimentos.forEach(inv => {
    const mesAno = inv.data.slice(0,7);
    if (!meses.includes(mesAno)) meses.push(mesAno);
    valoresPorMes[mesAno] = (valoresPorMes[mesAno] || 0) + inv.valor;
  });

  meses.sort();

  const dadosValores = meses.map(m => valoresPorMes[m]);

  if (window.chartInvestimentos) window.chartInvestimentos.destroy();

  window.chartInvestimentos = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: meses,
      datasets: [{
        label: 'Valor Investido por Mês (£)',
        data: dadosValores,
        backgroundColor: 'rgba(255, 159, 64, 0.7)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Investimentos Mensais',
          font: { size: 18 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: val => `£${val}` }
        }
      }
    }
  });
}

// ========== Carteira Resumo ==========

function atualizarCarteiraResumo() {
  let lancamentos = JSON.parse(localStorage.getItem('lancamentos')) || [];
  let investimentos = JSON.parse(localStorage.getItem('investimentos')) || [];

  // Saldo total: ganhos - despesas (todos os lançamentos)
  const saldoTotal = lancamentos.reduce((acc, l) => {
    return l.tipo === 'ganho' ? acc + l.valor : acc - l.valor;
  }, 0);

  // Saldo do mês atual (guardando este mês)
  const agora = new Date();
  const mesAtual = agora.toISOString().slice(0,7);

  const lancamentosMesAtual = lancamentos.filter(l => l.data.slice(0,7) === mesAtual);

  const saldoMesAtual = lancamentosMesAtual.reduce((acc, l) => {
    return l.tipo === 'ganho' ? acc + l.valor : acc - l.valor;
  }, 0);

  // Total investido
  const totalInvestido = investimentos.reduce((acc, inv) => acc + inv.valor, 0);

  document.getElementById('saldoGuardado').textContent = `£${saldoTotal.toFixed(2)}`;
  document.getElementById('guardandoMes').textContent = `£${saldoMesAtual.toFixed(2)}`;
  document.getElementById('totalInvestido').textContent = `£${totalInvestido.toFixed(2)}`;
}