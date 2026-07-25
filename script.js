/* ==========================================================================
   CONFIGURAÇÃO
   ========================================================================== */
const API_URL = "http://localhost:3000";

/* ==========================================================================
   ESTADO DA APLICAÇÃO
   Guarda em memória as três coleções vindas do json-server e o chamado
   atualmente selecionado no painel de administração. Todas as funções de
   renderização leem apenas destas variáveis, nunca fazem fetch direto.
   ========================================================================== */
const estado = {
  chamados: [],
  tecnicos: [],
  interacoes: [],
  chamadoSelecionadoId: null,
};

/* ==========================================================================
   SELEÇÃO DO DOM
   Centraliza os elementos usados em mais de um lugar. Elementos que só
   existem em uma das páginas (index.html ou admin.html) retornam null na
   outra página — por isso todo acesso é protegido com checagem de null.
   ========================================================================== */
const dom = {
  // index.html — hero e listagem pública
  btnAbrirChamado: document.getElementById("btn-abrir-chamado"),
  btnVazioCadastrar: document.getElementById("btn-vazio-cadastrar"),
  buscaTitulo: document.getElementById("busca-titulo"),
  filtroStatus: document.getElementById("filtro-status"),
  listaChamados: document.getElementById("lista-chamados"),
  estadoVazio: document.getElementById("estado-vazio"),

  modalChamado: document.getElementById("modal-chamado"),
  fecharModalChamado: document.getElementById("fechar-modal-chamado"),
  cancelarFormChamado: document.getElementById("cancelar-form-chamado"),
  formChamado: document.getElementById("form-chamado"),
  msgFormChamado: document.getElementById("msg-form-chamado"),

  // admin.html — abas
  tabChamados: document.getElementById("tab-chamados"),
  tabTecnicos: document.getElementById("tab-tecnicos"),
  painelChamados: document.getElementById("painel-chamados"),
  painelTecnicos: document.getElementById("painel-tecnicos"),

  // admin.html — gestão de chamados
  adminBuscaTitulo: document.getElementById("admin-busca-titulo"),
  adminFiltroStatus: document.getElementById("admin-filtro-status"),
  adminListaChamados: document.getElementById("admin-lista-chamados"),
  semSelecao: document.getElementById("sem-selecao"),
  ticketDetail: document.getElementById("ticket-detail"),
  tdTitulo: document.getElementById("td-titulo"),
  tdDescricao: document.getElementById("td-descricao"),
  tdSolicitante: document.getElementById("td-solicitante"),
  tdStatus: document.getElementById("td-status"),
  tdPrioridade: document.getElementById("td-prioridade"),
  tdTecnico: document.getElementById("td-tecnico"),
  tdSelectStatus: document.getElementById("td-select-status"),
  tdSelectTecnico: document.getElementById("td-select-tecnico"),
  intAutor: document.getElementById("int-autor"),
  intTipo: document.getElementById("int-tipo"),
  intMensagem: document.getElementById("int-mensagem"),
  msgFormInteracao: document.getElementById("msg-form-interacao"),
  btnRegistrarInteracao: document.getElementById("btn-registrar-interacao"),
  timeline: document.getElementById("timeline"),

  // admin.html — técnicos
  btnNovoTecnico: document.getElementById("btn-novo-tecnico"),
  tabelaTecnicos: document.getElementById("tabela-tecnicos"),
  modalTecnico: document.getElementById("modal-tecnico"),
  modalTecnicoTitulo: document.getElementById("modal-tecnico-titulo"),
  fecharModalTecnico: document.getElementById("fechar-modal-tecnico"),
  cancelarFormTecnico: document.getElementById("cancelar-form-tecnico"),
  formTecnico: document.getElementById("form-tecnico"),
  msgFormTecnico: document.getElementById("msg-form-tecnico"),
  tId: document.getElementById("t-id"),
  tNome: document.getElementById("t-nome"),
  tEmail: document.getElementById("t-email"),
  tEspecialidade: document.getElementById("t-especialidade"),
  tAtivo: document.getElementById("t-ativo"),
};

/* ==========================================================================
   CHAMADAS À API (json-server)
   Toda comunicação com o backend fake passa por estas quatro funções.
   Cada uma usa try/catch, confere response.ok e propaga o erro para quem
   chamou, que decide como dar feedback visível ao usuário.
   ========================================================================== */

