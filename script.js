/* =====================================================
   FIREBASE / CLOUD FIRESTORE
===================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyABxI_rPAPaIgHpmVtKV9R7CsvOJptmL-g",
    authDomain: "descarrego.firebaseapp.com",
    projectId: "descarrego",
    storageBucket: "descarrego.firebasestorage.app",
    messagingSenderId: "878361368085",
    appId: "1:878361368085:web:c5dd0fdd25e73af61ba01c",
    measurementId: "G-94S2ZMPQ7X"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

/* Cache local da sessão e dos dados carregados do Firestore */
let cloudUsers = [];
let cloudDescargas = [];
let cloudGastos = [];
let cloudHistory = [];

async function loadCollection(name) {
    const snapshot = await getDocs(collection(db, name));
    return snapshot.docs.map(item => ({
        ...item.data(),
        id: item.id
    }));
}

async function writeCollection(name, items, previousOverride = null) {
    const previous = previousOverride || {
        users: cloudUsers,
        descargas: cloudDescargas,
        gastos: cloudGastos,
        history: cloudHistory
    }[name] || [];

    const currentIds = new Set(items.map(item => String(item.id)));

    for (const oldItem of previous) {
        if (!currentIds.has(String(oldItem.id))) {
            try {
                await deleteDoc(doc(db, name, String(oldItem.id)));
            } catch (error) {
                console.error(`Erro ao excluir ${name}:`, error);
            }
        }
    }

    await Promise.all(
        items.map(item =>
            setDoc(
                doc(db, name, String(item.id)),
                item
            )
        )
    );

    if (name === "users") cloudUsers = [...items];
    if (name === "descargas") cloudDescargas = [...items];
    if (name === "gastos") cloudGastos = [...items];
    if (name === "history") cloudHistory = [...items];
}

async function initializeCloudData() {
    const localUsers = JSON.parse(localStorage.getItem(STORAGE_USERS) || "null");
    const localDescargas = JSON.parse(localStorage.getItem(STORAGE_DESCARGAS) || "[]");
    const localGastos = JSON.parse(localStorage.getItem(STORAGE_GASTOS) || "[]");
    const localHistory = JSON.parse(localStorage.getItem(STORAGE_HISTORY) || "[]");

    cloudUsers = await loadCollection("users");
    cloudDescargas = await loadCollection("descargas");
    cloudGastos = await loadCollection("gastos");
    cloudHistory = await loadCollection("history");

    /*
     * Migração automática:
     * se uma coleção do Firestore estiver vazia, aproveita os dados
     * que já estavam salvos neste navegador.
     */
    if (!cloudUsers.length) {
        cloudUsers = localUsers || [{
            id: 1,
            name: "Administrador",
            username: "admin",
            password: "1234",
            role: "admin",
            createdAt: new Date().toISOString()
        }];
        await writeCollection("users", cloudUsers);
    }

    if (!cloudDescargas.length && localDescargas.length) {
        await writeCollection("descargas", localDescargas);
    }

    if (!cloudGastos.length && localGastos.length) {
        await writeCollection("gastos", localGastos);
    }

    if (!cloudHistory.length && localHistory.length) {
        await writeCollection("history", localHistory);
    }

    /* Mantém uma cópia local apenas como cache/compatibilidade. */
    localStorage.setItem(STORAGE_USERS, JSON.stringify(cloudUsers));
    localStorage.setItem(STORAGE_DESCARGAS, JSON.stringify(cloudDescargas));
    localStorage.setItem(STORAGE_GASTOS, JSON.stringify(cloudGastos));
    localStorage.setItem(STORAGE_HISTORY, JSON.stringify(cloudHistory));
}


const STORAGE_USERS = "dislam_users";
const STORAGE_DESCARGAS = "dislam_descargas";
const STORAGE_GASTOS = "dislam_gastos";
const STORAGE_HISTORY = "dislam_history";
const STORAGE_SESSION = "dislam_session";



/* =====================================================
   USUÁRIOS
===================================================== */

function getUsers() {
    return cloudUsers;
}

function saveUsers(users) {
    const previous = cloudUsers;
    cloudUsers = [...users];
    localStorage.setItem(STORAGE_USERS, JSON.stringify(cloudUsers));
    writeCollection("users", cloudUsers, previous).catch(error =>
        console.error("Erro ao salvar usuários no Firestore:", error)
    );
}

/* =====================================================
   DADOS
===================================================== */

function getDescargas() {
    return cloudDescargas;
}

function saveDescargas(data) {
    const previous = cloudDescargas;
    cloudDescargas = [...data];
    localStorage.setItem(STORAGE_DESCARGAS, JSON.stringify(cloudDescargas));
    writeCollection("descargas", cloudDescargas, previous).catch(error =>
        console.error("Erro ao salvar descargas no Firestore:", error)
    );
}

function getGastos() {
    return cloudGastos;
}

function saveGastos(data) {
    const previous = cloudGastos;
    cloudGastos = [...data];
    localStorage.setItem(STORAGE_GASTOS, JSON.stringify(cloudGastos));
    writeCollection("gastos", cloudGastos, previous).catch(error =>
        console.error("Erro ao salvar gastos no Firestore:", error)
    );
}

function getHistory() {
    return cloudHistory;
}

function saveHistory(data) {
    const previous = cloudHistory;
    cloudHistory = [...data];
    localStorage.setItem(STORAGE_HISTORY, JSON.stringify(cloudHistory));
    writeCollection("history", cloudHistory, previous).catch(error =>
        console.error("Erro ao salvar histórico no Firestore:", error)
    );
}


/* =====================================================
   SESSÃO
===================================================== */

let currentUser = null;


function loadSession() {

    const sessionId =
        localStorage.getItem(STORAGE_SESSION);

    if (!sessionId) {
        return;
    }

    const users = getUsers();

    currentUser = users.find(
        user =>
            String(user.id) ===
            String(sessionId)
    ) || null;

}


function saveSession() {

    if (currentUser) {

        localStorage.setItem(
            STORAGE_SESSION,
            currentUser.id
        );

    }

}


function clearSession() {

    localStorage.removeItem(STORAGE_SESSION);

    currentUser = null;

}


/* =====================================================
   UTILITÁRIOS
===================================================== */

