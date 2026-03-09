// login.js
const btnLogin = document.getElementById("btnLogin");
const msg = document.getElementById("msg");
const inputUsuario = document.getElementById("usuario");
const inputPassword = document.getElementById("password");

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

async function intentarLogin() {
    if (btnLogin.disabled) {
        return;
    }

    const usuario = inputUsuario.value.trim();
    const password = inputPassword.value.trim();

    msg.textContent = "";

    if (!usuario || !password) {
        msg.textContent = "Ingrese usuario y contraseña";
        return;
    }

    btnLogin.disabled = true;

    try {

        // obtener token CSRF
        await fetch("/api/csrf-token", {
            method: "GET",
            credentials: "include"
        });

        const csrfToken = getCookie("csrf_token");

        const res = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken || ""
            },
            body: JSON.stringify({ usuario, password }),
            credentials: "include"
        });

        let data = null;

        try {
            data = await res.json();
        } catch {
            data = null;
        }

        if (res.ok) {
            window.location.replace("/inicio_oficina");
            return;
        }

        if (res.status === 401) {
            msg.textContent = "Credenciales inválidas";
            return;
        }

        if (res.status === 400) {
            msg.textContent = "Solicitud inválida";
            return;
        }

        if (res.status === 403) {
            msg.textContent = "Solicitud bloqueada por seguridad";
            return;
        }

        if (res.status === 429) {
            msg.textContent = "Demasiados intentos. Intente nuevamente más tarde";
            return;
        }

        msg.textContent = data?.error || "No se pudo iniciar sesión";

    } catch (error) {
        console.error("Error en login:", error);
        msg.textContent = "Error de conexión";
    } finally {
        btnLogin.disabled = false;
    }
}

btnLogin.addEventListener("click", intentarLogin);

inputPassword.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        intentarLogin();
    }
});

inputUsuario.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        intentarLogin();
    }
});