/* Busca uma coleção inteira (chamados, tecnicos ou interacoes). */
async function apiGet(recurso) {
  const resposta = await fetch(`${API_URL}/${recurso}`);
  if (!resposta.ok) {
    throw new Error(`Falha ao buscar ${recurso} (HTTP ${resposta.status})`);
  }
  return resposta.json();
}

/* Cria um novo registro em uma coleção. */
async function apiPost(recurso, dados) {
  const resposta = await fetch(`${API_URL}/${recurso}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  if (!resposta.ok) {
    throw new Error(`Falha ao criar registro em ${recurso} (HTTP ${resposta.status})`);
  }
  return resposta.json();
}

/* Atualiza parcialmente um registro existente. */
async function apiPatch(recurso, id, dados) {
  const resposta = await fetch(`${API_URL}/${recurso}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  if (!resposta.ok) {
    throw new Error(`Falha ao atualizar registro em ${recurso} (HTTP ${resposta.status})`);
  }
  return resposta.json();
}

/* Remove um registro existente. */
async function apiDelete(recurso, id) {
  const resposta = await fetch(`${API_URL}/${recurso}/${id}`, { method: "DELETE" });
  if (!resposta.ok) {
    throw new Error(`Falha ao remover registro em ${recurso} (HTTP ${resposta.status})`);
  }
}

/* Carrega as três coleções em paralelo e guarda no estado da aplicação. */
async function carregarDados() {
  try {
    const [chamados, tecnicos, interacoes] = await Promise.all([
      apiGet("chamados"),
      apiGet("tecnicos"),
      apiGet("interacoes"),
    ]);
    estado.chamados = chamados;
    estado.tecnicos = tecnicos;
    estado.interacoes = interacoes;
  } catch (erro) {
    mostrarErroApi(
      "Não foi possível carregar os dados. Verifique se o json-server está rodando em " + API_URL + "."
    );
    throw erro;
  }
}

/* ==========================================================================
   UTILIDADES
   ========================================================================== */

/* Gera um id simples e único para novos registros (o json-server aceita id
   enviado pelo cliente, não é obrigatório ser numérico sequencial). */
function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* Retorna o nome de um técnico a partir do id, ou "Não atribuído". */
function nomeTecnico(tecnicoId) {
  if (!tecnicoId) return "Não atribuído";
  const tecnico = estado.tecnicos.find((t) => t.id === tecnicoId);
  return tecnico ? tecnico.nome : "Não atribuído";
}

/* Formata uma data ISO para o padrão brasileiro, no fuso do navegador. */
function formatarData(dataIso) {
  const data = new Date(dataIso);
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* Calcula a prioridade de um chamado a partir da última interação
   registrada (ou da data de abertura, se ainda não houver interação).
   Chamados Resolvido/Fechado sempre retornam "Encerrado", fora da regra
   de tempo. O cálculo acontece inteiramente no frontend a cada renderização. */
function calcularPrioridade(chamado) {
  if (chamado.status === "Resolvido" || chamado.status === "Fechado") {
    return "Encerrado";
  }

  const interacoesDoChamado = estado.interacoes.filter((i) => i.chamadoId === chamado.id);
  let dataReferencia = chamado.dataAbertura;
  interacoesDoChamado.forEach((interacao) => {
    if (new Date(interacao.data) > new Date(dataReferencia)) {
      dataReferencia = interacao.data;
    }
  });

  const horasSemResposta = (Date.now() - new Date(dataReferencia).getTime()) / 3600000;

  if (horasSemResposta < 24) return "Normal";
  if (horasSemResposta <= 72) return "Atenção";
  return "Crítico";
}

/* Retorna a classe de badge (Bootstrap) correspondente a uma prioridade. */
function classeBadgePrioridade(prioridade) {
  if (prioridade === "Normal") return "text-bg-success";
  if (prioridade === "Atenção") return "text-bg-warning";
  if (prioridade === "Crítico") return "text-bg-danger";
  return "text-bg-secondary"; // Encerrado
}

/* Mostra um erro de API em um toast (SweetAlert2) no canto da tela. */
function mostrarErroApi(mensagem) {
  if (!window.Swal) return;
  Swal.mixin({
    toast: true,
    position: "bottom-end",
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
  }).fire({ icon: "error", title: mensagem });
}

/* Exibe uma mensagem de erro abaixo de um campo e a remove quando o campo
   for corrigido (chamando limparErroCampo no próprio listener de input). */
function mostrarErroCampo(idErro, mensagem) {
  const elemento = document.getElementById(idErro);
  if (elemento) elemento.textContent = mensagem;
}

function limparErroCampo(idErro) {
  const elemento = document.getElementById(idErro);
  if (elemento) elemento.textContent = "";
}

/* ==========================================================================
   VALIDAÇÕES
   ========================================================================== */

function validarFormChamado() {
  let valido = true;

  const titulo = dom.formChamado.titulo.value.trim();
  if (titulo.length < 5 || titulo.length > 120) {
    mostrarErroCampo("erro-c-titulo", "Título obrigatório, entre 5 e 120 caracteres.");
    valido = false;
  } else {
    limparErroCampo("erro-c-titulo");
  }

  const descricao = dom.formChamado.descricao.value.trim();
  if (descricao.length < 10) {
    mostrarErroCampo("erro-c-descricao", "Descrição obrigatória, mínimo de 10 caracteres.");
    valido = false;
  } else {
    limparErroCampo("erro-c-descricao");
  }

  const solicitante = dom.formChamado.solicitante.value.trim();
  if (solicitante.length < 3) {
    mostrarErroCampo("erro-c-solicitante", "Informe seu nome completo.");
    valido = false;
  } else {
    limparErroCampo("erro-c-solicitante");
  }

  return valido;
}

function validarFormInteracao() {
  let valido = true;

  if (dom.intAutor.value.trim().length < 3) {
    mostrarErroCampo("erro-int-autor", "Informe o nome do autor.");
    valido = false;
  } else {
    limparErroCampo("erro-int-autor");
  }

  if (dom.intMensagem.value.trim().length < 3) {
    mostrarErroCampo("erro-int-mensagem", "Mensagem obrigatória.");
    valido = false;
  } else {
    limparErroCampo("erro-int-mensagem");
  }

  return valido;
}

function validarFormTecnico() {
  let valido = true;
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (dom.tNome.value.trim().length < 3) {
    mostrarErroCampo("erro-t-nome", "Nome obrigatório, mínimo de 3 caracteres.");
    valido = false;
  } else {
    limparErroCampo("erro-t-nome");
  }

  if (!regexEmail.test(dom.tEmail.value.trim())) {
    mostrarErroCampo("erro-t-email", "Informe um e-mail válido.");
    valido = false;
  } else {
    limparErroCampo("erro-t-email");
  }

  if (dom.tEspecialidade.value.trim().length < 3) {
    mostrarErroCampo("erro-t-especialidade", "Especialidade obrigatória.");
    valido = false;
  } else {
    limparErroCampo("erro-t-especialidade");
  }

  return valido;
}

/* ==========================================================================
   RENDERIZAÇÃO — Listagem pública (index.html)
   Uma única função apaga e recria todos os cards a cada chamada. Nunca
   altera um card isoladamente: busca, filtro e cadastro sempre passam
   por aqui de novo.
   ========================================================================== */
function renderizarListagemPublica() {
  if (!dom.listaChamados) return;

  const termoBusca = (dom.buscaTitulo.value || "").toLowerCase();
  const statusFiltro = dom.filtroStatus.value;

  const chamadosFiltrados = estado.chamados
    .filter((c) => c.titulo.toLowerCase().includes(termoBusca))
    .filter((c) => (statusFiltro ? c.status === statusFiltro : true));

  const chamadosOrdenados = [...chamadosFiltrados].sort((a, b) =>
    a.titulo.localeCompare(b.titulo, "pt-BR")
  );

  dom.listaChamados.innerHTML = "";

  if (chamadosOrdenados.length === 0) {
    dom.listaChamados.hidden = true;
    dom.estadoVazio.hidden = false;
    return;
  }

  dom.listaChamados.hidden = false;
  dom.estadoVazio.hidden = true;

  chamadosOrdenados.forEach((chamado) => {
    const prioridade = calcularPrioridade(chamado);
    const semTecnico = !chamado.tecnicoId;

    const card = document.createElement("article");
    card.className =
      "ticket-card card h-100 shadow-sm" + (semTecnico ? " ticket-card--unassigned" : "");

    card.innerHTML = `
      <div class="card-body">
      <div class="ticket-card__top">
        <span class="ticket-card__title">${chamado.titulo}</span>
        <span class="badge ${classeBadgePrioridade(prioridade)}">${prioridade}</span>
      </div>
      <div class="ticket-card__meta">
        <span class="badge text-bg-secondary">${chamado.status}</span>
        ${semTecnico ? '<span class="badge text-bg-danger">Não atribuído</span>' : `<span>${nomeTecnico(chamado.tecnicoId)}</span>`}
      </div>
      <div class="ticket-card__meta">
        <span>Aberto em ${formatarData(chamado.dataAbertura)}</span>
      </div>
      </div>
    `;

    dom.listaChamados.appendChild(card);
  });
}

/* ==========================================================================
   RENDERIZAÇÃO — Painel de administração (admin.html)
   ========================================================================== */

/* Recria a lista de chamados do painel de administração, com destaque
   para prioridade Crítico. */
function renderizarListaAdmin() {
  if (!dom.adminListaChamados) return;

  const termoBusca = (dom.adminBuscaTitulo.value || "").toLowerCase();
  const statusFiltro = dom.adminFiltroStatus.value;

  const chamadosFiltrados = estado.chamados
    .filter((c) => c.titulo.toLowerCase().includes(termoBusca))
    .filter((c) => (statusFiltro ? c.status === statusFiltro : true));

  const chamadosOrdenados = [...chamadosFiltrados].sort((a, b) =>
    a.titulo.localeCompare(b.titulo, "pt-BR")
  );

  dom.adminListaChamados.innerHTML = "";

  chamadosOrdenados.forEach((chamado) => {
    const prioridade = calcularPrioridade(chamado);
    const linha = document.createElement("div");
    linha.className =
      "detail-row" +
      (chamado.id === estado.chamadoSelecionadoId ? " is-selected" : "") +
      (prioridade === "Crítico" ? " ticket-card--critical" : "");

    linha.innerHTML = `
      <div>
        <div style="font-weight:600;">${chamado.titulo}</div>
        <div class="ticket-card__meta">
          <span class="badge text-bg-secondary">${chamado.status}</span>
          ${!chamado.tecnicoId ? '<span class="badge text-bg-danger">Não atribuído</span>' : ""}
        </div>
      </div>
      <span class="badge ${classeBadgePrioridade(prioridade)}">${prioridade}</span>
    `;

    linha.addEventListener("click", () => selecionarChamado(chamado.id));
    dom.adminListaChamados.appendChild(linha);
  });
}

/* Marca um chamado como selecionado e renderiza o painel de detalhe. */
function selecionarChamado(id) {
  estado.chamadoSelecionadoId = id;
  renderizarListaAdmin();
  renderizarDetalheChamado();
}

/* Preenche o painel de detalhe (dados, ações e histórico) do chamado
   atualmente selecionado. Se nada estiver selecionado, mostra o aviso. */
function renderizarDetalheChamado() {
  if (!dom.ticketDetail) return;

  const chamado = estado.chamados.find((c) => c.id === estado.chamadoSelecionadoId);

  if (!chamado) {
    dom.ticketDetail.hidden = true;
    dom.semSelecao.hidden = false;
    return;
  }

  dom.ticketDetail.hidden = false;
  dom.semSelecao.hidden = true;

  const prioridade = calcularPrioridade(chamado);

  dom.tdTitulo.textContent = chamado.titulo;
  dom.tdDescricao.textContent = chamado.descricao;
  dom.tdSolicitante.textContent = chamado.solicitante;
  dom.tdStatus.innerHTML = `<span class="badge text-bg-secondary">${chamado.status}</span>`;
  dom.tdPrioridade.innerHTML = `<span class="badge ${classeBadgePrioridade(prioridade)}">${prioridade}</span>`;
  dom.tdTecnico.textContent = nomeTecnico(chamado.tecnicoId);

  dom.tdSelectStatus.value = chamado.status;

  // Preenche o select de técnicos apenas com técnicos ativos
  const tecnicosAtivos = estado.tecnicos.filter((t) => t.ativo);
  dom.tdSelectTecnico.innerHTML =
    '<option value="">Não atribuído</option>' +
    tecnicosAtivos.map((t) => `<option value="${t.id}">${t.nome}</option>`).join("");
  dom.tdSelectTecnico.value = chamado.tecnicoId || "";

  renderizarTimeline(chamado.id);
}

/* Recria a linha do tempo de interações de um chamado, mais recente primeiro. */
function renderizarTimeline(chamadoId) {
  const interacoes = estado.interacoes
    .filter((i) => i.chamadoId === chamadoId)
    .sort((a, b) => new Date(b.data) - new Date(a.data));

  dom.timeline.innerHTML = "";

  if (interacoes.length === 0) {
    dom.timeline.innerHTML = '<p style="color:var(--muted); font-size:0.88rem;">Nenhuma interação registrada ainda.</p>';
    return;
  }

  interacoes.forEach((interacao) => {
    const item = document.createElement("div");
    item.className = "timeline-item";
    item.innerHTML = `
      <div class="timeline-item__meta">${interacao.autor} · ${formatarData(interacao.data)} · ${interacao.tipo}</div>
      <div class="timeline-item__msg">${interacao.mensagem}</div>
    `;
    dom.timeline.appendChild(item);
  });
}

/* Recria a tabela de técnicos cadastrados. */
function renderizarTabelaTecnicos() {
  if (!dom.tabelaTecnicos) return;

  dom.tabelaTecnicos.innerHTML = "";

  estado.tecnicos.forEach((tecnico) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${tecnico.nome}</td>
      <td>${tecnico.email}</td>
      <td>${tecnico.especialidade}</td>
      <td><span class="badge ${tecnico.ativo ? "text-bg-success" : "text-bg-danger"}">${tecnico.ativo ? "Ativo" : "Inativo"}</span></td>
      <td class="actions-cell">
        <button type="button" class="btn btn-outline-secondary btn-sm" data-editar="${tecnico.id}"><i class="fa-solid fa-pen"></i></button>
        <button type="button" class="btn btn-outline-danger btn-sm" data-excluir="${tecnico.id}"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    dom.tabelaTecnicos.appendChild(linha);
  });

  dom.tabelaTecnicos.querySelectorAll("[data-editar]").forEach((botao) => {
    botao.addEventListener("click", () => abrirModalTecnico(botao.dataset.editar));
  });
  dom.tabelaTecnicos.querySelectorAll("[data-excluir]").forEach((botao) => {
    botao.addEventListener("click", () => excluirTecnico(botao.dataset.excluir));
  });
}

/* Re-renderiza tudo que depende do estado atual — chamada após qualquer
   operação de escrita (criar, atualizar, excluir) para manter a tela
   sincronizada com os dados mais recentes. */
function renderizarTudo() {
  renderizarListagemPublica();
  renderizarListaAdmin();
  renderizarDetalheChamado();
  renderizarTabelaTecnicos();
  renderizarProgressoResolvidos();
}

/* ==========================================================================
   PROGRESSO — Percentual de chamados resolvidos, exibido em admin.html
   ========================================================================== */
function renderizarProgressoResolvidos() {
  const barraResolvidos = document.getElementById("progresso-resolvidos-barra");
  const barraPendentes = document.getElementById("progresso-pendentes-barra");
  const texto = document.getElementById("progresso-resolvidos-texto");
  if (!barraResolvidos || !barraPendentes || !texto) return;

  const total = estado.chamados.length;
  const resolvidos = estado.chamados.filter((c) => c.status === "Resolvido").length;
  const percentualResolvidos = total === 0 ? 0 : Math.round((resolvidos / total) * 100);
  const percentualPendentes = 100 - percentualResolvidos;

  // Dois segmentos explícitos: o verde SÓ cresce com resolvidos, o cinza
  // preenche o restante — evita que o fundo do .progress pareça "cheio"
  // de pendentes quando na verdade não há nenhum chamado resolvido.
  barraResolvidos.style.width = percentualResolvidos + "%";
  barraPendentes.style.width = percentualPendentes + "%";
  barraResolvidos.parentElement.setAttribute("aria-valuenow", String(percentualResolvidos));
  texto.textContent = `${resolvidos} de ${total} (${percentualResolvidos}%)`;
}

/* ==========================================================================
   MODAIS (Bootstrap)
   Cada modal usa bootstrap.Modal.getOrCreateInstance, reaproveitando a
   mesma instância entre aberturas/fechamentos.
   ========================================================================== */
function obterModal(elemento) {
  if (!elemento || !window.bootstrap) return null;
  return bootstrap.Modal.getOrCreateInstance(elemento);
}

/* ==========================================================================
   EVENTOS — Modal de chamado
   ========================================================================== */
function abrirModalChamado() {
  const modal = obterModal(dom.modalChamado);
  if (!modal) return;
  dom.modalChamado.addEventListener("shown.bs.modal", () => dom.formChamado.titulo.focus(), { once: true });
  modal.show();
}

function fecharModalChamado() {
  const modal = obterModal(dom.modalChamado);
  if (!modal) return;
  modal.hide();
  dom.formChamado.reset();
  dom.msgFormChamado.className = "form-message";
  dom.msgFormChamado.textContent = "";
  ["erro-c-titulo", "erro-c-descricao", "erro-c-solicitante", "erro-c-categoria"].forEach(limparErroCampo);
}

if (dom.btnAbrirChamado) dom.btnAbrirChamado.addEventListener("click", abrirModalChamado);
if (dom.btnVazioCadastrar) dom.btnVazioCadastrar.addEventListener("click", abrirModalChamado);
if (dom.fecharModalChamado) dom.fecharModalChamado.addEventListener("click", fecharModalChamado);
if (dom.cancelarFormChamado) dom.cancelarFormChamado.addEventListener("click", fecharModalChamado);

// Remove a mensagem de erro assim que o campo correspondente for corrigido
["c-titulo", "c-descricao", "c-solicitante"].forEach((idCampo) => {
  const campo = document.getElementById(idCampo);
  if (campo) campo.addEventListener("input", () => limparErroCampo("erro-" + idCampo));
});

if (dom.formChamado) {
  dom.formChamado.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (!validarFormChamado()) return;

    const novoChamado = {
      id: gerarId(),
      titulo: dom.formChamado.titulo.value.trim(),
      descricao: dom.formChamado.descricao.value.trim(),
      solicitante: dom.formChamado.solicitante.value.trim(),
      categoria: dom.formChamado.categoria.value.trim() || null,
      status: "Aberto",
      tecnicoId: null,
      prioridade: "Normal",
      dataAbertura: new Date().toISOString(),
    };

    try {
      const criado = await apiPost("chamados", novoChamado);
      estado.chamados.push(criado);
      renderizarTudo();

      dom.msgFormChamado.className = "form-message form-message--success";
      dom.msgFormChamado.textContent = "Chamado cadastrado com sucesso.";
      dom.formChamado.reset();

      setTimeout(fecharModalChamado, 1400);
    } catch (erro) {
      dom.msgFormChamado.className = "form-message form-message--error";
      dom.msgFormChamado.textContent = "Não foi possível enviar o chamado. Tente novamente.";
    }
  });
}

