# Bot Assistente Técnico para WhatsApp

Este é um serviço de backend que funciona como um assistente técnico especialista, operando exclusivamente através do WhatsApp. Ele responde a perguntas técnicas com base em um conjunto de documentos PDF que você fornece.

## Funcionalidades

- **Baseado em Documentos:** Responde perguntas utilizando apenas o conteúdo de arquivos PDF fornecidos.
- **Integração com WhatsApp:** Interage diretamente com usuários via WhatsApp.
- **Comando de Ativação:** Responde apenas a mensagens que começam com `!ia`, ignorando outras conversas.
- **Inteligência Artificial:** Utiliza o modelo `gemini-2.5-flash` do Google para gerar respostas precisas e contextuais.
- **Fácil Configuração:** Roda em qualquer ambiente com Node.js, otimizado para servidores e containers Docker.

## Pré-requisitos

- **Node.js** (versão 18 ou superior)
- **Conta do WhatsApp** (pode ser uma conta pessoal ou dedicada para o bot)
- **Google Gemini API Key:** Você pode obter uma chave de API no [Google AI Studio](https://aistudio.google.com/app/apikey).

## Instalação e Configuração

1.  **Clone o repositório:**
    ```bash
    git clone <url-do-repositorio>
    cd <nome-do-diretorio>
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure sua Chave de API:**
    Crie um arquivo chamado `.env` na raiz do projeto e adicione sua chave da API do Google Gemini:
    ```
    API_KEY=SUA_CHAVE_AQUI
    ```

4.  **Adicione seus Documentos:**
    Crie uma pasta chamada `pdfs` na raiz do projeto e coloque todos os manuais técnicos em formato PDF dentro dela.

    ```
    /seu-projeto
    |-- /pdfs
    |   |-- manual_produto_A.pdf
    |   |-- guia_tecnico_B.pdf
    |-- bot.js
    |-- package.json
    |-- .env
    `-- ...
    ```

## Executando o Bot

1.  **Inicie o bot:**
    ```bash
    npm start
    ```

2.  **Conecte ao WhatsApp:**
    Na primeira execução, um QR Code será exibido no seu terminal. Abra o WhatsApp no seu celular, vá em `Aparelhos conectados` e escaneie o QR Code.

3.  **Sessão Salva:**
    Após a primeira conexão bem-sucedida, uma sessão será salva localmente na pasta `.wwebjs_auth`. Isso evita que você precise escanear o QR Code toda vez que iniciar o bot.

## Como Usar

Em qualquer conversa do WhatsApp (privada ou em grupo) com a conta conectada, envie uma mensagem começando com `!ia` seguido da sua pergunta.

**Exemplo:**
```
!ia qual a pressão recomendada para o pneu do modelo X?
```

O bot irá processar a pergunta, consultar os documentos PDF e responder na mesma conversa.

## Para Rodar em um Container Docker

Este projeto é otimizado para rodar em containers. Certifique-se de que sua imagem Docker tenha todas as dependências do Puppeteer instaladas (como `libnss3`, `libatk1.0-0`, etc.). A configuração `args: ['--no-sandbox']` já está incluída no código para facilitar a execução em ambientes virtualizados.
