/* ==========================================================
   FIBRASOL — SISTEMA DE CADASTRO
   CADASTRO • QR CODE • PAINEL ADMINISTRATIVO • EXPORTAÇÃO
   ========================================================== */


/* ==========================================================
   1. INICIALIZAÇÃO E ARMAZENAMENTO
   ========================================================== */

const CHAVE_CADASTROS = "fibrasol_cadastros";

function carregarCadastros() {
    try {
        const dados = localStorage.getItem(CHAVE_CADASTROS);

        if (dados === null) {
            const demonstracao = [
                {
                    id: 1,
                    nome: "Carlos Eduardo Silva",
                    telefone: "(83) 98877-6655",
                    endereco: "Av. Beira Mar, 102 - Praia de Tambaú, João Pessoa - PB",
                    data: "09/10/2026 14:30"
                },
                {
                    id: 2,
                    nome: "Mariana Costa Rêgo",
                    telefone: "(81) 99123-4567",
                    endereco: "Rua do Sol, 45 - Boa Viagem, Recife - PE",
                    data: "09/10/2026 15:15"
                }
            ];

            localStorage.setItem(
                CHAVE_CADASTROS,
                JSON.stringify(demonstracao)
            );

            return demonstracao;
        }

        const registros = JSON.parse(dados);

        return Array.isArray(registros) ? registros : [];

    } catch (erro) {
        console.error("Erro ao carregar os cadastros:", erro);
        return [];
    }
}

let cadastros = carregarCadastros();

function salvarNoArmazenamento() {
    try {
        localStorage.setItem(
            CHAVE_CADASTROS,
            JSON.stringify(cadastros)
        );

        return true;

    } catch (erro) {
        console.error("Erro ao salvar os cadastros:", erro);

        alert(
            "Não foi possível salvar os dados neste navegador. " +
            "Verifique o espaço disponível e as permissões de armazenamento."
        );

        return false;
    }
}


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

function switchTab(tab) {
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

        renderizarTabela();
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
   5. CADASTRO DE PARTICIPANTES
   ========================================================== */

function salvarCadastro(evento) {
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

    const agora = new Date();

    const dataFormatada =
        agora.toLocaleDateString("pt-BR") + " " +
        agora.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit"
        });

  
    const novoCadastro = {
        id: Date.now(),
        nome: nome,
        razaoSocial: razaoSocial,
        telefone: telefone,
        endereco: endereco,
        data: dataFormatada
    };


    cadastros.unshift(novoCadastro);

    if (!salvarNoArmazenamento()) {
        cadastros.shift();
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
}


function novoCadastro() {
    switchTab("cadastro");
}


/* ==========================================================
   6. GERAÇÃO DO QR CODE
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

    const enderecoPagina = window.location.href;

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
   7. AUTENTICAÇÃO DO PAINEL ADMINISTRATIVO
   ========================================================== */

function openAdminAuth() {
    const modal = document.getElementById("modal-auth");
    const campoSenha = document.getElementById("senha-admin");

    if (!modal || !campoSenha) {
        alert("Não foi possível abrir a autenticação administrativa.");
        console.error("Confira os IDs modal-auth e senha-admin no index.html.");
        return;
    }

    modal.classList.remove("hidden");
    campoSenha.value = "";
    campoSenha.focus();
}


function fecharModalAuth() {
    const modal = document.getElementById("modal-auth");
    const campoSenha = document.getElementById("senha-admin");

    if (modal) {
        modal.classList.add("hidden");
    }

    if (campoSenha) {
        campoSenha.value = "";
    }
}


function validarSenhaAdmin() {
    const campoSenha = document.getElementById("senha-admin");

    if (!campoSenha) {
        alert("Campo de senha não encontrado.");
        return;
    }

    const senha = campoSenha.value;

    if (senha === "fibrasol2026" || senha === "admin") {
        fecharModalAuth();
        switchTab("admin");
    } else {
        alert("Senha incorreta. Verifique a senha e tente novamente.");
        campoSenha.value = "";
        campoSenha.focus();
    }
}


function fecharAdmin() {
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

        const idSeguro = Number(item.id) || 0;

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
                    onclick="excluirIndividual(${idSeguro})"
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
   12. EXCLUIR UM CADASTRO
   ========================================================== */

function excluirIndividual(id) {
    const cadastroExiste = cadastros.some(function (item) {
        return Number(item.id) === Number(id);
    });

    if (!cadastroExiste) {
        alert("Este cadastro não foi encontrado.");
        return;
    }

    if (!confirm("Deseja realmente apagar este cadastro?")) {
        return;
    }

    const cadastrosAnteriores = cadastros.slice();

    cadastros = cadastros.filter(function (item) {
        return Number(item.id) !== Number(id);
    });

    if (!salvarNoArmazenamento()) {
        cadastros = cadastrosAnteriores;
        return;
    }

    renderizarTabela();
}


/* ==========================================================
   13. EXCLUIR CADASTROS SELECIONADOS
   ========================================================== */

function excluirSelecionados() {
    const checkboxes = document.querySelectorAll(".check-item:checked");

    if (checkboxes.length === 0) {
        alert("Selecione pelo menos um cadastro para apagar.");
        return;
    }

    if (!confirm(
        "Deseja realmente apagar os " +
        checkboxes.length +
        " cadastros selecionados?"
    )) {
        return;
    }

    const idsParaRemover = Array.from(checkboxes).map(function (checkbox) {
        return Number(checkbox.dataset.id);
    });

    const cadastrosAnteriores = cadastros.slice();

    cadastros = cadastros.filter(function (item) {
        return !idsParaRemover.includes(Number(item.id));
    });

    if (!salvarNoArmazenamento()) {
        cadastros = cadastrosAnteriores;
        return;
    }

    renderizarTabela();
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
    if (cadastros.length === 0) {
        alert("Não há cadastros para exportar.");
        return;
    }

    let csv = "\uFEFF";
    csv += "ID;Nome Completo;Razão Social;Telefone;Endereço;Data e Hora\n";

    cadastros.forEach(function (cadastro, indice) {
        const linha = [
            cadastros.length - indice,
            cadastro.nome,
            cadastro.razaoSocial || "",
            cadastro.telefone,
            cadastro.endereco,
            cadastro.data
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
   FIBRASOL — IMPRESSÃO DO TOTEM
   ========================================================== */


function imprimirTotem() {
    const secaoTotem = document.getElementById("section-totem");

    if (!secaoTotem) {
        alert("Não foi possível encontrar o cartão do Totem QR.");
        return;
    }

    if (typeof gerarQRCode === "function") {
        gerarQRCode();
    }

    window.setTimeout(function () {
        const qrCode = document.querySelector(
            "#qrcode-container img, #qrcode-container canvas"
        );

        if (!qrCode) {
            alert("O QR Code não foi gerado. Abra a aba Totem QR e tente novamente.");
            return;
        }

        window.print();
    }, 500);
}