/* ==========================================================================
   EVENTOS — Busca e filtro (index.html)
   ========================================================================== */
if (dom.buscaTitulo) dom.buscaTitulo.addEventListener("input", renderizarListagemPublica);
if (dom.filtroStatus) dom.filtroStatus.addEventListener("change", renderizarListagemPublica);

/* ==========================================================================
   EVENTOS — Abas do painel de administração
   ========================================================================== */
function ativarAba(nome) {
  const chamadosAtiva = nome === "chamados";
  dom.tabChamados.classList.toggle("active", chamadosAtiva);
  dom.tabTecnicos.classList.toggle("active", !chamadosAtiva);
  dom.tabChamados.setAttribute("aria-selected", String(chamadosAtiva));
  dom.tabTecnicos.setAttribute("aria-selected", String(!chamadosAtiva));
  dom.painelChamados.classList.toggle("d-none", !chamadosAtiva);
  dom.painelTecnicos.classList.toggle("d-none", chamadosAtiva);
}

if (dom.tabChamados) dom.tabChamados.addEventListener("click", () => ativarAba("chamados"));
if (dom.tabTecnicos) dom.tabTecnicos.addEventListener("click", () => ativarAba("tecnicos"));

/* ==========================================================================
   EVENTOS — Busca, filtro e ações do painel de chamados (admin.html)
   ========================================================================== */
