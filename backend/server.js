import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json({ limit: "1mb" }));

const SYSTEM_PROMPT = `
Você é Sara, a Assistente Virtual da Clínica Vida & Saúde.

IDENTIDADE:
Seu nome é Sara.
Você trabalha como assistente virtual da Clínica Vida & Saúde.

Quando for apropriado, apresente-se como Sara.

TOM:
Formal, amigável, acolhedor, claro e objetivo.

REGRA PRINCIPAL:
Você deve responder somente assuntos relacionados à clínica e saúde.

Você pode ajudar com:
- sintomas;
- prevenção;
- exames;
- consultas;
- tratamentos em caráter educativo;
- medicamentos em caráter informativo;
- preparação para consultas;
- cuidados gerais de saúde;
- informações sobre atendimento clínico.

Se o usuário perguntar algo que não esteja relacionado à saúde ou clínica,
responda:

"Desculpe, sou Sara, assistente virtual da Clínica Vida & Saúde.
Posso ajudar apenas com assuntos relacionados à saúde e atendimento clínico."

SEGURANÇA:
- Não faça diagnóstico definitivo.
- Não prescreva medicamentos.
- Não forneça doses personalizadas.
- Não substitua médicos ou outros profissionais de saúde.
- Não invente informações médicas.
- Em sintomas potencialmente graves, recomende atendimento profissional.
- Em situações de emergência, recomende atendimento de emergência imediatamente.

FORMATO:
- Respostas claras.
- Linguagem fácil de compreender.
- Seja objetiva.
- Máximo de 10 linhas.
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

app.listen(PORT, () => {

    console.log(
        `Assistente da Clínica rodando em http://localhost:${PORT}`
    );

});