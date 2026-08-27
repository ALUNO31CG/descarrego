/* =====================================================
   DISLAM
   CONTROLE DE DESCARGAS
   FIREBASE / FIRESTORE
===================================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs,
    getDoc,
    doc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


/* =====================================================
   CONFIGURAÇÃO FIREBASE
===================================================== */

/*
   COLOQUE AQUI A CONFIGURAÇÃO DO SEU FIREBASE.

   Ela fica em:

   Firebase
   → Configurações do projeto
   → Seus aplicativos
   → Aplicativo da Web
   → Configuração do SDK
*/

const firebaseConfig = {

    apiKey: "AIzaSyABxI_rPAPaIgHpmVtKV9R7CsvOJptmL-g",

    authDomain: "descarrego.firebaseapp.com",

    projectId: "descarrego",

    storageBucket: "descarrego.firebasestorage.app",

    messagingSenderId: "878361368085",

    appId: "1:878361368085:web:c5dd0fdd25e73af61ba01c",

    measurementId: "G-94S2ZMPQ7X"

};


/* =====================================================
   INICIALIZAR FIREBASE
===================================================== */

const app =
    initializeApp(firebaseConfig);

const db =
    getFirestore(app);


/* =====================================================
   COLEÇÕES
===================================================== */

const USERS_COLLECTION = "users";
const DESCARGAS_COLLECTION = "descargas";
const GASTOS_COLLECTION = "gastos";
const HISTORY_COLLECTION = "history";


/* =====================================================
   SESSÃO
===================================================== */

const STORAGE_SESSION =
    "dislam_session";

let currentUser = null;


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

    let text =
        String(value)
            .replace(/\s/g, "")
            .replace(/R\$/g, "");

    if (
        text.includes(",") &&
        text.includes(".")
    ) {

        text =
            text
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

    const d =
        new Date(date);

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

    const now =
        new Date();

    const offset =
        now.getTimezoneOffset() *
        60000;

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
        Math.floor(
            Math.random() * 10000
        );

}


function getInitial(name) {

    return String(
        name || "U"
    )
        .trim()
        .charAt(0)
        .toUpperCase();

}


function getNow() {

    return new Date().toISOString();

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

    if (!container) {
        return;
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;

    toast.textContent =
        message;

    container.appendChild(toast);

    setTimeout(
        () => toast.remove(),
        3000
    );

}


/* =====================================================
   FIRESTORE - USUÁRIOS
===================================================== */

async function getUsers() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    USERS_COLLECTION
                )
            );

        const users = [];

        snapshot.forEach(
            item => {

                users.push({
                    id: item.id,
                    ...item.data()
                });

            }
        );

        return users;

    } catch (error) {

        console.error(
            "Erro ao buscar usuários:",
            error
        );

        showToast(
            "Erro ao conectar com o Firebase.",
            "error"
        );

        return [];

    }

}


/* =====================================================
   CRIAR ADMINISTRADOR INICIAL
===================================================== */

async function initializeAdmin() {

    try {

        const users =
            await getUsers();

        if (users.length > 0) {
            return;
        }

        const adminId =
            String(generateId());

        const admin = {

            id: adminId,

            name:
                "Administrador",

            username:
                "admin",

            password:
                "1234",

            role:
                "admin",

            createdAt:
                getNow()

        };

        await setDoc(
            doc(
                db,
                USERS_COLLECTION,
                adminId
            ),
            admin
        );

        console.log(
            "Administrador inicial criado."
        );

    } catch (error) {

        console.error(
            "Erro ao criar administrador:",
            error
        );

    }

}


/* =====================================================
   FIRESTORE - DESCARGAS
===================================================== */

async function getDescargas() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    DESCARGAS_COLLECTION
                )
            );

        const data = [];

        snapshot.forEach(
            item => {

                data.push({
                    id: item.id,
                    ...item.data()
                });

            }
        );

        return data;

    } catch (error) {

        console.error(
            "Erro ao buscar descargas:",
            error
        );

        return [];

    }

}