if (dom.adminBuscaTitulo) dom.adminBuscaTitulo.addEventListener("input", renderizarListaAdmin);
if (dom.adminFiltroStatus) dom.adminFiltroStatus.addEventListener("change", renderizarListaAdmin);

/* Altera o status do chamado selecionado, registra a mudança no histórico
   e recalcula a prioridade automaticamente na próxima renderização. */
if (dom.tdSelectStatus) {
  dom.tdSelectStatus.addEventListener("change", async () => {
    const chamado = estado.chamados.find((c) => c.id === estado.chamadoSelecionadoId);
    if (!chamado) return;

    const statusAnterior = chamado.status;
    const novoStatus = dom.tdSelectStatus.value;
    if (novoStatus === statusAnterior) return;

    try {
      await apiPatch("chamados", chamado.id, { status: novoStatus });
      chamado.status = novoStatus;

      const interacao = {
        id: gerarId(),
        chamadoId: chamado.id,
        autor: "Sistema",
        tipo: "mudanca_status",
        mensagem: `Status alterado de ${statusAnterior} para ${novoStatus}.`,
        data: new Date().toISOString(),
      };
      const interacaoCriada = await apiPost("interacoes", interacao);
      estado.interacoes.push(interacaoCriada);

      renderizarTudo();
    } catch (erro) {
      mostrarErroApi("Não foi possível alterar o status do chamado.");
      dom.tdSelectStatus.value = statusAnterior;
    }
  });
}

