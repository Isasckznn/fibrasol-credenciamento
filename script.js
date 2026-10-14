/* ==========================================================
   FIBRASOL — SISTEMA DE CADASTRO
   CADASTRO • QR CODE • PAINEL ADMINISTRATIVO • EXPORTAÇÃO
   ========================================================== */



/* ==========================================================
   1. INICIALIZAÇÃO E ARMAZENAMENTO — SUPABASE
   ========================================================== */

// Os cadastros oficiais serão carregados do banco Supabase.
// Não criar participantes fictícios nem salvar dados localmente.

let cadastros = [];


/* ==========================================================
   2. ÍCONES
   ========================================================== */

function atualizarIcones() {
    if (
        typeof lucide !== "undefined" &&
        typeof lucide.createIcons === "function"
    ) {
        lucide.createIcons();
    }
}

document.addEventListener("DOMContentLoaded", function () {
    atualizarIcones();
});


/* ==========================================================
   3. NAVEGAÇÃO ENTRE AS TELAS
   ========================================================== */

async function switchTab(tab) {
    // O painel administrativo exige uma sessão autenticada.
    if (tab === "admin") {
        if (
            typeof supabaseClient === "undefined" ||
            !supabaseClient
        ) {
            alert("A conexão com o sistema não está disponível.");
            return;
        }

        try {
            const { data, error } =
                await supabaseClient.auth.getSession();

            if (error || !data.session) {
                openAdminAuth();
                return;
            }
        } catch (erro) {
            console.error("Erro ao verificar a sessão:", erro);
            alert("Não foi possível verificar seu acesso. Tente novamente.");
            return;
        }
    }

    const secoes = [
        "section-cadastro",
        "section-sucesso",
        "section-totem",
        "section-admin"
    ];

    secoes.forEach(function (id) {
        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.classList.add("hidden");
        }
    });

    if (tab === "cadastro") {
        const secao = document.getElementById("section-cadastro");

        if (secao) {
            secao.classList.remove("hidden");
        }

    } else if (tab === "totem") {
        const secao = document.getElementById("section-totem");

        if (secao) {
            secao.classList.remove("hidden");
        }

        gerarQRCode();

    } else if (tab === "admin") {
        const secao = document.getElementById("section-admin");

        if (secao) {
            secao.classList.remove("hidden");
        }

        await carregarCadastrosDaNuvem();
    }

    atualizarIcones();
}


/* ==========================================================
   4. MÁSCARA DE TELEFONE
   ========================================================== */

function mascaraTelefone(input) {
    let valor = String(input.value || "").replace(/\D/g, "");

    if (valor.length > 11) {
        valor = valor.slice(0, 11);
    }

    if (valor.length === 0) {
        input.value = "";
        return;
    }

    if (valor.length <= 2) {
        input.value = "(" + valor;
        return;
    }

    const ddd = valor.slice(0, 2);
    const restante = valor.slice(2);

    if (restante.length <= 4) {
        input.value = "(" + ddd + ") " + restante;
    } else if (restante.length <= 8) {
        input.value =
            "(" + ddd + ") " +
            restante.slice(0, 4) + "-" +
            restante.slice(4);
    } else {
        input.value =
            "(" + ddd + ") " +
            restante.slice(0, 5) + "-" +
            restante.slice(5);
    }
}



/* ==========================================================
   5. CADASTRO DE PARTICIPANTES — SUPABASE
   ========================================================== */