/* =====================================================
   FIRESTORE - GASTOS
===================================================== */

async function getGastos() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    GASTOS_COLLECTION
                )
            );

        const data = [];

        snapshot.forEach(
            item => {

                data.push({
                    id: item.id,
                    ...item.data()
                });

            }
        );

        return data;

    } catch (error) {

        console.error(
            "Erro ao buscar gastos:",
            error
        );

        return [];

    }

}


/* =====================================================
   FIRESTORE - HISTÓRICO
===================================================== */

async function getHistory() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    HISTORY_COLLECTION
                )
            );

        const history = [];

        snapshot.forEach(
            item => {

                history.push({
                    id: item.id,
                    ...item.data()
                });

            }
        );

        history.sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );

        return history;

    } catch (error) {

        console.error(
            "Erro ao buscar histórico:",
            error
        );

        return [];

    }

}


/* =====================================================
   ADICIONAR HISTÓRICO
===================================================== */

async function addHistory(
    action,
    description
) {

    try {

        await addDoc(
            collection(
                db,
                HISTORY_COLLECTION
            ),
            {

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
                    getNow()

            }
        );

    } catch (error) {

        console.error(
            "Erro ao registrar histórico:",
            error
        );

    }

}


/* =====================================================
   SESSÃO
===================================================== */

function saveSession() {

    if (!currentUser) {
        return;
    }

    localStorage.setItem(
        STORAGE_SESSION,
        String(currentUser.id)
    );

}


function clearSession() {

    localStorage.removeItem(
        STORAGE_SESSION
    );

    currentUser = null;

}


async function loadSession() {

    const sessionId =
        localStorage.getItem(
            STORAGE_SESSION
        );

    if (!sessionId) {
        return;
    }

    try {

        const userRef =
            doc(
                db,
                USERS_COLLECTION,
                String(sessionId)
            );

        const snapshot =
            await getDoc(userRef);

        if (
            snapshot.exists()
        ) {

            currentUser = {

                id: snapshot.id,

                ...snapshot.data()

            };

        } else {

            clearSession();

        }

    } catch (error) {

        console.error(
            "Erro ao carregar sessão:",
            error
        );

    }

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
        async function(event) {

            event.preventDefault();

            const username =
                document
                    .getElementById(
                        "loginUsername"
                    )
                    .value
                    .trim();

            const password =
                document
                    .getElementById(
                        "loginPassword"
                    )
                    .value;

            const message =
                document.getElementById(
                    "loginMessage"
                );

            message.textContent =
                "Verificando...";

            try {

                const users =
                    await getUsers();

                const user =
                    users.find(
                        item =>
                            String(
                                item.username || ""
                            )
                                .toLowerCase() ===
                            username.toLowerCase() &&
                            item.password ===
                            password
                    );

                if (!user) {

                    message.textContent =
                        "Usuário ou senha incorretos.";

                    return;

                }

                currentUser =
                    user;

                saveSession();

                message.textContent =
                    "";

                await showApplication();

            } catch (error) {

                console.error(error);

                message.textContent =
                    "Erro ao conectar com o banco.";

            }

        }
    );

}


/* =====================================================
   MOSTRAR APLICAÇÃO
===================================================== */

async function showApplication() {

    document
        .getElementById(
            "loginScreen"
        )
        .classList.add(
            "hidden"
        );

    document
        .getElementById(
            "app"
        )
        .classList.remove(
            "hidden"
        );

    updateUserInterface();

    await updateDashboard();

    await renderDescargas();

    await renderGastos();

    await renderCash();

    await renderHistory();

    await renderUsers();

    updateCurrentDate();

}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

    clearSession();

    document
        .getElementById(
            "app"
        )
        .classList.add(
            "hidden"
        );

    document
        .getElementById(
            "loginScreen"
        )
        .classList.remove(
            "hidden"
        );

    document
        .getElementById(
            "loginForm"
        )
        .reset();

}


/* =====================================================
   INTERFACE USUÁRIO
===================================================== */