/* Atribui ou reatribui o técnico responsável pelo chamado selecionado. */
if (dom.tdSelectTecnico) {
  dom.tdSelectTecnico.addEventListener("change", async () => {
    const chamado = estado.chamados.find((c) => c.id === estado.chamadoSelecionadoId);
    if (!chamado) return;

    const tecnicoAnteriorId = chamado.tecnicoId;
    const novoTecnicoId = dom.tdSelectTecnico.value || null;
    if (novoTecnicoId === tecnicoAnteriorId) return;

    try {
      await apiPatch("chamados", chamado.id, { tecnicoId: novoTecnicoId });
      chamado.tecnicoId = novoTecnicoId;

      const interacao = {
        id: gerarId(),
        chamadoId: chamado.id,
        autor: "Sistema",
        tipo: "atribuicao",
        mensagem: `Técnico responsável alterado para ${nomeTecnico(novoTecnicoId)}.`,
        data: new Date().toISOString(),
      };
      const interacaoCriada = await apiPost("interacoes", interacao);
      estado.interacoes.push(interacaoCriada);

      renderizarTudo();
    } catch (erro) {
      mostrarErroApi("Não foi possível atribuir o técnico ao chamado.");
      dom.tdSelectTecnico.value = tecnicoAnteriorId || "";
    }
  });
}