async function salvarCadastro(evento) {
    if (evento) {
        evento.preventDefault();
    }

    const campoNome = document.getElementById("campo-nome");
    const campoRazaoSocial = document.getElementById("campo-razao-social");
    const campoTelefone = document.getElementById("campo-telefone");
    const campoEndereco = document.getElementById("campo-endereco");

    if (!campoNome || !campoTelefone || !campoEndereco) {
        alert("Não foi possível localizar todos os campos do cadastro.");
        return;
    }

    const nome = campoNome.value.trim();
    const razaoSocial = campoRazaoSocial
        ? campoRazaoSocial.value.trim()
        : "";
    const telefone = campoTelefone.value.trim();
    const endereco = campoEndereco.value.trim();

    if (!nome || !telefone || !endereco) {
        alert("Preencha todos os campos antes de confirmar o cadastro.");
        return;
    }

    const digitosTelefone = telefone.replace(/\D/g, "");

    if (digitosTelefone.length < 10 || digitosTelefone.length > 11) {
        alert("Informe um telefone válido com DDD.");
        campoTelefone.focus();
        return;
    }

    if (
        typeof supabaseClient === "undefined" ||
        !supabaseClient
    ) {
        alert("Não foi possível conectar ao sistema. Tente novamente.");
        return;
    }

    const botaoEnviar = document.querySelector(
        '#form-cadastro button[type="submit"], #form-cadastro input[type="submit"]'
    );

    if (botaoEnviar) {
        botaoEnviar.disabled = true;
    }

    try {
        const { error } = await supabaseClient
            .from("cadastros")
            .insert([
                {
                    nome: nome,
                    razao_social: razaoSocial || null,
                    telefone: telefone,
                    endereco: endereco
                }
            ]);

        if (error) {
            console.error("Erro ao salvar cadastro:", error);
            alert(
                "Não foi possível concluir seu cadastro. " +
                "Verifique sua conexão e tente novamente."
            );
            return;
        }

        const nomeSucesso = document.getElementById("nome-sucesso");

        if (nomeSucesso) {
            nomeSucesso.textContent = nome;
        }

        const formulario = document.getElementById("form-cadastro");

        if (formulario) {
            formulario.reset();
        }

        switchTab("cadastro");

        const secaoCadastro = document.getElementById("section-cadastro");
        const secaoSucesso = document.getElementById("section-sucesso");

        if (secaoCadastro) {
            secaoCadastro.classList.add("hidden");
        }

        if (secaoSucesso) {
            secaoSucesso.classList.remove("hidden");
        }

    } catch (erro) {
        console.error("Falha inesperada no cadastro:", erro);
        alert("Ocorreu um erro de conexão. Tente novamente.");
    } finally {
        if (botaoEnviar) {
            botaoEnviar.disabled = false;
        }
    }
}

/* ==========================================================
   6. GERAÇÃO DO QR CODE — CADASTRO PÚBLICO FIBRASOL
   ========================================================== */

let qrInstancia = null;

