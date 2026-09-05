const STORAGE_KEY =
    "assistente-clinica-historico";

const THEME_KEY =
    "assistente-clinica-tema";


const messagesEl =
    document.getElementById("messages");

const inputEl =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const newConversationButton =
    document.getElementById("newConversationButton");

const clearButton =
    document.getElementById("clearButton");

const counterEl =
    document.getElementById("counter");

const typingEl =
    document.getElementById("typing");

const themeButton =
    document.getElementById("themeButton");


let messages =
    JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
    );


let loading = false;


function escapeHtml(value) {

    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function markdownToHtml(text) {

    let html =
        escapeHtml(text);


    html = html.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );


    html = html.replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>"
    );


    html = html.replace(
        /\*(.+?)\*/g,
        "<em>$1</em>"
    );


    html = html.replace(
        /^- (.+)$/gm,
        "<li>$1</li>"
    );


    html = html.replace(
        /(<li>.*<\/li>)/gs,
        "<ul>$1</ul>"
    );


    html =
        html.replace(
            /\n/g,
            "<br>"
        );


    return html;

}


function timeNow() {

    return new Date()
        .toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

}


function save() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages)
    );

}


function updateCounter() {

    const count =
        messages.length;


    counterEl.textContent =
        `${count} ${
            count === 1
                ? "mensagem"
                : "mensagens"
        }`;

}


function render() {

    messagesEl.innerHTML = "";


    if (messages.length === 0) {

        messagesEl.innerHTML = `

            <div class="empty">

                <div class="empty-card">

                    <div class="big-icon">
                        🩺
                    </div>

                    <h2>
                        Como posso ajudar?
                    </h2>

                    <p>
                        Envie sua dúvida sobre saúde,
                        sintomas, prevenção, exames
                        ou atendimento clínico.
                    </p>

                </div>

            </div>

        `;


        updateCounter();

        return;
    }


    messages.forEach(message => {

        const row =
            document.createElement("div");


        row.className =
            `message-row ${message.role}`;


        const bubble =
            document.createElement("div");


        bubble.className =
            `message ${message.role}`;


        const content =
            document.createElement("div");


        if (message.role === "assistant") {

            content.innerHTML =
                markdownToHtml(
                    message.content
                );

        } else {

            content.innerHTML =
                escapeHtml(
                    message.content
                ).replace(
                    /\n/g,
                    "<br>"
                );

        }


        const meta =
            document.createElement("div");


        meta.className = "meta";


        const time =
            document.createElement("span");


        time.textContent =
            message.time || "";


        meta.appendChild(time);


        if (message.role === "assistant") {

            const copy =
                document.createElement("button");


            copy.className =
                "copy-button";


            copy.textContent =
                "Copiar";


            copy.addEventListener(
                "click",
                async () => {

                    await navigator
                        .clipboard
                        .writeText(
                            message.content
                        );


                    copy.textContent =
                        "Copiado!";


                    setTimeout(
                        () => {
                            copy.textContent =
                                "Copiar";
                        },
                        1200
                    );

                }
            );


            meta.appendChild(copy);

        }


        bubble.append(
            content,
            meta
        );


        row.appendChild(
            bubble
        );


        messagesEl.appendChild(
            row
        );

    });


    updateCounter();


    messagesEl.scrollTop =
        messagesEl.scrollHeight;

}


function setLoading(value) {

    loading = value;

    typingEl.classList.toggle(
        "hidden",
        !value
    );


    sendButton.disabled =
        value;


    inputEl.disabled =
        value;

}


async function sendMessage() {

    const text =
        inputEl.value.trim();


    if (!text || loading) {

        return;

    }


    messages.push({

        role: "user",

        content: text,

        time: timeNow()

    });


    inputEl.value = "";

    inputEl.style.height =
        "auto";


    save();

    render();

    setLoading(true);


    try {

        const response =
            await fetch(
                "/api/chat",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        messages:
                            messages.map(
                                ({
                                    role,
                                    content
                                }) => ({
                                    role,
                                    content
                                })
                            )

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Erro na comunicação."
            );

        }


        messages.push({

            role: "assistant",

            content: data.answer,

            time: timeNow()

        });


        save();

        render();


    } catch (error) {

        messages.push({

            role: "assistant",

            content:
                `**Não foi possível concluir o atendimento.**

${error.message || "Tente novamente em alguns instantes."}`,

            time: timeNow()

        });


        save();

        render();

    } finally {

        setLoading(false);

        inputEl.focus();

    }

}


function clearConversation() {

    if (!messages.length) {

        return;

    }


    const confirmed =
        confirm(
            "Deseja realmente limpar toda a conversa?"
        );


    if (!confirmed) {

        return;

    }


    messages = [];


    localStorage.removeItem(
        STORAGE_KEY
    );


    render();

    inputEl.focus();

}


function applyTheme(theme) {

    document.body.classList.toggle(
        "dark",
        theme === "dark"
    );


    themeButton.textContent =
        theme === "dark"
            ? "☀"
            : "☾";


    localStorage.setItem(
        THEME_KEY,
        theme
    );

}


sendButton.addEventListener(
    "click",
    sendMessage
);


clearButton.addEventListener(
    "click",
    clearConversation
);


newConversationButton.addEventListener(
    "click",
    clearConversation
);


themeButton.addEventListener(
    "click",
    () => {

        const next =
            document.body.classList.contains(
                "dark"
            )
                ? "light"
                : "dark";


        applyTheme(next);

    }
);


inputEl.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


inputEl.addEventListener(
    "input",
    () => {

        inputEl.style.height =
            "auto";


        inputEl.style.height =
            `${Math.min(
                inputEl.scrollHeight,
                130
            )}px`;

    }
);


applyTheme(
    localStorage.getItem(
        THEME_KEY
    ) || "light"
);


render();

inputEl.focus();

const quickQuestions = document.querySelectorAll(".quick-question");

quickQuestions.forEach(button => {

    button.addEventListener("click", () => {

        const question = button.dataset.question;

        messageInput.value = question;

        messageInput.focus();

    });

});