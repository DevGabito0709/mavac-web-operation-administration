// cobranzas.js
const btnVolver = document.getElementById("btnVolver");
const btnProcesar = document.getElementById("btnProcesar");
const logBox = document.getElementById("logBox");

const chkPacifico = document.getElementById("chkPacifico");
const chkRimac = document.getElementById("chkRimac");
const chkPositiva = document.getElementById("chkPositiva");
const chkMapfre = document.getElementById("chkMapfre");

function getCookie(name) {
    const cookies = document.cookie.split(";");

    for (const cookie of cookies) {
        const [key, ...rest] = cookie.trim().split("=");

        if (key === name) {
            return decodeURIComponent(rest.join("="));
        }
    }

    return null;
}

btnVolver.addEventListener("click", () => {
    window.location.href = "/inicio_oficina";
});

btnProcesar.addEventListener("click", async () => {
    logBox.textContent = "Procesando...";
    btnProcesar.disabled = true;

    const entidades = [];

    if (chkPacifico.checked) entidades.push("PACIFICO");
    if (chkRimac.checked) entidades.push("RIMAC");
    if (chkPositiva.checked) entidades.push("POSITIVA");
    if (chkMapfre.checked) entidades.push("MAPFRE");

    if (entidades.length === 0) {
        logBox.textContent = "Debe seleccionar al menos una entidad.";
        btnProcesar.disabled = false;
        return;
    }

    try {
        const csrfToken = getCookie("csrf_token");

        const res = await fetch("/api/cobranzas/procesar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken || ""
            },
            credentials: "include",
            body: JSON.stringify({
                entidades
            })
        });

        const data = await res.json();

        if (res.ok) {
            logBox.textContent = "Proceso iniciado para: " + entidades.join(", ");
        } else {

            if (res.status === 409 && Array.isArray(data.entidades_en_proceso)) {
                logBox.textContent =
                    "La entidad " +
                    data.entidades_en_proceso.join(", ") +
                    " ya se está procesando. Espere a que termine antes de volver a ejecutarla.";
                return;
            }

            logBox.textContent = "Error: " + (data.error || "error desconocido");
        }
    } catch (error) {
        console.error(error);
        logBox.textContent = "Error de conexión con backend";
    } finally {
        btnProcesar.disabled = false;
    }
});

async function actualizarEstadoAutomatizaciones() {
    try {

        const res = await fetch("/api/cobranzas/estado", {
            credentials: "include"
        });

        if (!res.ok) return;

        const data = await res.json();

        if (data.total_en_proceso > 0 && !btnProcesar.disabled) {

            logBox.textContent =
                "Automatizaciones en ejecución: " +
                data.entidades.join(", ");

        }

    } catch (error) {
        console.error("Error consultando estado:", error);
    }
}

setInterval(actualizarEstadoAutomatizaciones, 120000);
