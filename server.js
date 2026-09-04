import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3000;

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json({ limit: "1mb" }));

app.use(express.static(path.join(__dirname, "public")));


const SYSTEM_PROMPT = `
Você é a Assistente Virtual de uma clínica de saúde.

IDENTIDADE:
Você é uma assistente virtual especializada em assuntos relacionados
a uma clínica e saúde.

TOM:
Formal, amigável, acolhedor, claro e objetivo.

REGRA PRINCIPAL:
Você NÃO pode fugir de assuntos relacionados à clínica e saúde.

Você pode conversar sobre:
- sintomas;
- prevenção;
- exames;
- consultas;
- tratamentos de forma geral;
- medicamentos de forma educativa;
- preparação para consultas;
- cuidados gerais de saúde;
- dúvidas relacionadas à clínica.

Se o usuário perguntar sobre assuntos fora de clínica e saúde,
responda educadamente:

"Desculpe, posso auxiliar somente com assuntos relacionados à
clínica e saúde. Como posso ajudar com sua dúvida de saúde?"

SEGURANÇA:
- Não faça diagnóstico definitivo.
- Não prescreva medicamentos.
- Não indique doses personalizadas.
- Não substitua um profissional de saúde.
- Não invente resultados de exames.
- Não invente informações médicas.
- Quando houver sintomas potencialmente graves, oriente o usuário
  a procurar atendimento médico.
- Em situações de emergência, oriente a procurar imediatamente
  um serviço de emergência.
- Não solicite dados pessoais desnecessários.

OBJETIVO:
Ajudar o usuário a compreender dúvidas de saúde e organizar
informações para conversar melhor com um profissional de saúde.

FORMATO:
- Seja breve.
- Seja objetivo.
- Máximo de 10 linhas por resposta.
- Use Markdown simples quando ajudar na organização.
`;


function sanitizeMessages(messages) {

    if (!Array.isArray(messages)) {
        return [];
    }

    return messages
        .filter(message =>
            message &&
            ["user", "assistant"].includes(message.role) &&
            typeof message.content === "string"
        )
        .slice(-30)
        .map(message => ({
            role: message.role,
            content: message.content.slice(0, 4000)
        }));
}


app.post("/api/chat", async (req, res) => {

    try {

        if (!process.env.OPENAI_API_KEY) {

            return res.status(500).json({
                error: "A chave da OpenAI não foi configurada."
            });

        }

        const messages = sanitizeMessages(req.body.messages);

        if (
            messages.length === 0 ||
            messages[messages.length - 1].role !== "user"
        ) {

            return res.status(400).json({
                error: "Mensagem inválida."
            });

        }


        const response = await client.responses.create({

            model: process.env.OPENAI_MODEL || "gpt-5.6-luna",

            instructions: SYSTEM_PROMPT,

            input: messages,

            max_output_tokens: 500
        });


        const answer =
            response.output_text?.trim() ||
            "Não consegui gerar uma resposta no momento.";


        res.json({
            answer: answer
        });


    } catch (error) {

        console.error("Erro na API:", error);

        res.status(500).json({

            error:
                "Não foi possível se comunicar com o atendimento agora. Tente novamente."

        });

    }

});


app.get("/api/health", (req, res) => {

    res.json({
        status: "ok"
    });

});


app.get("*splat", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );

});


app.listen(PORT, () => {

    console.log(
        `Assistente da Clínica rodando em http://localhost:${PORT}`
    );

});