function gerarQRCode() {
    const container = document.getElementById("qrcode-container");

    if (!container) {
        console.error("O elemento #qrcode-container não foi encontrado.");
        return;
    }

    container.innerHTML = "";
    qrInstancia = null;

    if (typeof QRCode === "undefined") {
        container.textContent =
            "Não foi possível carregar o gerador de QR Code. " +
            "Verifique sua conexão com a internet e recarregue a página.";

        console.error(
            "A biblioteca QRCode não foi carregada. " +
            "Confira o script da biblioteca no index.html."
        );

        return;
    }

    // O QR Code deve abrir a página pública de cadastro.
    // cadastro.html precisa estar hospedado no mesmo diretório
    // da página que contém o painel administrativo.
    const enderecoPagina = new URL(
        "cadastro.html",
        window.location.href
    ).href;

    try {
        qrInstancia = new QRCode(container, {
            text: enderecoPagina,
            width: 220,
            height: 220,
            colorDark: "#002B66",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

    } catch (erro) {
        console.error("Erro ao gerar o QR Code:", erro);

        container.textContent =
            "O QR Code não pôde ser gerado. Tente novamente.";
    }
}

/* ==========================================================
   7. AUTENTICAÇÃO DO PAINEL ADMINISTRATIVO — SUPABASE
   ========================================================== */

function openAdminAuth() {
    const modal = document.getElementById("modal-auth");
    const campoEmail = document.getElementById("email-admin");
    const campoSenha = document.getElementById("senha-admin");

    if (!modal || !campoEmail || !campoSenha) {
        alert("Não foi possível abrir a autenticação administrativa.");
        console.error("Confira os IDs do modal de autenticação no index.html.");
        return;
    }

    modal.classList.remove("hidden");
    campoEmail.value = "";
    campoSenha.value = "";
    campoEmail.focus();
}

function fecharModalAuth() {
    const modal = document.getElementById("modal-auth");
    const formulario = document.getElementById("form-login-admin");

    if (modal) {
        modal.classList.add("hidden");
    }

    if (formulario) {
        formulario.reset();
    }
}

async function validarSenhaAdmin(evento) {
    if (evento) {
        evento.preventDefault();
    }

    const campoEmail = document.getElementById("email-admin");
    const campoSenha = document.getElementById("senha-admin");

    if (!campoEmail || !campoSenha) {
        alert("Campos de acesso não encontrados.");
        return;
    }

    const email = campoEmail.value.trim();
    const senha = campoSenha.value;

    if (!email || !senha) {
        alert("Informe seu e-mail e sua senha.");
        return;
    }

    if (
        typeof supabaseClient === "undefined" ||
        !supabaseClient
    ) {
        alert("Conexão com o sistema indisponível. Tente novamente.");
        return;
    }

    const botaoEntrar = document.querySelector(
        '#form-login-admin button[type="submit"]'
    );

    if (botaoEntrar) {
        botaoEntrar.disabled = true;
        botaoEntrar.textContent = "Verificando...";
    }

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: senha
        });

        if (error || !data.user) {
            console.error("Falha no login administrativo:", error);
            alert("Não foi possível entrar. Confira o e-mail e a senha.");
            return;
        }

        fecharModalAuth();
        switchTab("admin");

    } catch (erro) {
        console.error("Erro ao autenticar administrador:", erro);
        alert("Erro de conexão ao verificar o acesso. Tente novamente.");
    } finally {
        if (botaoEntrar) {
            botaoEntrar.disabled = false;
            botaoEntrar.textContent = "Entrar";
        }
    }
}

async function fecharAdmin() {
    if (
        typeof supabaseClient !== "undefined" &&
        supabaseClient
    ) {
        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            console.error("Erro ao encerrar sessão:", error);
            alert("Não foi possível encerrar a sessão corretamente.");
            return;
        }
    }

    switchTab("cadastro");
}



/* ==========================================================
   8. PROTEÇÃO DE TEXTO PARA A TABELA
   ========================================================== */

function escapeHTML(valor) {
    return String(valor ?? "").replace(/[&<>'"]/g, function (caractere) {
        const entidades = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"
        };

        return entidades[caractere];
    });
}


/* ==========================================================
   CARREGAR CADASTROS DA NUVEM — SUPABASE
   ========================================================== */