function updateUserInterface() {

    if (!currentUser) {
        return;
    }

    const initial =
        getInitial(
            currentUser.name
        );

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


/* =====================================================
   DATA ATUAL
===================================================== */

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


async function navigate(page) {

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
        .forEach(
            item =>
                item.classList.remove(
                    "active"
                )
        );

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
        .forEach(
            item =>
                item.classList.remove(
                    "active"
                )
        );

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
        .getElementById(
            "sidebar"
        )
        .classList.remove(
            "open"
        );

    if (page === "dashboard") {
        await updateDashboard();
    }

    if (page === "descargas") {
        await renderDescargas();
    }

    if (page === "gastos") {
        await renderGastos();
    }

    if (page === "caixa") {
        await renderCash();
    }

    if (page === "historico") {
        await renderHistory();
    }

    if (page === "usuarios") {
        await renderUsers();
    }

}


/* =====================================================
   FILTRO DE DATA
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
            new Date(
                start +
                "T00:00:00"
            );

    }

    if (end) {

        endDate =
            new Date(
                end +
                "T23:59:59"
            );

    }

    return data.filter(
        item => {

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

        }
    );

}


/* =====================================================
   MODAL DESCARGA
===================================================== */

async function openDescargaModal(
    id = null
) {

    const modal =
        document.getElementById(
            "descargaModal"
        );

    document
        .getElementById(
            "descargaForm"
        )
        .reset();

    document.getElementById(
        "descargaId"
    ).value = "";

    if (id) {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    DESCARGAS_COLLECTION,
                    String(id)
                )
            );

        if (
            !snapshot.exists()
        ) {
            return;
        }

        const item = {

            id: snapshot.id,

            ...snapshot.data()

        };

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
                ? Number(
                    item.valor
                ).toLocaleString(
                    "pt-BR",
                    {
                        minimumFractionDigits:
                            2
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

    modal.classList.add(
        "show"
    );

}


/* =====================================================
   SALVAR DESCARGA
===================================================== */

async function saveDescarga(event) {

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

    try {

        if (id) {

            const ref =
                doc(
                    db,
                    DESCARGAS_COLLECTION,
                    String(id)
                );

            await updateDoc(
                ref,
                {

                    data,

                    fornecedor,

                    transportadora,

                    motorista,

                    valor,

                    observacao,

                    updatedAt:
                        getNow(),

                    updatedBy:
                        currentUser.name

                }
            );

            await addHistory(
                "Descarga editada",
                `Descarga de ${
                    fornecedor ||
                    "fornecedor não informado"
                } foi editada.`
            );

        } else {

            const newId =
                String(
                    generateId()
                );

            await setDoc(
                doc(
                    db,
                    DESCARGAS_COLLECTION,
                    newId
                ),
                {

                    id: newId,

                    data:
                        data ||
                        getNow(),

                    fornecedor,

                    transportadora,

                    motorista,

                    valor,

                    observacao,

                    createdAt:
                        getNow(),

                    createdBy:
                        currentUser.name,

                    updatedAt:
                        getNow(),

                    updatedBy:
                        currentUser.name

                }
            );

            await addHistory(
                "Descarga registrada",
                `Nova descarga ${
                    fornecedor
                        ? "do fornecedor " +
                          fornecedor
                        : "sem fornecedor informado"
                } registrada.`
            );

        }

        closeModal(
            "descargaModal"
        );

        await renderDescargas();

        await renderCash();

        await updateDashboard();

        showToast(
            id
                ? "Descarga alterada com sucesso."
                : "Descarga registrada com sucesso."
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Erro ao salvar a descarga no Firebase.",
            "error"
        );

    }

}


/* =====================================================
   RENDER DESCARGAS
===================================================== */

async function renderDescargas() {

    const tbody =
        document.getElementById(
            "descargasTable"
        );

    if (!tbody) {
        return;
    }

    let data =
        await getDescargas();

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
            data.filter(
                item => {

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

                }
            );

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
                Number(
                    item.valor || 0
                ),
            0
        );

    document.getElementById(
        "descargasCount"
    ).textContent =
        data.length;

    document.getElementById(
        "descargasFilteredTotal"
    ).textContent =
        formatCurrency(
            total
        );

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
        data.map(
            item => `

            <tr>

                <td>
                    ${formatDate(
                        item.data
                    )}
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
                            onclick="openDescargaModal('${item.id}')"
                            title="Editar">

                            <i class="fa-solid fa-pen"></i>

                        </button>

                        <button
                            class="icon-btn delete"
                            onclick="deleteDescarga('${item.id}')"
                            title="Excluir">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </div>

                </td>

            </tr>

        `
        ).join("");

}


/* =====================================================
   EXCLUIR DESCARGA
===================================================== */

async function deleteDescarga(id) {

    const snapshot =
        await getDoc(
            doc(
                db,
                DESCARGAS_COLLECTION,
                String(id)
            )
        );

    if (!snapshot.exists()) {
        return;
    }

    const item = {

        id: snapshot.id,

        ...snapshot.data()

    };

    if (
        !confirm(
            "Tem certeza que deseja excluir esta descarga?"
        )
    ) {
        return;
    }

    try {

        await deleteDoc(
            doc(
                db,
                DESCARGAS_COLLECTION,
                String(id)
            )
        );

        await addHistory(
            "Descarga excluída",
            `Descarga de ${
                item.fornecedor ||
                "fornecedor não informado"
            } foi excluída.`
        );

        await renderDescargas();

        await renderCash();

        await updateDashboard();

        showToast(
            "Descarga excluída."
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Erro ao excluir a descarga.",
            "error"
        );

    }

}


/* =====================================================
   MODAL GASTO
===================================================== */

async function openGastoModal(
    id = null
) {

    document
        .getElementById(
            "gastoForm"
        )
        .reset();

    document.getElementById(
        "gastoId"
    ).value = "";

    if (id) {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    GASTOS_COLLECTION,
                    String(id)
                )
            );

        if (
            !snapshot.exists()
        ) {
            return;
        }

        const item = {

            id: snapshot.id,

            ...snapshot.data()

        };

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
                ? Number(
                    item.valor
                ).toLocaleString(
                    "pt-BR",
                    {
                        minimumFractionDigits:
                            2
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
        .getElementById(
            "gastoModal"
        )
        .classList.add(
            "show"
        );

}


/* =====================================================
   SALVAR GASTO
===================================================== */

async function saveGasto(event) {

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

    try {

        if (id) {

            await updateDoc(
                doc(
                    db,
                    GASTOS_COLLECTION,
                    String(id)
                ),
                {

                    data,

                    fornecedor,

                    descricao,

                    valor,

                    observacao,

                    updatedAt:
                        getNow(),

                    updatedBy:
                        currentUser.name

                }
            );

            await addHistory(
                "Gasto editado",
                `O gasto ${
                    descricao ||
                    "sem descrição"
                } foi editado.`
            );

        } else {

            const newId =
                String(
                    generateId()
                );

            await setDoc(
                doc(
                    db,
                    GASTOS_COLLECTION,
                    newId
                ),
                {

                    id: newId,

                    data:
                        data ||
                        getNow(),

                    fornecedor,

                    descricao,

                    valor,

                    observacao,

                    createdAt:
                        getNow(),

                    createdBy:
                        currentUser.name,

                    updatedAt:
                        getNow(),

                    updatedBy:
                        currentUser.name

                }
            );

            await addHistory(
                "Gasto registrado",
                `Novo gasto ${
                    descricao ||
                    "sem descrição"
                } registrado.`
            );

        }

        closeModal(
            "gastoModal"
        );

        await renderGastos();

        await renderCash();

        await updateDashboard();

        showToast(
            id
                ? "Gasto alterado com sucesso."
                : "Gasto registrado com sucesso."
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Erro ao salvar o gasto no Firebase.",
            "error"
        );

    }

}


/* =====================================================
   RENDER GASTOS
===================================================== */

async function renderGastos() {

    const tbody =
        document.getElementById(
            "gastosTable"
        );

    let data =
        await getGastos();

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
            data.filter(
                item => {

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

                }
            );

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
                Number(
                    item.valor || 0
                ),
            0
        );

    document.getElementById(
        "gastosCount"
    ).textContent =
        data.length;

    document.getElementById(
        "gastosFilteredTotal"
    ).textContent =
        formatCurrency(
            total
        );

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
        data.map(
            item => `

            <tr>

                <td>
                    ${formatDate(
                        item.data
                    )}
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

                        -
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
                            onclick="openGastoModal('${item.id}')">

                            <i class="fa-solid fa-pen"></i>

                        </button>

                        <button
                            class="icon-btn delete"
                            onclick="deleteGasto('${item.id}')">

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </div>

                </td>

            </tr>

        `
        ).join("");

}


/* =====================================================
   EXCLUIR GASTO
===================================================== */

async function deleteGasto(id) {

    const snapshot =
        await getDoc(
            doc(
                db,
                GASTOS_COLLECTION,
                String(id)
            )
        );

    if (!snapshot.exists()) {
        return;
    }

    const item = {

        id: snapshot.id,

        ...snapshot.data()

    };

    if (
        !confirm(
            "Tem certeza que deseja excluir este gasto?"
        )
    ) {
        return;
    }

    try {

        await deleteDoc(
            doc(
                db,
                GASTOS_COLLECTION,
                String(id)
            )
        );

        await addHistory(
            "Gasto excluído",
            `O gasto ${
                item.descricao ||
                "sem descrição"
            } foi excluído.`
        );

        await renderGastos();

        await renderCash();

        await updateDashboard();

        showToast(
            "Gasto excluído."
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Erro ao excluir o gasto.",
            "error"
        );

    }

}


/* =====================================================
   CAIXA
===================================================== */

async function renderCash() {

    const descargas =
        await getDescargas();

    const gastos =
        await getGastos();

    const entradas =
        descargas.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.valor || 0
                ),
            0
        );

    const saidas =
        gastos.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.valor || 0
                ),
            0
        );

    const saldo =
        entradas - saidas;

    document.getElementById(
        "cashEntradas"
    ).textContent =
        formatCurrency(
            entradas
        );

    document.getElementById(
        "cashSaidas"
    ).textContent =
        formatCurrency(
            saidas
        );

    document.getElementById(
        "cashSaldo"
    ).textContent =
        formatCurrency(
            saldo
        );

    const movements = [];

    descargas.forEach(
        item => {

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
                    Number(
                        item.valor || 0
                    ),

                positive: true

            });

        }
    );

    gastos.forEach(
        item => {

            movements.push({

                data: item.data,

                tipo: "Saída",

                descricao:
                    item.descricao ||
                    "Gasto",

                responsavel:
                    item.createdBy || "-",

                valor:
                    Number(
                        item.valor || 0
                    ),

                positive: false

            });

        }
    );

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
        movements.map(
            item => `

            <tr>

                <td>
                    ${formatDate(
                        item.data
                    )}
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

        `
        ).join("");

}


