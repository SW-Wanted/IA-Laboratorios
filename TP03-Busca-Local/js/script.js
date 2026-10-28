"use strict";

const MAXIMO_TEORICO = 82.5;
const LIMITES = {
    x1: { min: 10, max: 50 },
    x2: { min: 1, max: 10 },
    x3: { min: 1, max: 5 }
};

let ultimoResultado = null;

function avaliarSolucao(solucao) {
    return 0.4 * solucao.x1
         + 0.5 * Math.pow(solucao.x2, 2)
         + 0.1 * Math.pow(solucao.x3, 3);
}

function numeroAleatorioInteiro(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gerarSolucaoAleatoria() {
    return {
        x1: numeroAleatorioInteiro(LIMITES.x1.min, LIMITES.x1.max),
        x2: numeroAleatorioInteiro(LIMITES.x2.min, LIMITES.x2.max),
        x3: numeroAleatorioInteiro(LIMITES.x3.min, LIMITES.x3.max)
    };
}

function copiarSolucao(solucao) {
    return { x1: solucao.x1, x2: solucao.x2, x3: solucao.x3 };
}

function estaDentroDosLimites(solucao) {
    return Object.keys(LIMITES).every(chave =>
        Number.isInteger(solucao[chave]) &&
        solucao[chave] >= LIMITES[chave].min &&
        solucao[chave] <= LIMITES[chave].max
    );
}

// Pesquisa Aleatória: gera e avalia soluções independentes.
function pesquisaAleatoria(numeroIteracoes) {
    const inicio = performance.now();
    let melhorSolucao = null;
    let melhorPontuacao = -Infinity;

    for (let i = 0; i < numeroIteracoes; i++) {
        const candidata = gerarSolucaoAleatoria();
        const pontuacao = avaliarSolucao(candidata);

        if (pontuacao > melhorPontuacao) {
            melhorSolucao = copiarSolucao(candidata);
            melhorPontuacao = pontuacao;
        }
    }

    return {
        algoritmo: "Pesquisa Aleatória",
        solucao: melhorSolucao,
        pontuacao: melhorPontuacao,
        tempoMs: performance.now() - inicio
    };
}

// Cria um vizinho alterando uma variável em +1 ou -1.
// Se a alteração sair dos limites, tenta a direcção oposta.
function gerarVizinho(solucao) {
    const vizinho = copiarSolucao(solucao);
    const variaveis = ["x1", "x2", "x3"];
    const variavel = variaveis[numeroAleatorioInteiro(0, variaveis.length - 1)];
    const direccaoInicial = Math.random() < 0.5 ? -1 : 1;
    const limite = LIMITES[variavel];

    let novoValor = vizinho[variavel] + direccaoInicial;

    if (novoValor < limite.min || novoValor > limite.max) {
        novoValor = vizinho[variavel] - direccaoInicial;
    }

    vizinho[variavel] = novoValor;
    return vizinho;
}

// Arrefecimento Simulado: pode aceitar soluções piores, sobretudo
// quando a temperatura ainda é elevada.
function arrefecimentoSimulado(numeroIteracoes, temperaturaInicial, taxaArrefecimento) {
    const inicio = performance.now();

    let actual = gerarSolucaoAleatoria();
    let pontuacaoActual = avaliarSolucao(actual);

    let melhorSolucao = copiarSolucao(actual);
    let melhorPontuacao = pontuacaoActual;
    let temperatura = temperaturaInicial;

    for (let i = 0; i < numeroIteracoes; i++) {
        const candidata = gerarVizinho(actual);
        const pontuacaoCandidata = avaliarSolucao(candidata);
        const diferenca = pontuacaoCandidata - pontuacaoActual;

        if (diferenca >= 0 || Math.random() < Math.exp(diferenca / temperatura)) {
            actual = copiarSolucao(candidata);
            pontuacaoActual = pontuacaoCandidata;
        }

        if (pontuacaoActual > melhorPontuacao) {
            melhorSolucao = copiarSolucao(actual);
            melhorPontuacao = pontuacaoActual;
        }

        temperatura *= taxaArrefecimento;
        // Evita temperatura exactamente zero em execuções muito longas.
        if (temperatura < 1e-12) temperatura = 1e-12;
    }

    return {
        algoritmo: "Arrefecimento Simulado",
        solucao: melhorSolucao,
        pontuacao: melhorPontuacao,
        tempoMs: performance.now() - inicio
    };
}

function executarExperiencias(numeroExecucoes, numeroIteracoes, temperatura, taxa) {
    const resultados = {
        aleatoria: [],
        simulado: []
    };

    for (let i = 0; i < numeroExecucoes; i++) {
        resultados.aleatoria.push(pesquisaAleatoria(numeroIteracoes));
        resultados.simulado.push(
            arrefecimentoSimulado(numeroIteracoes, temperatura, taxa)
        );
    }

    return resultados;
}

function estatisticas(resultados) {
    const pontuacoes = resultados.map(r => r.pontuacao);
    const tempos = resultados.map(r => r.tempoMs);
    const melhor = resultados.reduce((a, b) => b.pontuacao > a.pontuacao ? b : a);

    return {
        melhor,
        melhorPontuacao: Math.max(...pontuacoes),
        mediaPontuacao: pontuacoes.reduce((s, v) => s + v, 0) / pontuacoes.length,
        tempoMedio: tempos.reduce((s, v) => s + v, 0) / tempos.length,
        maximosAtingidos: resultados.filter(r =>
            Math.abs(r.pontuacao - MAXIMO_TEORICO) < 1e-9
        ).length
    };
}

function formatarNumero(valor, casas = 2) {
    return valor.toLocaleString("pt-PT", {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas
    });
}

function mostrarResultados(resultados) {
    const resumo = [
        { nome: "Pesquisa Aleatória", dados: estatisticas(resultados.aleatoria) },
        { nome: "Arrefecimento Simulado", dados: estatisticas(resultados.simulado) }
    ];

    document.getElementById("summaryBody").innerHTML = resumo.map(item => `
        <tr>
            <td>${item.nome}</td>
            <td><strong>${formatarNumero(item.dados.melhorPontuacao)}</strong></td>
            <td>${formatarNumero(item.dados.mediaPontuacao)}</td>
            <td>${formatarNumero(item.dados.tempoMedio, 4)}</td>
            <td>${item.dados.maximosAtingidos} / ${resultados.aleatoria.length}</td>
        </tr>
    `).join("");

    document.getElementById("bestCards").innerHTML = resumo.map(item => {
        const s = item.dados.melhor.solucao;
        return `
            <div class="metric">
                <div class="name">Melhor solução — ${item.nome}</div>
                <div class="value ${item.dados.melhorPontuacao === MAXIMO_TEORICO ? "best" : ""}">
                    P = ${formatarNumero(item.dados.melhorPontuacao)}
                </div>
                <p>x₁ = ${s.x1}, x₂ = ${s.x2}, x₃ = ${s.x3}</p>
            </div>
        `;
    }).join("");

    const linhas = [];
    resultados.aleatoria.forEach((r, i) => linhas.push({ ...r, execucao: i + 1 }));
    resultados.simulado.forEach((r, i) => linhas.push({ ...r, execucao: i + 1 }));

    document.getElementById("detailsBody").innerHTML = linhas.map(r => `
        <tr>
            <td>${r.algoritmo}</td>
            <td>${r.execucao}</td>
            <td>${r.solucao.x1}</td>
            <td>${r.solucao.x2}</td>
            <td>${r.solucao.x3}</td>
            <td>${formatarNumero(r.pontuacao)}</td>
            <td>${formatarNumero(r.tempoMs, 4)}</td>
        </tr>
    `).join("");

    document.getElementById("summaryPanel").hidden = false;
    document.getElementById("detailsPanel").hidden = false;
}

function validarParametros() {
    const runs = Number(document.getElementById("runs").value);
    const iterations = Number(document.getElementById("iterations").value);
    const temperature = Number(document.getElementById("temperature").value);
    const cooling = Number(document.getElementById("cooling").value);

    if (!Number.isInteger(runs) || runs < 1 || runs > 1000) {
        throw new Error("O número de execuções deve ser um inteiro entre 1 e 1000.");
    }
    if (!Number.isInteger(iterations) || iterations < 1 || iterations > 100000) {
        throw new Error("As iterações devem ser um inteiro entre 1 e 100000.");
    }
    if (!Number.isFinite(temperature) || temperature <= 0) {
        throw new Error("A temperatura inicial deve ser maior do que zero.");
    }
    if (!Number.isFinite(cooling) || cooling <= 0 || cooling >= 1) {
        throw new Error("A taxa de arrefecimento deve ser maior do que zero e menor do que 1.");
    }

    return { runs, iterations, temperature, cooling };
}

document.getElementById("runButton").addEventListener("click", () => {
    const botao = document.getElementById("runButton");
    const status = document.getElementById("status");

    try {
        const parametros = validarParametros();
        botao.disabled = true;
        status.textContent = "A executar os algoritmos. Aguarda...";
        status.classList.remove("error");

        // setTimeout permite actualizar a mensagem antes de iniciar o cálculo.
        setTimeout(() => {
            try {
                const resultados = executarExperiencias(
                    parametros.runs,
                    parametros.iterations,
                    parametros.temperature,
                    parametros.cooling
                );

                ultimoResultado = resultados;
                mostrarResultados(resultados);
                status.textContent =
                    `Concluído: ${parametros.runs} execuções por algoritmo, ` +
                    `com ${parametros.iterations} iterações por execução.`;
            } catch (erro) {
                status.textContent = erro.message || "Ocorreu um erro durante a execução.";
                status.classList.add("error");
            } finally {
                botao.disabled = false;
            }
        }, 20);
    } catch (erro) {
        status.textContent = erro.message;
        status.classList.add("error");
    }
});

document.getElementById("downloadButton").addEventListener("click", () => {
    if (!ultimoResultado) return;

    const linhas = [["Algoritmo", "Execucao", "x1", "x2", "x3", "Pontuacao", "Tempo_ms"]];
    ultimoResultado.aleatoria.forEach((r, i) => linhas.push([
        r.algoritmo, i + 1, r.solucao.x1, r.solucao.x2, r.solucao.x3,
        r.pontuacao, r.tempoMs
    ]));
    ultimoResultado.simulado.forEach((r, i) => linhas.push([
        r.algoritmo, i + 1, r.solucao.x1, r.solucao.x2, r.solucao.x3,
        r.pontuacao, r.tempoMs
    ]));

    const csv = "\uFEFF" + linhas.map(linha =>
        linha.map(valor => `"${String(valor).replaceAll('"', '""')}"`).join(";")
    ).join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resultados_tp03.csv";
    link.click();
    URL.revokeObjectURL(url);
});