async function carregarCadastrosDaNuvem() {
    const tbody = document.getElementById("tabela-corpo");

    if (
        typeof supabaseClient === "undefined" ||
        !supabaseClient
    ) {
        alert("A conexão com o banco de dados não está disponível.");
        return;
    }

    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="p-8 text-center text-slate-500 font-bold">
                    Carregando cadastros da nuvem...
                </td>
            </tr>
        `;
    }

    try {
        const { data: sessaoData, error: sessaoErro } =
            await supabaseClient.auth.getSession();

        if (sessaoErro || !sessaoData.session) {
            cadastros = [];

            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="p-8 text-center text-slate-500 font-bold">
                            Entre como administrador para visualizar os cadastros.
                        </td>
                    </tr>
                `;
            }

            openAdminAuth();
            return;
        }

        const { data, error } = await supabaseClient
            .from("cadastros")
            .select("id, nome, razao_social, telefone, endereco, criado_em")
            .order("criado_em", { ascending: false });

        if (error) {
            console.error("Erro ao carregar cadastros:", error);

            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="p-8 text-center text-red-600 font-bold">
                            Não foi possível carregar os cadastros.
                        </td>
                    </tr>
                `;
            }

            alert(
                "Não foi possível carregar os cadastros. " +
                "Verifique se sua conta tem autorização."
            );
            return;
        }

        cadastros = (data || []).map(function (item) {
            const dataCriacao = item.criado_em
                ? new Date(item.criado_em)
                : null;

            const dataFormatada =
                dataCriacao && !Number.isNaN(dataCriacao.getTime())
                    ? dataCriacao.toLocaleDateString("pt-BR") + " " +
                      dataCriacao.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit"
                      })
                    : "";

            return {
                id: item.id,
                nome: item.nome || "",
                razaoSocial: item.razao_social || "",
                telefone: item.telefone || "",
                endereco: item.endereco || "",
                data: dataFormatada
            };
        });

        renderizarTabela(cadastros);

    } catch (erro) {
        console.error("Falha ao carregar cadastros:", erro);

        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="p-8 text-center text-red-600 font-bold">
                        Erro de conexão ao carregar os cadastros.
                    </td>
                </tr>
            `;
        }

        alert("Erro de conexão ao carregar os cadastros.");
    }
}


/* ==========================================================
   9. TABELA DO PAINEL ADMINISTRATIVO
   ========================================================== */