// Remove a mensagem de erro assim que o campo correspondente for corrigido
["int-autor", "int-mensagem"].forEach((idCampo) => {
  const campo = document.getElementById(idCampo);
  if (campo) campo.addEventListener("input", () => limparErroCampo("erro-" + idCampo));
});

/* Registra manualmente uma interação (pedido de informação ou comentário)
   no chamado selecionado. */
if (dom.btnRegistrarInteracao) {
  dom.btnRegistrarInteracao.addEventListener("click", async () => {
    const chamado = estado.chamados.find((c) => c.id === estado.chamadoSelecionadoId);
    if (!chamado || !validarFormInteracao()) return;

    const interacao = {
      id: gerarId(),
      chamadoId: chamado.id,
      autor: dom.intAutor.value.trim(),
      tipo: dom.intTipo.value,
      mensagem: dom.intMensagem.value.trim(),
      data: new Date().toISOString(),
    };

    try {
      const criada = await apiPost("interacoes", interacao);
      estado.interacoes.push(criada);

      dom.msgFormInteracao.className = "form-message form-message--success";
      dom.msgFormInteracao.textContent = "Interação registrada com sucesso.";
      dom.intAutor.value = "";
      dom.intMensagem.value = "";

      renderizarTudo();
      setTimeout(() => {
        dom.msgFormInteracao.className = "form-message";
        dom.msgFormInteracao.textContent = "";
      }, 2000);
    } catch (erro) {
      dom.msgFormInteracao.className = "form-message form-message--error";
      dom.msgFormInteracao.textContent = "Não foi possível registrar a interação.";
    }
  });
}