/* =====================================================
   DASHBOARD
===================================================== */

let financeChart = null;


async function updateDashboard() {

    const descargas =
        await getDescargas();

    const gastos =
        await getGastos();

    const users =
        await getUsers();

    const totalDescargas =
        descargas.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.valor || 0
                ),
            0
        );

    const totalGastos =
        gastos.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.valor || 0
                ),
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

    descargas.forEach(
        item => {

            if (item.fornecedor) {

                fornecedores.add(
                    item.fornecedor.trim()
                );

            }

        }
    );

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
        users.length;


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

                        -
                        ${formatCurrency(
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
                Number(
                    item.valor || 0
                ),
            0
        );

    const saidas =
        gastos.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.valor || 0
                ),
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

                    maintainAspectRatio:
                        false,

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

async function renderUsers() {

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
        await getUsers();

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
                        onclick="editUser('${user.id}')">

                        <i class="fa-solid fa-pen"></i>

                        Editar

                    </button>

                    ${
                        String(user.id) !==
                        String(currentUser.id)
                            ? `

                            <button
                                class="icon-btn delete"
                                onclick="deleteUser('${user.id}')">

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


/* =====================================================
   MODAL USUÁRIO
===================================================== */

async function openUserModal(
    id = null
) {

    document
        .getElementById(
            "userForm"
        )
        .reset();

    document.getElementById(
        "userId"
    ).value = "";

    if (id) {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    USERS_COLLECTION,
                    String(id)
                )
            );

        if (
            !snapshot.exists()
        ) {
            return;
        }

        const user = {

            id: snapshot.id,

            ...snapshot.data()

        };

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
        .getElementById(
            "userModal"
        )
        .classList.add(
            "show"
        );

}


function editUser(id) {

    if (
        currentUser?.role !== "admin"
    ) {
        return;
    }

    openUserModal(id);

}


/* =====================================================
   SALVAR USUÁRIO
===================================================== */

async function saveUser(event) {

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

    try {

        const users =
            await getUsers();

        const usernameExists =
            users.some(
                user =>
                    String(
                        user.username || ""
                    )
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

            const updateData = {

                name,

                username,

                role

            };

            if (password) {

                updateData.password =
                    password;

            }

            await updateDoc(
                doc(
                    db,
                    USERS_COLLECTION,
                    String(id)
                ),
                updateData
            );

            if (
                String(currentUser.id) ===
                String(id)
            ) {

                currentUser = {

                    ...currentUser,

                    ...updateData

                };

                saveSession();

                updateUserInterface();

            }

            await addHistory(
                "Usuário editado",
                `O usuário ${name} foi alterado pelo administrador.`
            );

        } else {

            if (!password) {

                showToast(
                    "Informe uma senha para o novo usuário.",
                    "error"
                );

                return;

            }

            const newId =
                String(
                    generateId()
                );

            await setDoc(
                doc(
                    db,
                    USERS_COLLECTION,
                    newId
                ),
                {

                    id: newId,

                    name,

                    username,

                    password,

                    role,

                    createdAt:
                        getNow()

                }
            );

            await addHistory(
                "Usuário criado",
                `O usuário ${name} foi criado.`
            );

        }

        closeModal(
            "userModal"
        );

        await renderUsers();

        await updateDashboard();

        showToast(
            id
                ? "Usuário alterado."
                : "Usuário criado."
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Erro ao salvar usuário no Firebase.",
            "error"
        );

    }

}


/* =====================================================
   EXCLUIR USUÁRIO
===================================================== */

async function deleteUser(id) {

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

    const snapshot =
        await getDoc(
            doc(
                db,
                USERS_COLLECTION,
                String(id)
            )
        );

    if (!snapshot.exists()) {
        return;
    }

    const user = {

        id: snapshot.id,

        ...snapshot.data()

    };

    if (
        !confirm(
            `Excluir o usuário ${user.name}?`
        )
    ) {
        return;
    }

    try {

        await deleteDoc(
            doc(
                db,
                USERS_COLLECTION,
                String(id)
            )
        );

        await addHistory(
            "Usuário excluído",
            `O usuário ${user.name} foi excluído.`
        );

        await renderUsers();

        await updateDashboard();

        showToast(
            "Usuário excluído."
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Erro ao excluir usuário.",
            "error"
        );

    }

}


/* =====================================================
   ALTERAR SENHA
===================================================== */

async function changePassword(
    event
) {

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

    try {

        await updateDoc(
            doc(
                db,
                USERS_COLLECTION,
                String(
                    currentUser.id
                )
            ),
            {

                password:
                    newPassword

            }
        );

        currentUser.password =
            newPassword;

        saveSession();

        await addHistory(
            "Senha alterada",
            `A senha do usuário ${
                currentUser.name
            } foi alterada.`
        );

        document
            .getElementById(
                "changePasswordForm"
            )
            .reset();

        showToast(
            "Senha alterada com sucesso."
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Erro ao alterar senha.",
            "error"
        );

    }

}


/* =====================================================
   MODAIS
===================================================== */

function closeModal(id) {

    const modal =
        document.getElementById(
            id
        );

    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}


/* =====================================================
   HISTÓRICO
===================================================== */

async function renderHistory() {

    const container =
        document.getElementById(
            "historyList"
        );

    if (!container) {
        return;
    }

    const history =
        await getHistory();

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
        history.map(
            item => `

            <div class="history-item">

                <div class="history-icon">

                    <i class="fa-solid fa-pen-to-square"></i>

                </div>

                <div class="history-content">

                    <strong>
                        ${escapeHTML(
                            item.action
                        )}
                    </strong>

                    <p>
                        ${escapeHTML(
                            item.description
                        )}
                    </p>

                    <small>

                        ${escapeHTML(
                            item.userName
                        )}

                        •

                        ${formatDate(
                            item.date
                        )}

                    </small>

                </div>

            </div>

        `
        ).join("");

}


/* =====================================================
   EVENTOS
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        try {

            /*
             * Primeiro garante que o
             * administrador exista.
             */

            await initializeAdmin();

            /*
             * Depois recupera a sessão.
             */

            await loadSession();

            /*
             * Inicializa login.
             */

            initLogin();


            /* LOGIN AUTOMÁTICO */

            if (currentUser) {

                await showApplication();

            }


            /* MENU */

            document
                .querySelectorAll(
                    ".menu-item"
                )
                .forEach(
                    button => {

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

                    }
                );


            /* LINKS INTERNOS */

            document
                .querySelectorAll(
                    "[data-page-link]"
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            function() {

                                navigate(
                                    this.dataset.pageLink
                                );

                            }
                        );

                    }
                );


            /* SIDEBAR */

            document
                .getElementById(
                    "openSidebar"
                )
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
                .getElementById(
                    "closeSidebar"
                )
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
                .getElementById(
                    "logoutBtn"
                )
                .addEventListener(
                    "click",
                    logout
                );


            /* DESCARGA */

            document
                .getElementById(
                    "newDescargaBtn"
                )
                .addEventListener(
                    "click",
                    () =>
                        openDescargaModal()
                );


            document
                .getElementById(
                    "descargaForm"
                )
                .addEventListener(
                    "submit",
                    saveDescarga
                );


            /* GASTO */

            document
                .getElementById(
                    "newGastoBtn"
                )
                .addEventListener(
                    "click",
                    () =>
                        openGastoModal()
                );


            document
                .getElementById(
                    "gastoForm"
                )
                .addEventListener(
                    "submit",
                    saveGasto
                );


            /* USUÁRIO */

            document
                .getElementById(
                    "newUserBtn"
                )
                .addEventListener(
                    "click",
                    () =>
                        openUserModal()
                );


            document
                .getElementById(
                    "userForm"
                )
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
                .querySelectorAll(
                    "[data-close]"
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            function() {

                                closeModal(
                                    this.dataset.close
                                );

                            }
                        );

                    }
                );


            /* =================================================
               FILTROS DESCARGAS
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
               FILTROS GASTOS
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
               MÁSCARA DINHEIRO
            ================================================= */

            document
                .querySelectorAll(
                    "#descargaValor, #gastoValor"
                )
                .forEach(
                    input => {

                        input.addEventListener(
                            "input",
                            function() {

                                let value =
                                    this.value
                                        .replace(
                                            /\D/g,
                                            ""
                                        );

                                if (!value) {

                                    this.value =
                                        "";

                                    return;

                                }

                                value =
                                    (
                                        Number(
                                            value
                                        ) / 100
                                    ).toLocaleString(
                                        "pt-BR",
                                        {
                                            minimumFractionDigits:
                                                2
                                        }
                                    );

                                this.value =
                                    value;

                            }
                        );

                    }
                );


            console.log(
                "DISLAM conectado ao Firebase."
            );

        } catch (error) {

            console.error(
                "Erro ao iniciar sistema:",
                error
            );

            showToast(
                "Erro ao iniciar o sistema.",
                "error"
            );

        }

    }
);
window.testFirebase = {
    db,
    getDescargas,
    getGastos
};