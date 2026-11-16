/**
 * @file EntradaView.js
 * @capa Vista
 * @resumen Traduce teclado, botones táctiles y pérdida de foco en acciones del juego para el controlador.
 * @depende Nada.
 * @usadoPor app.js, AppController
 *
 * Acciones que emite: "izquierda", "derecha", "disparo" (pulsadas/soltadas).
 * Además: alternar pausa (P / Escape), confirmar (Enter) y pérdida de foco.
 *
 * Decisiones de usabilidad:
 *  - Se usa `event.code` (tecla física), no `event.key`, para que WASD funcione
 *    igual en cualquier distribución de teclado.
 *  - Las teclas de juego solo actúan si el foco está en el canvas o en el
 *    `body`. Así la barra espaciadora sigue activando los botones de la
 *    interfaz cuando el foco está en uno de ellos (accesibilidad por teclado).
 *  - Con un diálogo abierto no se captura ninguna tecla de juego.
 */

/** Teclas físicas de cada esquema de control. El disparo es siempre Espacio. */
const ESQUEMAS = Object.freeze({
    flechas: Object.freeze({ ArrowLeft: "izquierda", ArrowRight: "derecha", Space: "disparo" }),
    wasd: Object.freeze({ KeyA: "izquierda", KeyD: "derecha", Space: "disparo" }),
});

export class EntradaView {
    /** @type {Readonly<Record<string,string>>} Mapa tecla física → acción del esquema activo. */
    #mapa = ESQUEMAS.flechas;
    /** @type {HTMLElement} */
    #lienzo;
    /** @type {{alAccion:(a:string,activa:boolean)=>void, alAlternarPausa:()=>void, alConfirmar:()=>void, alPerderFoco:()=>void}} */
    #callbacks;

    /**
     * Enlaza teclado, botones táctiles y eventos de pérdida de foco.
     * @param {HTMLElement} lienzo - Canvas `[data-lienzo]` (para saber si tiene el foco).
     * @param {HTMLElement} mandos - Contenedor `[data-mandos]` con los botones táctiles `[data-tactil]`.
     * @param {{
     *   alAccion: (accion:string, activa:boolean) => void,
     *   alAlternarPausa: () => void,
     *   alConfirmar: () => void,
     *   alPerderFoco: () => void,
     * }} callbacks - Avisos al controlador.
     */
    constructor(lienzo, mandos, callbacks) {
        this.#lienzo = lienzo;
        this.#callbacks = callbacks;

        document.addEventListener("keydown", (evento) => this.#alPulsarTecla(evento));
        document.addEventListener("keyup", (evento) => this.#alSoltarTecla(evento));
        window.addEventListener("blur", () => callbacks.alPerderFoco());
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                callbacks.alPerderFoco();
            }
        });

        mandos.querySelectorAll("[data-tactil]").forEach((boton) => this.#enlazarMando(boton));
    }

    /**
     * Cambia el esquema de teclas activo.
     * @param {string} esquema - "flechas" o "wasd".
     * @returns {void}
     */
    establecerEsquema(esquema) {
        this.#mapa = ESQUEMAS[esquema] ?? ESQUEMAS.flechas;
    }

    /**
     * Gestiona la pulsación de una tecla.
     * @param {KeyboardEvent} evento - Evento de teclado.
     * @returns {void}
     */
    #alPulsarTecla(evento) {
        if (!this.#debeCapturar(evento)) {
            return;
        }
        const accion = this.#mapa[evento.code];
        if (accion) {
            // Evita que Espacio haga scroll o active un botón con foco.
            evento.preventDefault();
            this.#callbacks.alAccion(accion, true);
        } else if (!evento.repeat && (evento.code === "KeyP" || evento.code === "Escape")) {
            this.#callbacks.alAlternarPausa();
        } else if (!evento.repeat && evento.code === "Enter") {
            this.#callbacks.alConfirmar();
        }
    }

    /**
     * Gestiona la liberación de una tecla.
     * @param {KeyboardEvent} evento - Evento de teclado.
     * @returns {void}
     */
    #alSoltarTecla(evento) {
        const accion = this.#mapa[evento.code];
        if (!accion) {
            return;
        }
        // Soltar siempre se notifica: si no, la nave seguiría moviéndose con la tecla ya suelta.
        if (this.#debeCapturar(evento)) {
            evento.preventDefault();
        }
        this.#callbacks.alAccion(accion, false);
    }

    /**
     * Decide si una tecla pertenece al juego: sin diálogo abierto y con el foco
     * en el canvas o en el `body`.
     * @param {KeyboardEvent} evento - Evento de teclado.
     * @returns {boolean}
     */
    #debeCapturar(evento) {
        if (document.querySelector("dialog[open]")) {
            return false;
        }
        return evento.target === this.#lienzo || evento.target === document.body;
    }

    /**
     * Convierte un botón táctil en una acción mantenida: pulsar = activa, soltar = inactiva.
     * @param {HTMLElement} boton - Botón `[data-tactil]`.
     * @returns {void}
     */
    #enlazarMando(boton) {
        const accion = boton.dataset.tactil;
        const soltar = () => this.#callbacks.alAccion(accion, false);
        boton.addEventListener("pointerdown", (evento) => {
            evento.preventDefault();
            boton.setPointerCapture(evento.pointerId);
            this.#callbacks.alAccion(accion, true);
        });
        boton.addEventListener("pointerup", soltar);
        boton.addEventListener("pointercancel", soltar);
        boton.addEventListener("contextmenu", (evento) => evento.preventDefault());
    }
}
