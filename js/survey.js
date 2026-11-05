(function () {
    "use strict";

    /* ============================================================
       DÓNDE SE GUARDAN LAS RESPUESTAS
       Pega aquí la URL de la aplicación web de Google Apps Script
       (termina en /exec). Pasos en README.md.
       Si se deja vacío, el cuestionario funciona igual pero las
       respuestas no se envían a ningún sitio.
    ============================================================ */
    var ENDPOINT = "https://script.google.com/macros/s/AKfycbzkvEHq9Htb0d1igYuVkayjRzHxdz8xZZZPuqu4XiFO5_4ChuIXKSVzr7o2RzGDjVCvDg/exec";

    function set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
    function get(k)    { try { return sessionStorage.getItem(k) || ""; } catch (e) { return ""; } }
    function del(k)    { try { sessionStorage.removeItem(k); } catch (e) {} }

    /* Identificador de la sesión formativa, desde el QR:
       https://tu-web.vercel.app/?sesion=Madrid-2026-11-12 */
    try {
        var s = new URLSearchParams(window.location.search).get("sesion");
        if (s) set("sesion", s.slice(0, 120));
    } catch (e) {}

    var body = document.body;

    /* En la portada se borran respuestas anteriores (nueva persona / reinicio) */
    if (body.classList.contains("landing")) {
        for (var i = 1; i <= 6; i++) del("respuesta-" + i);
        return;
    }

    var page = body.dataset.question;
    var options = document.querySelectorAll(".quiz__option, .quiz__scale-btn");
    var nextBtn = document.querySelector(".quiz__next");
    var textField = document.getElementById("ciudad") || document.getElementById("comentario");
    if (!page || !nextBtn) return;

    function activate() {
        nextBtn.classList.add("is-active");
        nextBtn.removeAttribute("aria-disabled");
    }

    function select(btn) {
        options.forEach(function (o) {
            o.classList.remove("is-selected");
            o.setAttribute("aria-selected", "false");
        });
        btn.classList.add("is-selected");
        btn.setAttribute("aria-selected", "true");
        set("respuesta-" + page, btn.dataset.value);

        activate();
    }

    options.forEach(function (btn) {
        btn.addEventListener("click", function () {
            select(btn);
        });
    });

    function autosize(el) {
        if (el.tagName !== "TEXTAREA") return;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    }

    if (textField) {
        var required = textField.id === "ciudad";   /* la ciudad es obligatoria; el tema, opcional */

        function check() {
            var v = textField.value.trim();
            set("respuesta-" + page, v);
            if (!required || v.length >= 2) {
                activate();
            } else {
                nextBtn.classList.remove("is-active");
                nextBtn.setAttribute("aria-disabled", "true");
            }
        }

        textField.value = get("respuesta-" + page);
        autosize(textField);
        textField.addEventListener("input", function () { autosize(textField); });
        textField.addEventListener("input", check);
        if (required) {
            textField.addEventListener("keydown", function (e) {
                if (e.key === "Enter" && nextBtn.classList.contains("is-active")) {
                    e.preventDefault();
                    nextBtn.click();
                }
            });
            check();
        }
    }

    /* Si la persona vuelve atrás, se recupera lo ya marcado */
    var saved = get("respuesta-" + page);
    if (saved && options.length) {
        options.forEach(function (o) {
            if (o.dataset.value === saved) select(o);
        });
    }

    /* ---------- Siguiente / Enviar ---------- */
    var sending = false;

    nextBtn.addEventListener("click", function (e) {
        if (!nextBtn.classList.contains("is-active")) {
            e.preventDefault();
            return;
        }
        if (nextBtn.dataset.submit === "true") {
            e.preventDefault();
            submit();
        }
    });

    function submit() {
        if (sending) return;
        sending = true;
        nextBtn.style.opacity = "0.35";

        var target = nextBtn.getAttribute("href");
        var finished = false;
        function go() {
            if (finished) return;
            finished = true;
            window.location.href = target;
        }

        if (!ENDPOINT) { go(); return; }

        var payload = {
            sesion: get("sesion"),
            fecha: new Date().toISOString(),
            ciudad: get("respuesta-1"),
            valoracion_global: get("respuesta-2"),
            utilidad: get("respuesta-3"),
            claridad: get("respuesta-4"),
            producto: get("respuesta-5"),
            tema_proxima: get("respuesta-6")
        };

        try {
            fetch(ENDPOINT, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload),
                keepalive: true
            }).then(go, go);
        } catch (err) {
            go();
        }
        setTimeout(go, 4000);
    }
})();