/* ==========================================================================
   EVENTOS — Modal e CRUD de técnicos (admin.html)
   ========================================================================== */
function abrirModalTecnico(tecnicoId) {
  if (!dom.modalTecnico) return;

  dom.formTecnico.reset();
  ["erro-t-nome", "erro-t-email", "erro-t-especialidade"].forEach(limparErroCampo);
  dom.msgFormTecnico.className = "form-message";
  dom.msgFormTecnico.textContent = "";

  const tecnico = tecnicoId ? estado.tecnicos.find((t) => t.id === tecnicoId) : null;

  dom.modalTecnicoTitulo.textContent = tecnico ? "Editar técnico" : "Novo técnico";
  dom.tId.value = tecnico ? tecnico.id : "";
  dom.tNome.value = tecnico ? tecnico.nome : "";
  dom.tEmail.value = tecnico ? tecnico.email : "";
  dom.tEspecialidade.value = tecnico ? tecnico.especialidade : "";
  dom.tAtivo.checked = tecnico ? tecnico.ativo : true;

  const modal = obterModal(dom.modalTecnico);
  if (!modal) return;
  dom.modalTecnico.addEventListener("shown.bs.modal", () => dom.tNome.focus(), { once: true });
  modal.show();
}

function fecharModalTecnico() {
  const modal = obterModal(dom.modalTecnico);
  if (!modal) return;
  modal.hide();
}

