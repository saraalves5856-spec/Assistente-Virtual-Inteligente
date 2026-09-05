# Assistente Virtual da Clínica

Assistente virtual desenvolvido com:

- HTML5
- CSS3
- JavaScript
- Fetch API
- Node.js
- Express
- OpenAI API
- LocalStorage

## Funcionalidades

- Chat
- Histórico
- Nova conversa
- Limpar conversa
- Modo claro
- Modo escuro
- Enter para enviar
- Indicador "Pensando..."
- Spinner
- Copiar respostas
- Contador de mensagens
- Horário das mensagens
- Scroll automático
- Markdown
- Tratamento de erros

## Instalação

Execute:

npm install

Configure o arquivo `.env`:

OPENAI_API_KEY=sua_chave
OPENAI_MODEL=gpt-5.6-luna
PORT=3000

Execute:

npm start

Abra:

http://localhost:3000

## API

### POST /api/chat

Recebe o histórico da conversa.

Exemplo:

{
  "messages": [
    {
      "role": "user",
      "content": "Estou com dor de garganta."
    }
  ]
}

Retorna:

{
  "answer": "Resposta da assistente"
}

### GET /api/health

Verifica se a API está funcionando.

Retorno:

{
  "status": "ok"
}