function renderizarTabela(dados = cadastros) {
    const tbody = document.getElementById("tabela-corpo");
    const contador = document.getElementById("contador-registros");

    if (!tbody) {
        console.error("O elemento #tabela-corpo não foi encontrado.");
        return;
    }

    tbody.innerHTML = "";

    if (contador) {
        contador.textContent =
            dados.length + (dados.length === 1
                ? " registro encontrado"
                : " registros encontrados");
    }

    if (dados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="p-8 text-center text-slate-400 font-bold">
                    Nenhum cadastro encontrado.
                </td>
            </tr>
        `;

        const checkAllVazio = document.getElementById("check-all");

        if (checkAllVazio) {
            checkAllVazio.checked = false;
        }

        atualizarBotaoExcluir();
        return;
    }

    dados.forEach(function (item, index) {
        const tr = document.createElement("tr");

        tr.className =
            "hover:bg-slate-100/80 transition-colors border-b border-slate-200/60";

        const idSeguro = String(item.id);

        tr.innerHTML = `
            <td class="p-4 text-center">
                <input
                    type="checkbox"
                    class="check-item rounded border-slate-300 text-fibra-yellow focus:ring-fibra-yellow cursor-pointer"
                    data-id="${idSeguro}"
                    aria-label="Selecionar cadastro de ${escapeHTML(item.nome)}"
                    onchange="atualizarBotaoExcluir()"
                >
            </td>

            <td class="p-4 text-slate-400 font-extrabold">
                ${dados.length - index}
            </td>

            <td class="p-4 font-extrabold text-fibra-blue">
                ${escapeHTML(item.nome)}
            </td>

            <td class="p-4 text-slate-700">
                ${escapeHTML(item.razaoSocial || "")}
            </td>

            <td class="p-4 text-slate-700">
                ${escapeHTML(item.telefone)}
            </td>

            <td
                class="p-4 text-slate-600 max-w-xs truncate"
                title="${escapeHTML(item.endereco)}"
            >
                ${escapeHTML(item.endereco)}
            </td>

            <td class="p-4 text-slate-500 font-mono text-[11px]">
                ${escapeHTML(item.data)}
            </td>

            <td class="p-4 text-center">
                <button
                    type="button"
                    onclick="excluirIndividual('${idSeguro}')"
                    class="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
                    title="Apagar registro"
                    aria-label="Apagar cadastro de ${escapeHTML(item.nome)}"
                >
                    <i data-lucide="trash" class="w-4 h-4"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    const checkAll = document.getElementById("check-all");

    if (checkAll) {
        checkAll.checked = false;
    }

    atualizarIcones();
    atualizarBotaoExcluir();
}


/* ==========================================================
   10. SELECIONAR TODOS OS CADASTROS
   ========================================================== */

function selecionarTodos(mestre) {
    const checkboxes = document.querySelectorAll(".check-item");

    checkboxes.forEach(function (checkbox) {
        checkbox.checked = mestre.checked;
    });

    atualizarBotaoExcluir();
}


/* ==========================================================
   11. BOTÃO DE EXCLUSÃO EM LOTE
   ========================================================== */

function atualizarBotaoExcluir() {
    const selecionados = document.querySelectorAll(".check-item:checked").length;
    const botao = document.getElementById("btn-excluir-sel");

    if (!botao) {
        return;
    }

    if (selecionados > 0) {
        botao.disabled = false;
        botao.classList.remove("opacity-50", "cursor-not-allowed");

        botao.innerHTML =
            `<i data-lucide="trash-2" class="w-4 h-4"></i> Apagar (${selecionados})`;

    } else {
        botao.disabled = true;
        botao.classList.add("opacity-50", "cursor-not-allowed");

        botao.innerHTML =
            '<i data-lucide="trash-2" class="w-4 h-4"></i> Apagar Selecionados';
    }

    atualizarIcones();
}



/* ==========================================================
   12. EXCLUIR UM CADASTRO — SUPABASE
   ========================================================== */

async function excluirIndividual(id) {
    if (!id) {
        alert("Identificador do cadastro inválido.");
        return;
    }

    if (
        typeof supabaseClient === "undefined" ||
        !supabaseClient
    ) {
        alert("A conexão com o banco de dados não está disponível.");
        return;
    }

    const { data: sessaoData, error: sessaoErro } =
        await supabaseClient.auth.getSession();

    if (sessaoErro || !sessaoData.session) {
        alert("Sua sessão expirou. Entre novamente como administrador.");
        return;
    }

    const cadastroExiste = cadastros.some(function (item) {
        return String(item.id) === String(id);
    });

    if (!cadastroExiste) {
        alert("Este cadastro não foi encontrado na lista atual.");
        return;
    }

    if (!confirm("Deseja realmente apagar este cadastro?")) {
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from("cadastros")
            .delete()
            .eq("id", id)
            .select("id");

        if (error) {
            console.error("Erro ao excluir cadastro:", error);
            alert("Não foi possível excluir o cadastro.");
            return;
        }

        if (!data || data.length === 0) {
            alert(
                "Nenhum registro foi excluído. " +
                "Verifique sua autorização de administrador."
            );
            return;
        }

        cadastros = cadastros.filter(function (item) {
            return String(item.id) !== String(id);
        });

        renderizarTabela();
        alert("Cadastro excluído com sucesso.");

    } catch (erro) {
        console.error("Falha ao excluir cadastro:", erro);
        alert("Erro de conexão ao excluir o cadastro.");
    }
}

/* ==========================================================
   13. EXCLUIR CADASTROS SELECIONADOS — SUPABASE
   ========================================================== */

async function excluirSelecionados() {
    const checkboxes = document.querySelectorAll(".check-item:checked");

    if (checkboxes.length === 0) {
        alert("Selecione pelo menos um cadastro para apagar.");
        return;
    }

    const idsParaRemover = Array.from(checkboxes)
        .map(function (checkbox) {
            return checkbox.dataset.id;
        })
        .filter(Boolean);

    if (idsParaRemover.length === 0) {
        alert("Não foi possível identificar os cadastros selecionados.");
        return;
    }

    if (
        typeof supabaseClient === "undefined" ||
        !supabaseClient
    ) {
        alert("A conexão com o banco de dados não está disponível.");
        return;
    }

    if (!confirm(
        "Deseja realmente apagar os " +
        idsParaRemover.length +
        " cadastros selecionados?"
    )) {
        return;
    }

    try {
        const { data: sessaoData, error: sessaoErro } =
            await supabaseClient.auth.getSession();

        if (sessaoErro || !sessaoData.session) {
            alert("Sua sessão expirou. Entre novamente como administrador.");
            openAdminAuth();
            return;
        }

        const { data, error } = await supabaseClient
            .from("cadastros")
            .delete()
            .in("id", idsParaRemover)
            .select("id");

        if (error) {
            console.error("Erro ao excluir cadastros:", error);
            alert("Não foi possível excluir os cadastros selecionados.");
            return;
        }

        const idsExcluidos = new Set(
            (data || []).map(function (item) {
                return String(item.id);
            })
        );

        if (idsExcluidos.size === 0) {
            alert(
                "Nenhum cadastro foi excluído. " +
                "Verifique sua autorização de administrador."
            );
            return;
        }

        cadastros = cadastros.filter(function (item) {
            return !idsExcluidos.has(String(item.id));
        });

        renderizarTabela();

        alert(
            idsExcluidos.size +
            (idsExcluidos.size === 1
                ? " cadastro excluído com sucesso."
                : " cadastros excluídos com sucesso.")
        );

    } catch (erro) {
        console.error("Falha ao excluir cadastros:", erro);
        alert("Erro de conexão ao excluir os cadastros.");
    }
}

/* ==========================================================
   14. PESQUISA E FILTRO DA TABELA
   ========================================================== */

function filtrarTabela() {
    const campoBusca = document.getElementById("filtro-busca");

    if (!campoBusca) {
        return;
    }

    const termo = campoBusca.value.trim().toLocaleLowerCase("pt-BR");

    const filtrados = cadastros.filter(function (cadastro) {
        const nome = String(cadastro.nome || "").toLocaleLowerCase("pt-BR");
        const razaoSocial = String(cadastro.razaoSocial || "").toLocaleLowerCase("pt-BR");
        const telefone = String(cadastro.telefone || "").toLocaleLowerCase("pt-BR");
        const endereco = String(cadastro.endereco || "").toLocaleLowerCase("pt-BR");

        return (
            nome.includes(termo) ||
            razaoSocial.includes(termo) ||
            telefone.includes(termo) ||
            endereco.includes(termo)
        );
    });

    renderizarTabela(filtrados);
}



/* ==========================================================
   15. EXPORTAR CADASTROS PARA CSV / EXCEL
   ========================================================== */

function exportarExcel() {
    if (!Array.isArray(cadastros) || cadastros.length === 0) {
        alert("Não há cadastros carregados para exportar.");
        return;
    }

    const botaoExportar = document.querySelector(
        '[onclick="exportarExcel()"]'
    );

    if (botaoExportar && botaoExportar.disabled) {
        alert("Aguarde o carregamento dos cadastros.");
        return;
    }

    let csv = "\uFEFF";
    csv += "ID;Nome Completo;Razão Social;Telefone;Endereço;Data e Hora\n";

    cadastros.forEach(function (cadastro, indice) {
        const linha = [
            cadastros.length - indice,
            cadastro.nome || "",
            cadastro.razaoSocial || "",
            cadastro.telefone || "",
            cadastro.endereco || "",
            cadastro.data || ""
        ];

        const linhaCSV = linha.map(function (valor) {
            return '"' +
                String(valor ?? "").replace(/"/g, '""') +
                '"';
        }).join(";");

        csv += linhaCSV + "\n";
    });

    const arquivo = new Blob(
        [csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");

    link.href = url;
    link.download =
        "fibrasol_cadastros_evento_" +
        new Date().toISOString().slice(0, 10) +
        ".csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(function () {
        URL.revokeObjectURL(url);
    }, 1000);
}


/* ==========================================================
   16. TECLA ENTER NA SENHA DO ADMIN
   ========================================================== */

document.addEventListener("DOMContentLoaded", function () {
    const campoSenha = document.getElementById("senha-admin");

    if (campoSenha) {
        campoSenha.addEventListener("keydown", function (evento) {
            if (evento.key === "Enter") {
                evento.preventDefault();
                validarSenhaAdmin();
            }

            if (evento.key === "Escape") {
                fecharModalAuth();
            }
        });
    }
});

/* ==========================================================
   FIM DO SCRIPT FIBRASOL
   ========================================================== */

   
/* ==========================================================
   FIBRASOL — IMPRESSÃO ISOLADA E SEM DUPLICAÇÃO DO QR CODE
   ========================================================== */

function imprimirTotem() {
    if (window.__impressaoTotemEmAndamento) return;

    window.__impressaoTotemEmAndamento = true;

    const enderecoPagina =
        "https://isasckznn.github.io/fibrasol-credenciamento/cadastro.html";

    const janela = window.open("", "_blank");

    if (!janela) {
        window.__impressaoTotemEmAndamento = false;
        alert("Permita pop-ups para imprimir o Totem FibraSol.");
        return;
    }

    const area = document.createElement("div");
    area.style.cssText =
        "position:fixed;left:-10000px;top:0;width:800px;height:800px;";
    document.body.appendChild(area);

    new QRCode(area, {
        text: enderecoPagina,
        width: 800,
        height: 800,
        correctLevel: QRCode.CorrectLevel.H
    });

    setTimeout(() => {
        const canvas = area.querySelector("canvas");
        const imagem = area.querySelector("img");

        const qr = canvas
            ? canvas.toDataURL("image/png")
            : imagem?.src;

        area.remove();

        if (!qr) {
            janela.close();
            window.__impressaoTotemEmAndamento = false;
            alert("Não foi possível gerar o QR Code.");
            return;
        }

        janela.document.open();
        janela.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Totem Oficial FibraSol</title>

<style>
    @page {
        size: A4 portrait;
        margin: 10mm;
    }

    * {
        box-sizing: border-box;
    }

    html, body {
        margin: 0;
        padding: 0;
        font-family: Arial, Helvetica, sans-serif;
        background: #ffffff;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }

    body {
        color: #ffffff;
        text-align: center;
    }

    .folha {
        width: 100%;
        min-height: 265mm;
        padding: 7mm;
        background: #ffffff;
    }

    .cartaz {
        position: relative;
        width: 100%;
        max-width: 180mm;
        margin: 0 auto;
        padding: 10mm 8mm 8mm;
        overflow: hidden;
        border: 1.2mm solid #d9ad24;
        border-radius: 7mm;
        background:
            radial-gradient(
                circle at 50% 22%,
                #104b8c 0%,
                #082d60 42%,
                #03152f 100%
            );
    }

    .faixa-superior {
        width: 40mm;
        height: 2mm;
        margin: 0 auto 7mm;
        border-radius: 99px;
        background: linear-gradient(
            90deg,
            #b98913,
            #fff0a3,
            #ffd633,
            #b98913
        );
    }

    .marca {
        margin: 0;
        color: #ffffff;
        font-size: 35pt;
        font-weight: 900;
        font-style: italic;
        letter-spacing: 2px;
        line-height: 1;
    }

    .marca span {
        color: #ffd633;
    }

    .slogan {
        margin-top: 4mm;
        color: #ffe58a;
        font-size: 9pt;
        font-weight: 800;
        letter-spacing: 2px;
    }

    .separador {
        width: 25mm;
        height: 1mm;
        margin: 7mm auto;
        border-radius: 99px;
        background: linear-gradient(
            90deg,
            transparent,
            #ffd633,
            #fff0a3,
            #ffd633,
            transparent
        );
    }

    .etiqueta {
        display: inline-block;
        margin-bottom: 5mm;
        padding: 2.5mm 5mm;
        color: #ffe58a;
        border: 1px solid rgba(255, 214, 51, .65);
        border-radius: 99px;
        background: rgba(255, 214, 51, .08);
        font-size: 8pt;
        font-weight: 800;
        letter-spacing: 2px;
    }

    h2 {
        margin: 0 auto 4mm;
        color: #ffffff;
        font-size: 21pt;
        font-weight: 900;
        line-height: 1.15;
    }

    .subtitulo {
        max-width: 125mm;
        margin: 0 auto 7mm;
        color: #dceaff;
        font-size: 10pt;
        line-height: 1.5;
    }

    .qr-moldura {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 84mm;
        height: 84mm;
        margin: 0 auto;
        padding: 4mm;
        border: 2mm solid #ffd633;
        border-radius: 5mm;
        background: linear-gradient(
            145deg,
            #fff0a3,
            #ffd633,
            #dba91a
        );
        box-shadow: 0 0 0 1mm rgba(255, 255, 255, .12);
    }

    .qr-fundo {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        padding: 2mm;
        background: #ffffff;
        border-radius: 2mm;
    }

    #qr-impressao {
        display: block;
        width: 70mm;
        height: 70mm;
        object-fit: contain;
    }

    .chamada {
        margin-top: 7mm;
        color: #ffd633;
        font-size: 14pt;
        font-weight: 900;
        letter-spacing: .5px;
    }

    .instrucao {
        margin-top: 3mm;
        color: #ffffff;
        font-size: 10pt;
        font-weight: 600;
    }

    .rodape {
        margin-top: 9mm;
        padding-top: 5mm;
        border-top: 1px solid rgba(255, 255, 255, .25);
        color: #ffe58a;
        font-size: 8pt;
        font-weight: 800;
        letter-spacing: 1.5px;
    }

    @media print {
        html, body {
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
        }

        .folha {
            min-height: 0;
            padding: 0;
        }

        .cartaz {
            break-inside: avoid;
            page-break-inside: avoid;
        }
    }
</style>
</head>

<body>
    <main class="folha">
        <section class="cartaz">
            <div class="faixa-superior"></div>

            <h1 class="marca">FIBRA<span>SOL</span></h1>

            <div class="slogan">
                QUALIDADE E AGILIDADE NA ENTREGA
            </div>

            <div class="separador"></div>

            <div class="etiqueta">CREDENCIAMENTO OFICIAL</div>

            <h2>A FIBRA NO DNA NORDESTINO</h2>

            <p class="subtitulo">
                Faça seu cadastro e venha se conectar com a
                FibraSol neste momento especial!
            </p>

            <div class="qr-moldura">
                <div class="qr-fundo">
                    <img
                        id="qr-impressao"
                        src="${qr}"
                        alt="QR Code oficial FibraSol"
                    >
                </div>
            </div>

            <div class="chamada">
                ESCANEIE E FAÇA SEU CADASTRO
            </div>

            <div class="instrucao">
                Aponte a câmera do celular para o QR Code.
            </div>

            <div class="rodape">
                FIBRASOL • CONECTANDO PESSOAS E CRIANDO VALOR
            </div>
        </section>
    </main>

<script>
    let iniciado = false;

    function iniciar() {
        if (iniciado) return;
        iniciado = true;

        setTimeout(() => {
            window.focus();
            window.print();
        }, 400);
    }

    const qrImg = document.getElementById("qr-impressao");

    qrImg.addEventListener("load", iniciar, { once: true });

    qrImg.addEventListener("error", () => {
        alert("Não foi possível carregar o QR Code.");
    }, { once: true });

    window.addEventListener("afterprint", () => {
        window.__impressaoTotemEmAndamento = false;
    });

    if (qrImg.complete && qrImg.naturalWidth > 0) {
        iniciar();
    }
</script>
</body>
</html>`);
        janela.document.close();
    }, 300);
}
