const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs/promises');
const path = require('path');
const pdf = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');

require('dotenv').config();

const PDFS_PATH = path.join(__dirname, 'pdfs');
const COMMAND_PREFIX = '!ia';
let knowledgeBase = '';

// Validação da Chave de API do Google
if (!process.env.API_KEY) {
    console.error('\x1b[31m%s\x1b[0m', 'ERRO FATAL: A variável de ambiente API_KEY não foi definida.');
    console.error('Por favor, crie um arquivo .env e adicione a linha: API_KEY=SUA_CHAVE_AQUI');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Carrega e processa todos os arquivos PDF do diretório 'pdfs'.
 * O texto extraído é armazenado na variável global `knowledgeBase`.
 */
async function getKnowledgeContext() {
    console.log(`[i] Lendo arquivos do diretório: ${PDFS_PATH}`);
    try {
        await fs.access(PDFS_PATH);
    } catch (error) {
        console.warn(`\x1b[33m%s\x1b[0m`, `[AVISO] O diretório 'pdfs' não foi encontrado. Criando...`);
        await fs.mkdir(PDFS_PATH);
        knowledgeBase = "Você é um assistente técnico especialista. Responda a pergunta do usuário estritamente com base no seguinte conhecimento extraído de manuais técnicos: (Nenhum documento foi carregado)";
        return;
    }

    const files = await fs.readdir(PDFS_PATH);
    const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');

    if (pdfFiles.length === 0) {
        console.warn(`\x1b[33m%s\x1b[0m`, `[AVISO] Nenhum arquivo PDF encontrado no diretório 'pdfs'.`);
        knowledgeBase = "Você é um assistente técnico especialista. Responda a pergunta do usuário estritamente com base no seguinte conhecimento extraído de manuais técnicos: (Nenhum documento foi carregado)";
        return;
    }

    console.log(`[i] Encontrados ${pdfFiles.length} arquivo(s) PDF. Processando...`);
    let combinedText = '';
    for (const file of pdfFiles) {
        const filePath = path.join(PDFS_PATH, file);
        try {
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdf(dataBuffer);
            combinedText += data.text + '\n\n';
            console.log(`  - Processado: ${file}`);
        } catch (err) {
            console.error(`\x1b[31m%s\x1b[0m`, `  - Erro ao processar o arquivo ${file}:`, err);
        }
    }

    knowledgeBase = `Você é um assistente técnico especialista. Responda a pergunta do usuário estritamente com base no seguinte conhecimento extraído de manuais técnicos:\n\n${combinedText}`;
    console.log('[i] Base de conhecimento atualizada.');
}

/**
 * Gera uma resposta usando a API Gemini com base no prompt do usuário e na base de conhecimento.
 * @param {string} prompt A pergunta do usuário.
 * @returns {Promise<string>} A resposta gerada pela IA.
 */
async function generateAnswer(prompt) {
    if (!knowledgeBase) {
        return "A base de conhecimento ainda não foi carregada. Por favor, aguarde a inicialização ser concluída.";
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: knowledgeBase,
            },
        });
        return response.text;
    } catch (error) {
        console.error("\x1b[31m%s\x1b[0m", "Erro ao chamar a API Gemini:", error);
        return "Desculpe, não consegui processar sua pergunta no momento. Ocorreu um erro com a IA.";
    }
}

console.log('[i] Iniciando o bot assistente técnico...');

// Configuração do cliente do WhatsApp
// Importante para rodar em containers/servidores sem interface gráfica
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
    }
});

client.on('qr', (qr) => {
    console.log('\n\x1b[32m%s\x1b[0m', '--- ESCANEIE O QR CODE ABAIXO COM SEU WHATSAPP ---');
    qrcode.generate(qr, { small: true });
    console.log('\x1b[32m%s\x1b[0m', '-----------------------------------------------------\n');
});

client.on('ready', async () => {
    console.log('\x1b[32m%s\x1b[0m', '[✓] Cliente do WhatsApp está pronto!');
    try {
        await getKnowledgeContext();
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', '[-] Falha crítica ao carregar a base de conhecimento:', error);
    }
});

client.on('message', async (msg) => {
    const content = msg.body;

    if (!content || !content.toLowerCase().startsWith(COMMAND_PREFIX)) {
        return; // Ignora mensagens que não são comandos
    }
    
    const prompt = content.substring(COMMAND_PREFIX.length).trim();

    if (!prompt) {
        msg.reply('Por favor, forneça uma pergunta após o comando `!ia`.');
        return;
    }

    console.log(`[>] Mensagem recebida de ${msg.from}: ${prompt}`);
    
    msg.reply('Analisando os manuais e preparando sua resposta... 🤖');
    
    const answer = await generateAnswer(prompt);
    
    console.log(`[<] Enviando resposta para ${msg.from}`);
    msg.reply(answer);
});

client.on('auth_failure', msg => {
    console.error('\x1b[31m%s\x1b[0m', 'ERRO DE AUTENTICAÇÃO:', msg);
});

client.on('disconnected', (reason) => {
    console.warn('\x1b[33m%s\x1b[0m', 'Cliente foi desconectado!', reason);
});

client.initialize();