function formatCurrency(value) {

    value = Number(value) || 0;

    return value.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


function parseMoney(value) {

    if (!value) {
        return 0;
    }

    let text = String(value)
        .replace(/\s/g, "")
        .replace(/R\$/g, "");

    if (
        text.includes(",") &&
        text.includes(".")
    ) {

        text = text
            .replace(/\./g, "")
            .replace(",", ".");

    } else if (
        text.includes(",")
    ) {

        text =
            text.replace(",", ".");

    }

    const number =
        parseFloat(text);

    return isNaN(number)
        ? 0
        : number;

}


function formatDate(date) {

    if (!date) {
        return "-";
    }

    const d = new Date(date);

    if (isNaN(d.getTime())) {
        return "-";
    }

    return d.toLocaleString(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function localDateTime() {

    const now = new Date();

    const offset =
        now.getTimezoneOffset() * 60000;

    return new Date(
        now.getTime() - offset
    )
        .toISOString()
        .slice(0, 16);

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function generateId() {

    return Date.now() +
        Math.floor(Math.random() * 10000);

}


function getInitial(name) {

    return String(name || "U")
        .trim()
        .charAt(0)
        .toUpperCase();

}


/* =====================================================
   TOAST
===================================================== */

function showToast(
    message,
    type = "success"
) {

    const container =
        document.getElementById(
            "toastContainer"
        );

    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;

    toast.textContent =
        message;

    container.appendChild(toast);

    setTimeout(() => {

        toast.remove();

    }, 3000);

}


/* =====================================================
   HISTÓRICO
===================================================== */

function addHistory(
    action,
    description
) {

    const history =
        getHistory();

    history.unshift({

        id: generateId(),

        action,

        description,

        userId:
            currentUser
                ? currentUser.id
                : null,

        userName:
            currentUser
                ? currentUser.name
                : "Sistema",

        date:
            new Date().toISOString()

    });

    saveHistory(history);

}


function renderHistory() {

    const container =
        document.getElementById(
            "historyList"
        );

    const history =
        getHistory();

    if (!history.length) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-clock-rotate-left"></i>

                <p>
                    Nenhuma movimentação registrada.
                </p>

            </div>

        `;

        return;

    }

    container.innerHTML =
        history.map(item => `

            <div class="history-item">

                <div class="history-icon">

                    <i class="fa-solid fa-pen-to-square"></i>

                </div>

                <div class="history-content">

                    <strong>
                        ${escapeHTML(item.action)}
                    </strong>

                    <p>
                        ${escapeHTML(item.description)}
                    </p>

                    <small>

                        ${escapeHTML(item.userName)}

                        •

                        ${formatDate(item.date)}

                    </small>

                </div>

            </div>

        `).join("");

}


/* =====================================================
   LOGIN
===================================================== */

function initLogin() {

    const form =
        document.getElementById(
            "loginForm"
        );

    form.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            const username =
                document.getElementById(
                    "loginUsername"
                )
                .value
                .trim();

            const password =
                document.getElementById(
                    "loginPassword"
                )
                .value;

            const users =
                getUsers();

            const user =
                users.find(
                    item =>
                        item.username
                            .toLowerCase() ===
                        username.toLowerCase() &&
                        item.password ===
                        password
                );

            if (!user) {

                document.getElementById(
                    "loginMessage"
                ).textContent =
                    "Usuário ou senha incorretos.";

                return;
            }

            currentUser =
                user;

            saveSession();

            showApplication();

        }
    );

}


function showApplication() {

    document
        .getElementById("loginScreen")
        .classList.add("hidden");

    document
        .getElementById("app")
        .classList.remove("hidden");

    updateUserInterface();

    updateDashboard();

    renderDescargas();

    renderGastos();

    renderCash();

    renderHistory();

    renderUsers();

    updateCurrentDate();

}


function logout() {

    clearSession();

    document
        .getElementById("app")
        .classList.add("hidden");

    document
        .getElementById("loginScreen")
        .classList.remove("hidden");

    document
        .getElementById("loginForm")
        .reset();

}


/* =====================================================
   INTERFACE DO USUÁRIO
===================================================== */

function updateUserInterface() {

    if (!currentUser) {
        return;
    }

    const initial =
        getInitial(currentUser.name);

    const role =
        currentUser.role === "admin"
            ? "Administrador"
            : "Usuário";

    document.getElementById(
        "sidebarUserName"
    ).textContent =
        currentUser.name;

    document.getElementById(
        "topUserName"
    ).textContent =
        currentUser.name;

    document.getElementById(
        "sidebarUserRole"
    ).textContent =
        role;

    document.getElementById(
        "topUserRole"
    ).textContent =
        role;

    document.getElementById(
        "sidebarAvatar"
    ).textContent =
        initial;

    document.getElementById(
        "topAvatar"
    ).textContent =
        initial;

    document.getElementById(
        "accountAvatar"
    ).textContent =
        initial;

    document.getElementById(
        "accountName"
    ).textContent =
        currentUser.name;

    document.getElementById(
        "accountRole"
    ).textContent =
        role;

    const adminMenu =
        document.getElementById(
            "adminMenu"
        );

    if (
        currentUser.role === "admin"
    ) {

        adminMenu.classList.remove(
            "hidden"
        );

    } else {

        adminMenu.classList.add(
            "hidden"
        );

    }

}


function updateCurrentDate() {

    document.getElementById(
        "currentDate"
    ).textContent =
        new Date().toLocaleDateString(
            "pt-BR",
            {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );

}


/* =====================================================
   NAVEGAÇÃO
===================================================== */

const pageNames = {

    dashboard:
        "Painel Inicial",

    descargas:
        "Descargas",

    gastos:
        "Gastos",

    caixa:
        "Caixa",

    historico:
        "Histórico",

    usuarios:
        "Usuários",

    conta:
        "Minha Conta"

};


function navigate(page) {

    if (
        page === "usuarios" &&
        currentUser?.role !== "admin"
    ) {

        showToast(
            "Você não possui acesso a esta área.",
            "error"
        );

        return;
    }

    document
        .querySelectorAll(".page")
        .forEach(item => {

            item.classList.remove(
                "active"
            );

        });

    const selected =
        document.getElementById(
            `page-${page}`
        );

    if (selected) {

        selected.classList.add(
            "active"
        );

    }

    document
        .querySelectorAll(".menu-item")
        .forEach(item => {

            item.classList.remove(
                "active"
            );

        });

    const menu =
        document.querySelector(
            `.menu-item[data-page="${page}"]`
        );

    if (menu) {

        menu.classList.add(
            "active"
        );

    }

    document.getElementById(
        "currentPageTitle"
    ).textContent =
        pageNames[page] ||
        "DISLAM";

    updateCurrentDate();

    document
        .getElementById("sidebar")
        .classList.remove("open");

    if (page === "dashboard") {
        updateDashboard();
    }

    if (page === "descargas") {
        renderDescargas();
    }

    if (page === "gastos") {
        renderGastos();
    }

    if (page === "caixa") {
        renderCash();
    }

    if (page === "historico") {
        renderHistory();
    }

    if (page === "usuarios") {
        renderUsers();
    }

}


/* =====================================================
   FILTRO POR INTERVALO DE DATAS
===================================================== */

function filterByDateRange(
    data,
    start,
    end
) {

    if (!start && !end) {
        return data;
    }

    let startDate = null;
    let endDate = null;

    if (start) {

        startDate =
            new Date(start + "T00:00:00");

    }

    if (end) {

        endDate =
            new Date(end + "T23:59:59");

    }

    return data.filter(item => {

        if (!item.data) {
            return false;
        }

        const itemDate =
            new Date(item.data);

        if (
            startDate &&
            itemDate < startDate
        ) {
            return false;
        }

        if (
            endDate &&
            itemDate > endDate
        ) {
            return false;
        }

        return true;

    });

}


/* =====================================================
   DESCARGAS
===================================================== */

function openDescargaModal(id = null) {

    const modal =
        document.getElementById(
            "descargaModal"
        );

    document
        .getElementById("descargaForm")
        .reset();

    document.getElementById(
        "descargaId"
    ).value = "";

    if (id) {

        const item =
            getDescargas().find(
                x =>
                    String(x.id) ===
                    String(id)
            );

        if (!item) {
            return;
        }

        document.getElementById(
            "descargaModalTitle"
        ).textContent =
            "Editar descarga";

        document.getElementById(
            "descargaId"
        ).value =
            item.id;

        document.getElementById(
            "descargaData"
        ).value =
            item.data || "";

        document.getElementById(
            "descargaFornecedor"
        ).value =
            item.fornecedor || "";

        document.getElementById(
            "descargaTransportadora"
        ).value =
            item.transportadora || "";

        document.getElementById(
            "descargaMotorista"
        ).value =
            item.motorista || "";

        document.getElementById(
            "descargaValor"
        ).value =
            item.valor
                ? Number(item.valor)
                    .toLocaleString(
                        "pt-BR",
                        {
                            minimumFractionDigits: 2
                        }
                    )
                : "";

        document.getElementById(
            "descargaObservacao"
        ).value =
            item.observacao || "";

    } else {

        document.getElementById(
            "descargaModalTitle"
        ).textContent =
            "Registrar descarga";

        document.getElementById(
            "descargaData"
        ).value =
            localDateTime();

    }

    modal.classList.add("show");

}


function saveDescarga(event) {

    event.preventDefault();

    const id =
        document.getElementById(
            "descargaId"
        ).value;

    const data =
        document.getElementById(
            "descargaData"
        ).value;

    const fornecedor =
        document.getElementById(
            "descargaFornecedor"
        ).value
        .trim();

    const transportadora =
        document.getElementById(
            "descargaTransportadora"
        ).value
        .trim();

    const motorista =
        document.getElementById(
            "descargaMotorista"
        ).value
        .trim();

    const valor =
        parseMoney(
            document.getElementById(
                "descargaValor"
            ).value
        );

    const observacao =
        document.getElementById(
            "descargaObservacao"
        ).value
        .trim();

    const descargas =
        getDescargas();

    if (id) {

        const index =
            descargas.findIndex(
                x =>
                    String(x.id) ===
                    String(id)
            );

        if (index !== -1) {

            descargas[index] = {

                ...descargas[index],

                data,

                fornecedor,

                transportadora,

                motorista,

                valor,

                observacao,

                updatedAt:
                    new Date().toISOString(),

                updatedBy:
                    currentUser.name

            };

            addHistory(
                "Descarga editada",
                `Descarga de ${fornecedor || "fornecedor não informado"} foi editada.`
            );

        }

    } else {

        descargas.push({

            id:
                generateId(),

            data:
                data ||
                new Date().toISOString(),

            fornecedor,

            transportadora,

            motorista,

            valor,

            observacao,

            createdAt:
                new Date().toISOString(),

            createdBy:
                currentUser.name,

            updatedAt:
                new Date().toISOString(),

            updatedBy:
                currentUser.name

        });

        addHistory(
            "Descarga registrada",
            `Nova descarga ${fornecedor ? "do fornecedor " + fornecedor : "sem fornecedor informado"} registrada.`
        );

    }

    saveDescargas(descargas);

    closeModal("descargaModal");

    renderDescargas();

    renderCash();

    updateDashboard();

    showToast(
        id
            ? "Descarga alterada com sucesso."
            : "Descarga registrada com sucesso."
    );

}


/* =====================================================
   RENDER DESCARGAS
===================================================== */

function renderDescargas() {

    const tbody =
        document.getElementById(
            "descargasTable"
        );

    let data =
        [...getDescargas()];

    const start =
        document.getElementById(
            "filterDescargaStart"
        ).value;

    const end =
        document.getElementById(
            "filterDescargaEnd"
        ).value;

    const search =
        document.getElementById(
            "filterDescargaSearch"
        ).value
        .trim()
        .toLowerCase();

    data =
        filterByDateRange(
            data,
            start,
            end
        );

    if (search) {

        data =
            data.filter(item => {

                const text = [

                    item.fornecedor,
                    item.transportadora,
                    item.motorista,
                    item.observacao

                ]
                .join(" ")
                .toLowerCase();

                return text.includes(
                    search
                );

            });

    }

    data.sort(
        (a, b) =>
            new Date(b.data) -
            new Date(a.data)
    );

    const total =
        data.reduce(
            (sum, item) =>
                sum +
                Number(item.valor || 0),
            0
        );

    document.getElementById(
        "descargasCount"
    ).textContent =
        data.length;

    document.getElementById(
        "descargasFilteredTotal"
    ).textContent =
        formatCurrency(total);

    if (!data.length) {

        tbody.innerHTML = `

            <tr>

                <td colspan="8">

                    <div class="empty-state">

                        <i class="fa-solid fa-truck"></i>

                        <p>
                            Nenhuma descarga encontrada.
                        </p>

                    </div>

                </td>

            </tr>

        `;

        return;

    }

    tbody.innerHTML =
        data.map(item => `

            <tr>

                <td>
                    ${formatDate(item.data)}
                </td>

                <td>
                    ${escapeHTML(
                        item.fornecedor ||
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.transportadora ||
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.motorista ||
                        "-"
                    )}
                </td>

                <td>

                    <strong>
                        ${formatCurrency(
                            item.valor
                        )}
                    </strong>

                </td>

                <td>

                    <div class="audit-info">

                        <strong>
                            ${escapeHTML(
                                item.createdBy ||
                                "-"
                            )}
                        </strong>

                        <small>
                            ${formatDate(
                                item.createdAt
                            )}
                        </small>

                    </div>

                </td>

                <td>

                    <div class="audit-info">

                        <strong>
                            ${escapeHTML(
                                item.updatedBy ||
                                "-"
                            )}
                        </strong>

                        <small>
                            ${formatDate(
                                item.updatedAt
                            )}
                        </small>

                    </div>

                </td>

                <td>

                    <div class="action-buttons">

                        <button
                            class="icon-btn"
                            onclick="openDescargaModal(${item.id})"
                            title="Editar">

                            <i class="fa-solid fa-pen"></i>

                        </button>

                        <button
                            class="icon-btn delete"
                            onclick="deleteDescarga(${item.id})"
                            title="Excluir">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </div>

                </td>

            </tr>

        `).join("");

}


/* =====================================================
   EXCLUIR DESCARGA
===================================================== */

function deleteDescarga(id) {

    const descargas =
        getDescargas();

    const item =
        descargas.find(
            x =>
                String(x.id) ===
                String(id)
        );

    if (!item) {
        return;
    }

    if (
        !confirm(
            "Tem certeza que deseja excluir esta descarga?"
        )
    ) {
        return;
    }

    saveDescargas(
        descargas.filter(
            x =>
                String(x.id) !==
                String(id)
        )
    );

    addHistory(
        "Descarga excluída",
        `Descarga de ${item.fornecedor || "fornecedor não informado"} foi excluída.`
    );

    renderDescargas();

    renderCash();

    updateDashboard();

    showToast(
        "Descarga excluída."
    );

}


/* =====================================================
   GASTOS
===================================================== */

function openGastoModal(id = null) {

    document
        .getElementById("gastoForm")
        .reset();

    document.getElementById(
        "gastoId"
    ).value = "";

    if (id) {

        const item =
            getGastos().find(
                x =>
                    String(x.id) ===
                    String(id)
            );

        if (!item) {
            return;
        }

        document.getElementById(
            "gastoModalTitle"
        ).textContent =
            "Editar gasto";

        document.getElementById(
            "gastoId"
        ).value =
            item.id;

        document.getElementById(
            "gastoData"
        ).value =
            item.data || "";

        document.getElementById(
            "gastoFornecedor"
        ).value =
            item.fornecedor || "";

        document.getElementById(
            "gastoDescricao"
        ).value =
            item.descricao || "";

        document.getElementById(
            "gastoValor"
        ).value =
            item.valor
                ? Number(item.valor)
                    .toLocaleString(
                        "pt-BR",
                        {
                            minimumFractionDigits: 2
                        }
                    )
                : "";

        document.getElementById(
            "gastoObservacao"
        ).value =
            item.observacao || "";

    } else {

        document.getElementById(
            "gastoModalTitle"
        ).textContent =
            "Registrar gasto";

        document.getElementById(
            "gastoData"
        ).value =
            localDateTime();

    }

    document
        .getElementById("gastoModal")
        .classList.add("show");

}


function saveGasto(event) {

    event.preventDefault();

    const id =
        document.getElementById(
            "gastoId"
        ).value;

    const data =
        document.getElementById(
            "gastoData"
        ).value;

    const fornecedor =
        document.getElementById(
            "gastoFornecedor"
        ).value
        .trim();

    const descricao =
        document.getElementById(
            "gastoDescricao"
        ).value
        .trim();

    const valor =
        parseMoney(
            document.getElementById(
                "gastoValor"
            ).value
        );

    const observacao =
        document.getElementById(
            "gastoObservacao"
        ).value
        .trim();

    const gastos =
        getGastos();

    if (id) {

        const index =
            gastos.findIndex(
                x =>
                    String(x.id) ===
                    String(id)
            );

        if (index !== -1) {

            gastos[index] = {

                ...gastos[index],

                data,

                fornecedor,

                descricao,

                valor,

                observacao,

                updatedAt:
                    new Date().toISOString(),

                updatedBy:
                    currentUser.name

            };

            addHistory(
                "Gasto editado",
                `O gasto ${descricao || "sem descrição"} foi editado.`
            );

        }

    } else {

        gastos.push({

            id:
                generateId(),

            data:
                data ||
                new Date().toISOString(),

            fornecedor,

            descricao,

            valor,

            observacao,

            createdAt:
                new Date().toISOString(),

            createdBy:
                currentUser.name,

            updatedAt:
                new Date().toISOString(),

            updatedBy:
                currentUser.name

        });

        addHistory(
            "Gasto registrado",
            `Novo gasto ${descricao || "sem descrição"} registrado.`
        );

    }

    saveGastos(gastos);

    closeModal("gastoModal");

    renderGastos();

    renderCash();

    updateDashboard();

    showToast(
        id
            ? "Gasto alterado com sucesso."
            : "Gasto registrado com sucesso."
    );

}


/* =====================================================
   RENDER GASTOS
===================================================== */

function renderGastos() {

    const tbody =
        document.getElementById(
            "gastosTable"
        );

    let data =
        [...getGastos()];

    const start =
        document.getElementById(
            "filterGastoStart"
        ).value;

    const end =
        document.getElementById(
            "filterGastoEnd"
        ).value;

    const search =
        document.getElementById(
            "filterGastoSearch"
        ).value
        .trim()
        .toLowerCase();

    data =
        filterByDateRange(
            data,
            start,
            end
        );

    if (search) {

        data =
            data.filter(item => {

                const text = [

                    item.descricao,
                    item.fornecedor,
                    item.observacao

                ]
                .join(" ")
                .toLowerCase();

                return text.includes(
                    search
                );

            });

    }

    data.sort(
        (a, b) =>
            new Date(b.data) -
            new Date(a.data)
    );

    const total =
        data.reduce(
            (sum, item) =>
                sum +
                Number(item.valor || 0),
            0
        );

    document.getElementById(
        "gastosCount"
    ).textContent =
        data.length;

    document.getElementById(
        "gastosFilteredTotal"
    ).textContent =
        formatCurrency(total);

    if (!data.length) {

        tbody.innerHTML = `

            <tr>

                <td colspan="7">

                    <div class="empty-state">

                        <i class="fa-solid fa-money-bill-transfer"></i>

                        <p>
                            Nenhum gasto encontrado.
                        </p>

                    </div>

                </td>

            </tr>

        `;

        return;

    }

    tbody.innerHTML =
        data.map(item => `

            <tr>

                <td>
                    ${formatDate(item.data)}
                </td>

                <td>

                    <strong>
                        ${escapeHTML(
                            item.descricao ||
                            "-"
                        )}
                    </strong>

                </td>

                <td>
                    ${escapeHTML(
                        item.fornecedor ||
                        "-"
                    )}
                </td>

                <td>

                    <strong class="activity-value negative">

                        - ${formatCurrency(
                            item.valor
                        )}

                    </strong>

                </td>

                <td>

                    <div class="audit-info">

                        <strong>
                            ${escapeHTML(
                                item.createdBy ||
                                "-"
                            )}
                        </strong>

                        <small>
                            ${formatDate(
                                item.createdAt
                            )}
                        </small>

                    </div>

                </td>

                <td>

                    <div class="audit-info">

                        <strong>
                            ${escapeHTML(
                                item.updatedBy ||
                                "-"
                            )}
                        </strong>

                        <small>
                            ${formatDate(
                                item.updatedAt
                            )}
                        </small>

                    </div>

                </td>

                <td>

                    <div class="action-buttons">

                        <button
                            class="icon-btn"
                            onclick="openGastoModal(${item.id})">

                            <i class="fa-solid fa-pen"></i>

                        </button>

                        <button
                            class="icon-btn delete"
                            onclick="deleteGasto(${item.id})">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </div>

                </td>

            </tr>

        `).join("");

}


/* =====================================================
   EXCLUIR GASTO
===================================================== */

function deleteGasto(id) {

    const gastos =
        getGastos();

    const item =
        gastos.find(
            x =>
                String(x.id) ===
                String(id)
        );

    if (!item) {
        return;
    }

    if (
        !confirm(
            "Tem certeza que deseja excluir este gasto?"
        )
    ) {
        return;
    }

    saveGastos(
        gastos.filter(
            x =>
                String(x.id) !==
                String(id)
        )
    );

    addHistory(
        "Gasto excluído",
        `O gasto ${item.descricao || "sem descrição"} foi excluído.`
    );

    renderGastos();

    renderCash();

    updateDashboard();

    showToast(
        "Gasto excluído."
    );

}


/* =====================================================
   CAIXA
===================================================== */

function renderCash() {

    const descargas =
        getDescargas();

    const gastos =
        getGastos();

    const entradas =
        descargas.reduce(
            (sum, item) =>
                sum +
                Number(item.valor || 0),
            0
        );

    const saidas =
        gastos.reduce(
            (sum, item) =>
                sum +
                Number(item.valor || 0),
            0
        );

    const saldo =
        entradas - saidas;

    document.getElementById(
        "cashEntradas"
    ).textContent =
        formatCurrency(entradas);

    document.getElementById(
        "cashSaidas"
    ).textContent =
        formatCurrency(saidas);

    document.getElementById(
        "cashSaldo"
    ).textContent =
        formatCurrency(saldo);

    const movements = [];

    descargas.forEach(item => {

        movements.push({

            data: item.data,

            tipo: "Entrada",

            descricao:
                `Descarga - ${
                    item.fornecedor ||
                    "Fornecedor não informado"
                }`,

            responsavel:
                item.createdBy || "-",

            valor:
                Number(item.valor || 0),

            positive: true

        });

    });

    gastos.forEach(item => {

        movements.push({

            data: item.data,

            tipo: "Saída",

            descricao:
                item.descricao ||
                "Gasto",

            responsavel:
                item.createdBy || "-",

            valor:
                Number(item.valor || 0),

            positive: false

        });

    });

    movements.sort(
        (a, b) =>
            new Date(b.data) -
            new Date(a.data)
    );

    const tbody =
        document.getElementById(
            "cashTable"
        );

    if (!movements.length) {

        tbody.innerHTML = `

            <tr>

                <td colspan="5">

                    <div class="empty-state">

                        <i class="fa-solid fa-wallet"></i>

                        <p>
                            Nenhuma movimentação.
                        </p>

                    </div>

                </td>

            </tr>

        `;

        return;

    }

    tbody.innerHTML =
        movements.map(item => `

            <tr>

                <td>
                    ${formatDate(item.data)}
                </td>

                <td>
                    <strong>
                        ${item.tipo}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                        item.descricao
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.responsavel
                    )}
                </td>

                <td>

                    <strong class="${
                        item.positive
                            ? "activity-value positive"
                            : "activity-value negative"
                    }">

                        ${
                            item.positive
                                ? "+ "
                                : "- "
                        }

                        ${formatCurrency(
                            item.valor
                        )}

                    </strong>

                </td>

            </tr>

        `).join("");

}


/* =====================================================
   DASHBOARD
===================================================== */

let financeChart = null;


function updateDashboard() {

    const descargas =
        getDescargas();

    const gastos =
        getGastos();

    const totalDescargas =
        descargas.reduce(
            (sum, item) =>
                sum +
                Number(item.valor || 0),
            0
        );

    const totalGastos =
        gastos.reduce(
            (sum, item) =>
                sum +
                Number(item.valor || 0),
            0
        );

    const saldo =
        totalDescargas -
        totalGastos;

    document.getElementById(
        "dashDescargas"
    ).textContent =
        descargas.length;

    document.getElementById(
        "dashRecebido"
    ).textContent =
        formatCurrency(
            totalDescargas
        );

    document.getElementById(
        "dashGastos"
    ).textContent =
        formatCurrency(
            totalGastos
        );

    document.getElementById(
        "dashSaldo"
    ).textContent =
        formatCurrency(
            saldo
        );

    document.getElementById(
        "summaryDescargas"
    ).textContent =
        descargas.length;

    const fornecedores =
        new Set();

    descargas.forEach(item => {

        if (item.fornecedor) {

            fornecedores.add(
                item.fornecedor.trim()
            );

        }

    });

    document.getElementById(
        "summaryFornecedores"
    ).textContent =
        fornecedores.size;

    document.getElementById(
        "summaryGastos"
    ).textContent =
        gastos.length;

    document.getElementById(
        "summaryUsuarios"
    ).textContent =
        getUsers().length;


    /* ÚLTIMAS DESCARGAS */

    const ultimasDescargas =
        [...descargas]
            .sort(
                (a, b) =>
                    new Date(b.data) -
                    new Date(a.data)
            )
            .slice(0, 5);

    const latestDescargas =
        document.getElementById(
            "latestDescargas"
        );

    if (!ultimasDescargas.length) {

        latestDescargas.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-truck"></i>

                <p>
                    Nenhuma descarga registrada.
                </p>

            </div>

        `;

    } else {

        latestDescargas.innerHTML =
            ultimasDescargas.map(
                item => `

                <div class="activity-item">

                    <div class="activity-icon blue">

                        <i class="fa-solid fa-truck"></i>

                    </div>

                    <div class="activity-info">

                        <strong>

                            ${escapeHTML(
                                item.fornecedor ||
                                "Fornecedor não informado"
                            )}

                        </strong>

                        <small>

                            ${formatDate(
                                item.data
                            )}

                        </small>

                    </div>

                    <strong class="activity-value positive">

                        ${formatCurrency(
                            item.valor
                        )}

                    </strong>

                </div>

            `
            ).join("");

    }


    /* ÚLTIMOS GASTOS */

    const ultimosGastos =
        [...gastos]
            .sort(
                (a, b) =>
                    new Date(b.data) -
                    new Date(a.data)
            )
            .slice(0, 5);

    const latestGastos =
        document.getElementById(
            "latestGastos"
        );

    if (!ultimosGastos.length) {

        latestGastos.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-money-bill-transfer"></i>

                <p>
                    Nenhum gasto registrado.
                </p>

            </div>

        `;

    } else {

        latestGastos.innerHTML =
            ultimosGastos.map(
                item => `

                <div class="activity-item">

                    <div class="activity-icon red">

                        <i class="fa-solid fa-arrow-up"></i>

                    </div>

                    <div class="activity-info">

                        <strong>

                            ${escapeHTML(
                                item.descricao ||
                                "Gasto"
                            )}

                        </strong>

                        <small>

                            ${formatDate(
                                item.data
                            )}

                        </small>

                    </div>

                    <strong class="activity-value negative">

                        - ${formatCurrency(
                            item.valor
                        )}

                    </strong>

                </div>

            `
            ).join("");

    }

    updateFinanceChart(
        descargas,
        gastos
    );

}


/* =====================================================
   GRÁFICO
===================================================== */

function updateFinanceChart(
    descargas,
    gastos
) {

    const canvas =
        document.getElementById(
            "financeChart"
        );

    if (!canvas) {
        return;
    }

    const entradas =
        descargas.reduce(
            (sum, item) =>
                sum +
                Number(item.valor || 0),
            0
        );

    const saidas =
        gastos.reduce(
            (sum, item) =>
                sum +
                Number(item.valor || 0),
            0
        );

    if (financeChart) {

        financeChart.destroy();

    }

    financeChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels: [
                        "Recebimentos",
                        "Gastos"
                    ],

                    datasets: [

                        {

                            label:
                                "Valor",

                            data: [
                                entradas,
                                saidas
                            ]

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {

                                callback:
                                    function(value) {

                                        return formatCurrency(
                                            value
                                        );

                                    }

                            }

                        }

                    }

                }

            }
        );

}


/* =====================================================
   USUÁRIOS
===================================================== */

function renderUsers() {

    const container =
        document.getElementById(
            "usersGrid"
        );

    if (
        currentUser?.role !== "admin"
    ) {

        container.innerHTML = "";

        return;

    }

    const users =
        getUsers();

    container.innerHTML =
        users.map(
            user => `

            <div class="user-card">

                <div class="user-card-top">

                    <div class="avatar">

                        ${escapeHTML(
                            getInitial(
                                user.name
                            )
                        )}

                    </div>

                    <div>

                        <h3>
                            ${escapeHTML(
                                user.name
                            )}
                        </h3>

                        <p>
                            @${escapeHTML(
                                user.username
                            )}
                        </p>

                    </div>

                </div>

                <span class="role-badge">

                    ${
                        user.role === "admin"
                            ? "ADMINISTRADOR"
                            : "USUÁRIO"
                    }

                </span>

                <div class="user-card-actions">

                    <button
                        class="btn-secondary"
                        onclick="editUser(${user.id})">

                        <i class="fa-solid fa-pen"></i>

                        Editar

                    </button>

                    ${
                        String(user.id) !==
                        String(currentUser.id)
                            ? `

                            <button
                                class="icon-btn delete"
                                onclick="deleteUser(${user.id})">

                                <i class="fa-solid fa-trash"></i>

                            </button>

                            `
                            : ""
                    }

                </div>

            </div>

        `
        ).join("");

}


function openUserModal(id = null) {

    document
        .getElementById("userForm")
        .reset();

    document.getElementById(
        "userId"
    ).value = "";

    if (id) {

        const user =
            getUsers().find(
                x =>
                    String(x.id) ===
                    String(id)
            );

        if (!user) {
            return;
        }

        document.getElementById(
            "userModalTitle"
        ).textContent =
            "Editar usuário";

        document.getElementById(
            "userId"
        ).value =
            user.id;

        document.getElementById(
            "userName"
        ).value =
            user.name;

        document.getElementById(
            "userUsername"
        ).value =
            user.username;

        document.getElementById(
            "userRole"
        ).value =
            user.role;

    } else {

        document.getElementById(
            "userModalTitle"
        ).textContent =
            "Novo usuário";

    }

    document
        .getElementById("userModal")
        .classList.add("show");

}


function editUser(id) {

    if (
        currentUser?.role !== "admin"
    ) {
        return;
    }

    openUserModal(id);

}


function saveUser(event) {

    event.preventDefault();

    if (
        currentUser?.role !== "admin"
    ) {

        showToast(
            "Somente o administrador pode gerenciar usuários.",
            "error"
        );

        return;

    }

    const id =
        document.getElementById(
            "userId"
        ).value;

    const name =
        document.getElementById(
            "userName"
        ).value
        .trim();

    const username =
        document.getElementById(
            "userUsername"
        ).value
        .trim();

    const password =
        document.getElementById(
            "userPassword"
        ).value;

    const role =
        document.getElementById(
            "userRole"
        ).value;

    if (!name || !username) {

        showToast(
            "Informe nome e usuário.",
            "error"
        );

        return;

    }

    const users =
        getUsers();

    const usernameExists =
        users.some(
            user =>
                user.username
                    .toLowerCase() ===
                username.toLowerCase() &&
                String(user.id) !==
                String(id)
        );

    if (usernameExists) {

        showToast(
            "Este usuário já existe.",
            "error"
        );

        return;

    }

    if (id) {

        const index =
            users.findIndex(
                x =>
                    String(x.id) ===
                    String(id)
            );

        if (index !== -1) {

            users[index].name =
                name;

            users[index].username =
                username;

            users[index].role =
                role;

            if (password) {

                users[index].password =
                    password;

            }

            if (
                String(currentUser.id) ===
                String(id)
            ) {

                currentUser =
                    users[index];

                saveSession();

                updateUserInterface();

            }

            addHistory(
                "Usuário editado",
                `O usuário ${name} foi alterado pelo administrador.`
            );

        }

    } else {

        if (!password) {

            showToast(
                "Informe uma senha para o novo usuário.",
                "error"
            );

            return;

        }

        users.push({

            id:
                generateId(),

            name,

            username,

            password,

            role,

            createdAt:
                new Date().toISOString()

        });

        addHistory(
            "Usuário criado",
            `O usuário ${name} foi criado.`
        );

    }

    saveUsers(users);

    closeModal("userModal");

    renderUsers();

    updateDashboard();

    showToast(
        id
            ? "Usuário alterado."
            : "Usuário criado."
    );

}


function deleteUser(id) {

    if (
        currentUser?.role !== "admin"
    ) {
        return;
    }

    if (
        String(id) ===
        String(currentUser.id)
    ) {

        showToast(
            "Você não pode excluir seu próprio usuário.",
            "error"
        );

        return;

    }

    const users =
        getUsers();

    const user =
        users.find(
            x =>
                String(x.id) ===
                String(id)
        );

    if (!user) {
        return;
    }

    if (
        !confirm(
            `Excluir o usuário ${user.name}?`
        )
    ) {
        return;
    }

    saveUsers(
        users.filter(
            x =>
                String(x.id) !==
                String(id)
        )
    );

    addHistory(
        "Usuário excluído",
        `O usuário ${user.name} foi excluído.`
    );

    renderUsers();

    updateDashboard();

    showToast(
        "Usuário excluído."
    );

}


/* =====================================================
   ALTERAR SENHA
===================================================== */

function changePassword(event) {

    event.preventDefault();

    const current =
        document.getElementById(
            "currentPassword"
        ).value;

    const newPassword =
        document.getElementById(
            "newPassword"
        ).value;

    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        ).value;

    if (
        current !==
        currentUser.password
    ) {

        showToast(
            "A senha atual está incorreta.",
            "error"
        );

        return;

    }

    if (
        !newPassword ||
        newPassword.length < 4
    ) {

        showToast(
            "A nova senha deve possuir pelo menos 4 caracteres.",
            "error"
        );

        return;

    }

    if (
        newPassword !==
        confirmPassword
    ) {

        showToast(
            "As novas senhas não coincidem.",
            "error"
        );

        return;

    }

    const users =
        getUsers();

    const index =
        users.findIndex(
            x =>
                String(x.id) ===
                String(currentUser.id)
        );

    if (index === -1) {
        return;
    }

    users[index].password =
        newPassword;

    currentUser =
        users[index];

    saveUsers(users);

    saveSession();

    addHistory(
        "Senha alterada",
        `A senha do usuário ${currentUser.name} foi alterada.`
    );

    document
        .getElementById(
            "changePasswordForm"
        )
        .reset();

    showToast(
        "Senha alterada com sucesso."
    );

}


/* =====================================================
   MODAIS
===================================================== */

function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}


/* =====================================================
   EVENTOS
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        try {
            await initializeCloudData();
        } catch (error) {
            console.error("Erro ao carregar o Firestore:", error);
            showToast(
                "Não foi possível conectar ao Firebase. Verifique as regras do Firestore.",
                "error"
            );
            return;
        }

        getUsers();

        loadSession();

        initLogin();


        /* LOGIN AUTOMÁTICO */

        if (currentUser) {

            showApplication();

        }


        /* MENU */

        document
            .querySelectorAll(".menu-item")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function() {

                        if (
                            this.dataset.page
                        ) {

                            navigate(
                                this.dataset.page
                            );

                        }

                    }
                );

            });


        document
            .querySelectorAll("[data-page-link]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function() {

                        navigate(
                            this.dataset.pageLink
                        );

                    }
                );

            });


        /* SIDEBAR */

        document
            .getElementById("openSidebar")
            .addEventListener(
                "click",
                function() {

                    document
                        .getElementById(
                            "sidebar"
                        )
                        .classList.add(
                            "open"
                        );

                }
            );


        document
            .getElementById("closeSidebar")
            .addEventListener(
                "click",
                function() {

                    document
                        .getElementById(
                            "sidebar"
                        )
                        .classList.remove(
                            "open"
                        );

                }
            );


        /* LOGOUT */

        document
            .getElementById("logoutBtn")
            .addEventListener(
                "click",
                logout
            );


        /* DESCARGA */

        document
            .getElementById("newDescargaBtn")
            .addEventListener(
                "click",
                () =>
                    openDescargaModal()
            );


        document
            .getElementById("descargaForm")
            .addEventListener(
                "submit",
                saveDescarga
            );


        /* GASTO */

        document
            .getElementById("newGastoBtn")
            .addEventListener(
                "click",
                () =>
                    openGastoModal()
            );


        document
            .getElementById("gastoForm")
            .addEventListener(
                "submit",
                saveGasto
            );


        /* USUÁRIO */

        document
            .getElementById("newUserBtn")
            .addEventListener(
                "click",
                () =>
                    openUserModal()
            );


        document
            .getElementById("userForm")
            .addEventListener(
                "submit",
                saveUser
            );


        /* SENHA */

        document
            .getElementById(
                "changePasswordForm"
            )
            .addEventListener(
                "submit",
                changePassword
            );


        /* FECHAR MODAIS */

        document
            .querySelectorAll("[data-close]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function() {

                        closeModal(
                            this.dataset.close
                        );

                    }
                );

            });


        /* =================================================
           ENTER NÃO SALVA DESCARGA/GASTO
        ================================================= */

        ["descargaForm", "gastoForm"].forEach(function(formId) {

            const form = document.getElementById(formId);

            if (!form) return;

            form.addEventListener("keydown", function(event) {

                /* Enter dentro de textarea continua funcionando. */
                if (
                    event.key === "Enter" &&
                    event.target.tagName !== "TEXTAREA" &&
                    event.target.tagName !== "BUTTON"
                ) {
                    event.preventDefault();
                }

            });

        });


        /* =================================================
           FILTROS DE DESCARGAS
        ================================================= */

        document
            .getElementById(
                "filterDescargaStart"
            )
            .addEventListener(
                "change",
                renderDescargas
            );

        document
            .getElementById(
                "filterDescargaEnd"
            )
            .addEventListener(
                "change",
                renderDescargas
            );

        document
            .getElementById(
                "filterDescargaSearch"
            )
            .addEventListener(
                "input",
                renderDescargas
            );

        document
            .getElementById(
                "clearDescargaFilters"
            )
            .addEventListener(
                "click",
                function() {

                    document.getElementById(
                        "filterDescargaStart"
                    ).value = "";

                    document.getElementById(
                        "filterDescargaEnd"
                    ).value = "";

                    document.getElementById(
                        "filterDescargaSearch"
                    ).value = "";

                    renderDescargas();

                }
            );


        /* =================================================
           FILTROS DE GASTOS
        ================================================= */

        document
            .getElementById(
                "filterGastoStart"
            )
            .addEventListener(
                "change",
                renderGastos
            );

        document
            .getElementById(
                "filterGastoEnd"
            )
            .addEventListener(
                "change",
                renderGastos
            );

        document
            .getElementById(
                "filterGastoSearch"
            )
            .addEventListener(
                "input",
                renderGastos
            );

        document
            .getElementById(
                "clearGastoFilters"
            )
            .addEventListener(
                "click",
                function() {

                    document.getElementById(
                        "filterGastoStart"
                    ).value = "";

                    document.getElementById(
                        "filterGastoEnd"
                    ).value = "";

                    document.getElementById(
                        "filterGastoSearch"
                    ).value = "";

                    renderGastos();

                }
            );


        /* =================================================
           MÁSCARA DE DINHEIRO
        ================================================= */

        document
            .querySelectorAll(
                "#descargaValor, #gastoValor"
            )
            .forEach(input => {

                input.addEventListener(
                    "input",
                    function() {

                        let value =
                            this.value
                                .replace(/\D/g, "");

                        if (!value) {

                            this.value = "";

                            return;

                        }

                        value =
                            (
                                Number(value) /
                                100
                            ).toLocaleString(
                                "pt-BR",
                                {
                                    minimumFractionDigits: 2
                                }
                            );

                        this.value =
                            value;

                    }
                );

            });

    }
);
/* =====================================================
   FUNÇÕES GLOBAIS DOS BOTÕES
   Necessário porque o script usa type="module"
===================================================== */

window.openDescargaModal = openDescargaModal;
window.saveDescarga = saveDescarga;
window.deleteDescarga = deleteDescarga;

window.openGastoModal = openGastoModal;
window.saveGasto = saveGasto;
window.deleteGasto = deleteGasto;

window.openUserModal = openUserModal;
window.editUser = editUser;
window.saveUser = saveUser;
window.deleteUser = deleteUser;


/* =====================================================
   ENTER = PRÓXIMO CAMPO
   Impede que o Enter envie o formulário
===================================================== */

function enableEnterNavigation(formId) {

    const form =
        document.getElementById(formId);

    if (!form) {
        return;
    }

    form.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key !== "Enter"
            ) {
                return;
            }

            /*
             * Se estiver em textarea,
             * permite quebra de linha.
             */
            if (
                event.target.tagName === "TEXTAREA"
            ) {
                return;
            }

            event.preventDefault();

            const fields =
                Array.from(
                    form.querySelectorAll(
                        "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled])"
                    )
                ).filter(
                    field =>
                        field.offsetParent !== null
                );

            const currentIndex =
                fields.indexOf(
                    event.target
                );

            if (
                currentIndex === -1
            ) {
                return;
            }

            const nextField =
                fields[currentIndex + 1];

            if (nextField) {

                nextField.focus();

                /*
                 * Se for campo de texto,
                 * seleciona o conteúdo.
                 */
                if (
                    nextField.select
                ) {
                    nextField.select();
                }

            }

        }
    );

}


/* =====================================================
   ATIVAR NAVEGAÇÃO POR ENTER
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        enableEnterNavigation(
            "descargaForm"
        );

        enableEnterNavigation(
            "gastoForm"
        );

        enableEnterNavigation(
            "userForm"
        );

    }
);