if (dom.btnNovoTecnico) dom.btnNovoTecnico.addEventListener("click", () => abrirModalTecnico(null));
if (dom.fecharModalTecnico) dom.fecharModalTecnico.addEventListener("click", fecharModalTecnico);
if (dom.cancelarFormTecnico) dom.cancelarFormTecnico.addEventListener("click", fecharModalTecnico);

["t-nome", "t-email", "t-especialidade"].forEach((idCampo) => {
  const campo = document.getElementById(idCampo);
  if (campo) campo.addEventListener("input", () => limparErroCampo("erro-" + idCampo));
});

if (dom.formTecnico) {
  dom.formTecnico.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (!validarFormTecnico()) return;

    const dadosTecnico = {
      nome: dom.tNome.value.trim(),
      email: dom.tEmail.value.trim(),
      especialidade: dom.tEspecialidade.value.trim(),
      ativo: dom.tAtivo.checked,
    };

    try {
      if (dom.tId.value) {
        // Edição de técnico existente
        const atualizado = await apiPatch("tecnicos", dom.tId.value, dadosTecnico);
        const indice = estado.tecnicos.findIndex((t) => t.id === dom.tId.value);
        estado.tecnicos[indice] = atualizado;
      } else {
        // Novo técnico
        const criado = await apiPost("tecnicos", { id: gerarId(), ...dadosTecnico });
        estado.tecnicos.push(criado);
      }

      renderizarTudo();
      dom.msgFormTecnico.className = "form-message form-message--success";
      dom.msgFormTecnico.textContent = "Técnico salvo com sucesso.";
      setTimeout(fecharModalTecnico, 1200);
    } catch (erro) {
      dom.msgFormTecnico.className = "form-message form-message--error";
      dom.msgFormTecnico.textContent = "Não foi possível salvar o técnico.";
    }
  });
}

/* Exclui um técnico. Chamados abertos atribuídos a ele voltam a ficar
   "Não atribuído" em vez de bloquear a exclusão (decisão de projeto
   registrada no refinamento de requisitos). */
async function excluirTecnico(tecnicoId) {
  if (!window.Swal) return;

  const resultado = await Swal.fire({
    title: "Excluir técnico?",
    text: "Tem certeza que deseja excluir este técnico?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Excluir",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#d64550",
  });
  if (!resultado.isConfirmed) return;

  const chamadosAfetados = estado.chamados.filter(
    (c) => c.tecnicoId === tecnicoId && c.status !== "Resolvido" && c.status !== "Fechado"
  );

  try {
    for (const chamado of chamadosAfetados) {
      await apiPatch("chamados", chamado.id, { tecnicoId: null });
      chamado.tecnicoId = null;

      const interacao = {
        id: gerarId(),
        chamadoId: chamado.id,
        autor: "Sistema",
        tipo: "atribuicao",
        mensagem: "Técnico removido do sistema; chamado voltou a ficar sem responsável.",
        data: new Date().toISOString(),
      };
      const interacaoCriada = await apiPost("interacoes", interacao);
      estado.interacoes.push(interacaoCriada);
    }

    await apiDelete("tecnicos", tecnicoId);
    estado.tecnicos = estado.tecnicos.filter((t) => t.id !== tecnicoId);

    renderizarTudo();
  } catch (erro) {
    mostrarErroApi("Não foi possível excluir o técnico.");
  }
}

/* ==========================================================================
   INICIALIZAÇÃO
   ========================================================================== */

/* Fundo animado do hero (index.html). Só existe o elemento #vanta-hero
   nessa página, então o restante do app fica intacto no admin.html. */
function iniciarVantaHero() {
  const elementoHero = document.getElementById("vanta-hero");
  if (!elementoHero || !window.VANTA) return;

  VANTA.WAVES({
    el: elementoHero,
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.0,
    minWidth: 200.0,
    scale: 1.0,
    scaleMobile: 1.0,
    color: 0x1d3557,
    shininess: 35.0,
    waveHeight: 15.0,
    waveSpeed: 0.75,
    zoom: 0.85,
  });
}

async function iniciar() {
  if (window.AOS) AOS.init({ once: true, duration: 600 });
  iniciarVantaHero();

  try {
    await carregarDados();
    renderizarTudo();
  } catch (erro) {
    // O erro já foi exibido em carregarDados(); nada mais a fazer aqui.
  }
}

iniciar();
