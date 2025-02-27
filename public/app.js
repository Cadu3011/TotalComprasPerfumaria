let result

document.getElementById("buscarBtn").addEventListener("click", async function() {
    const dataInicio = document.getElementById("dataInicio").value;
    const dataFim = document.getElementById("dataFim").value;
    let formattedDataInicio = ''
    let formattedDataFim = ''
    if (!dataInicio || !dataFim) {
        alert("Por favor, selecione ambas as datas.");
        return;
    }

    const resultado = document.getElementById("resultado");
    const loadingIcon = document.getElementById("loading");

    // Exibir o ícone de carregamento
    loadingIcon.style.display = "inline-block";

    // Função para formatar a data no formato DD/MM/YYYY
    function formatDate(date) {
        const [year, month, day] = date.split('-'); // Separando a data no formato YYYY-MM-DD
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }

    // Validação de data de início antes de data de fim
    if (new Date(dataInicio) > new Date(dataFim)) {
        resultado.textContent = "A data de início não pode ser maior que a data de fim.";
        resultado.style.color = "red";
        loadingIcon.style.display = "none"; // Esconde o ícone de carregamento
    } else {
        formattedDataInicio = formatDate(dataInicio);
        formattedDataFim = formatDate(dataFim);
        resultado.textContent = `Período selecionado: ${formattedDataInicio} até ${formattedDataFim}`;
        resultado.style.color = "#3498db";
    }

    // Chama a API ou endpoint que rodará o script Playwright no backend
    try {
        const response = await fetch('https://totalcomprasperfumaria-production.up.railway.app/api/rodar-relatorio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                dataInicio: formattedDataInicio,  // Envia como 'YYYY-MM-DD', pois o backend pode precisar disso
                dataFim: formattedDataFim         // Envia como 'YYYY-MM-DD'
            }),
            cache: "no-store"
        });
        
         result = await response.json();
        const totalCompra = result.totalCompra || 'Valor não encontrado';
        document.getElementById("totalCompra").textContent = `Valor total de compras de perfumaria: ${totalCompra}`;
    } catch (error) {
        console.error("Erro ao chamar a API:", error);
        document.getElementById("totalCompra").textContent = 'Erro ao obter o valor.';
    } finally {
        // Esconde o ícone de carregamento, independentemente de sucesso ou falha
        loadingIcon.style.display = "none";
    }
});

document.getElementById("calcularBtn").addEventListener("click", async function() {
    const orcamento = document.getElementById("orcamento").value;
    const totalCompra = result.totalCompra;

    // Remover a vírgula e substituir por ponto
    const totalCompraFormatado = totalCompra.replace('.', '').replace(',', '.');  // Troca a vírgula por ponto
    const orcamentoFormatado = orcamento.replace(',', '.');  // Caso o orçamento também tenha vírgula
    
    // Converter para números
    const valorOrcamento = parseFloat(orcamentoFormatado);
    const valorTotalCompra = parseFloat(totalCompraFormatado);

    // Cálculo
    const calculo = valorOrcamento - valorTotalCompra;
    const calculoFormatado = calculo.toLocaleString('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    // Exibir o valor disponível
    document.getElementById("orcamentoDisponivel").textContent = `Orçamento disponível: R$ ${calculoFormatado}`;
});