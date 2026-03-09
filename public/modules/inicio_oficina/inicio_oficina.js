// inicio_oficina.js
const btnCobranzas = document.getElementById("btnCobranzas");
const btnAdministracion = document.getElementById("btnAdministracion");
const btnCerrarSesion = document.getElementById("btnCerrarSesion");

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

if (btnCobranzas) {
    btnCobranzas.addEventListener("click", () => {
        window.location.href = "/cobranzas";
    });
}

if (btnAdministracion) {
    btnAdministracion.addEventListener("click", () => {
        window.location.href = "/administracion";
    });
}

if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", async () => {
        try {
            const csrfToken = getCookie("csrf_token");

            await fetch("/api/logout", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken || ""
                },
                credentials: "include"
            });
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }

        window.location.replace("/login");
    });
}