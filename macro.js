const { chromium } = require('playwright');
const express = require('express');
const app = express();
const cors = require('cors')
const port = 8000;
const path = require('path');
// Configurar o servidor express
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
  });
// Endpoint para rodar o relatório
app.post('/api/rodar-relatorio', async (req, res) => {
    const { dataInicio, dataFim } = req.body;
    
    // Validação das datas
    if (!dataInicio || !dataFim) {
        return res.status(400).json({ message: 'Datas inválidas' });
    }

    let value = '';
    try {
        // Lançar o navegador com Playwright
        const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        await page.route('**/*', (route, request) => {
            if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
                route.abort(); // Aborta o carregamento de imagens, fontes e folhas de estilo
            } else {
                route.continue();  // Deixa as outras requisições passarem
            }
        });
        await page.goto('http://192.168.1.253:4647/sgfpod1/Login.pod', { waitUntil: 'domcontentloaded' });

        // Login e navegação
        await page.fill('#id_cod_usuario', '95');
        await page.fill('#nom_senha', 'cadu3011');
        await page.click('#login');
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
        await page.goto('http://192.168.1.253:4647/sgfpod1/Rel_0015.pod?cacheId=1733840049536', {
            waitUntil: 'domcontentloaded',
        });
        console.log("foi pg rel")
        await page.click('#tabTabdhtmlgoodies_tabView1_3 > a');
        await page.click('#selecao2_1');
        await page.click('#tabTabdhtmlgoodies_tabView1_4 > a');
        await page.fill('#dat_inicio', dataInicio);
        await page.fill('#dat_fim', dataFim);
        await page.waitForSelector('#saida_3');
        await page.click('#saida_3');

        const context = browser.contexts()[0];
        const [newPage] = await Promise.all([
            context.waitForEvent('page', { timeout: 10000 }),
            page.click('#runReport')
        ]);
        console.log("gerou rel")
        try {
            await newPage.waitForSelector('body > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(30) > td:nth-child(9) > span', { timeout: 2000 });

             value = await newPage.$eval('body > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(30) > td:nth-child(9) > span', (element) => element.innerText);
            await browser.close();
            res.json({ totalCompra: value });
        } catch (error) {
            console.log('Seletor não encontrado dentro do tempo limite de 2 segundos. Fechando a aba.');
        }
    } catch (error) {
        console.log('Erro: A nova aba não foi aberta dentro do tempo limite de 50 segundos. Fechando o navegador.',error);
        res.status(500).json({ message: 'Erro ao rodar o script Playwright',error }); 
    }
       
});

app.get('/buscar-total-perfumeria',(req,res)=>{
    res.sendFile(path.join(__dirname, 'public', 'compras.html'));
})

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
