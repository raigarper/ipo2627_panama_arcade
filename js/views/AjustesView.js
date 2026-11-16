/**
 * @file AjustesView.js
 * @capa Vista
 * @resumen Diálogo de ajustes: deslizador continuo de dificultad, tarjetas de esquema de teclas e interruptores de tema, contraste y sonido.
 * @depende Dialogo
 * @usadoPor app.js, AppController
 *
 * Esta vista NO valida ni aplica ajustes: lee el control accionado y avisa al
 * controlador. Después el controlador llama a `actualizar()` para reflejar el
 * valor realmente activo, de modo que la interfaz nunca muestra algo
 * desincronizado del modelo.
 *
 * Cada control lleva `data-control` (qué ajuste es) y la vista los trata de
 * forma genérica según su tipo, sin conocer el significado de ningún ajuste:
 *  - Deslizador (`input[type=range]`): envía su valor numérico mientras se arrastra.
 *  - Opción (`input[type=radio]`): envía su `value` al ser elegida (esquemas de teclas).
 *  - Interruptor (`input[type=checkbox][role=switch]`): envía `data-valor-activo` o
 *    `data-valor-inactivo` según esté encendido o apagado.
 */

import { Dialogo } from "./Dialogo.js";

export class AjustesView {
    /** @type {Dialogo} */
    #dialogo;
    /** @type {HTMLInputElement[]} Todos los controles de ajuste del diálogo. */
    #controles;
    #avisoDificultad;

    /**
     * Localiza los controles por `data-*` y enlaza sus eventos.
     * @param {HTMLDialogElement} elemento - Diálogo `[data-ajustes]`.
     * @param {{
     *   alCambiarDificultad: (valor:number) => void,
     *   alCambiarControles: (valor:string) => void,
     *   alCambiarTema: (valor:string) => void,
     *   alCambiarAltoContraste: (activo:boolean) => void,
     *   alCambiarSonido: (activo:boolean) => void,
     * }} callbacks - Avisos al controlador.
     */
    constructor(elemento, callbacks) {
        this.#dialogo = new Dialogo(elemento);
        this.#avisoDificultad = elemento.querySelector("[data-aviso-dificultad]");
        this.#controles = Array.from(elemento.querySelectorAll("[data-control]"));

        const acciones = {
            dificultad: (valor) => callbacks.alCambiarDificultad(valor),
            controles: (valor) => callbacks.alCambiarControles(valor),
            tema: (valor) => callbacks.alCambiarTema(valor),
            "alto-contraste": (valor) => callbacks.alCambiarAltoContraste(valor === "true"),
            sonido: (valor) => callbacks.alCambiarSonido(valor === "true"),
        };

        this.#controles.forEach((control) => {
            const accion = acciones[control.dataset.control];
            if (control.type === "range") {
                control.addEventListener("input", () => accion(control.valueAsNumber));
            } else if (control.type === "radio") {
                control.addEventListener("change", () => {
                    if (control.checked) {
                        accion(control.value);
                    }
                });
            } else {
                control.addEventListener("change", () => {
                    accion(control.checked ? control.dataset.valorActivo : control.dataset.valorInactivo);
                });
            }
        });
    }

    /**
     * Refleja la configuración en los controles: posición y color del
     * deslizador, esquema de teclas elegido y estado de los interruptores.
     * @param {import("../models/Configuracion.js").Configuracion} configuracion - Ajustes actuales.
     * @returns {void}
     */
    actualizar(configuracion) {
        const actuales = {
            controles: configuracion.controles,
            tema: configuracion.tema,
            "alto-contraste": String(configuracion.altoContraste),
            sonido: String(configuracion.sonido),
        };
        this.#controles.forEach((control) => {
            if (control.type === "range") {
                this.#reflejarDeslizador(control, configuracion);
            } else if (control.type === "radio") {
                control.checked = control.value === actuales[control.dataset.control];
            } else {
                control.checked = control.dataset.valorActivo === actuales[control.dataset.control];
            }
        });
    }

    /**
     * Muestra u oculta el aviso "la dificultad se aplicará en la próxima partida".
     * @param {boolean} visible - `true` para mostrarlo.
     * @returns {void}
     */
    mostrarAvisoDificultad(visible) {
        this.#avisoDificultad.classList.toggle("modal__aviso--oculta", !visible);
    }

    /**
     * Abre el diálogo de ajustes como modal.
     * @returns {void}
     */
    abrir() {
        this.#dialogo.abrir();
    }

    /**
     * Coloca el deslizador, colorea el pulgar según el tramo de dificultad
     * (clase `deslizador--<nivel>`), resalta la etiqueta del tramo, escribe el
     * resumen de lo que implica ("3 vidas · velocidad ×1,0") y actualiza
     * `aria-valuetext` para que un lector de pantalla diga "Normal: 3 vidas…" en
     * vez de "50".
     * @param {HTMLInputElement} control - Deslizador de dificultad.
     * @param {import("../models/Configuracion.js").Configuracion} configuracion - Ajustes actuales.
     * @returns {void}
     */
    #reflejarDeslizador(control, configuracion) {
        control.value = String(configuracion.dificultad);
        const contenedor = control.closest("[data-deslizador]");
        const { vidas, factorVelocidad } = configuracion.parametros;
        const velocidad = factorVelocidad.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        const resumen = `${vidas} ${vidas === 1 ? "vida" : "vidas"} · velocidad ×${velocidad}`;
        contenedor.querySelector("[data-dificultad-resumen]").textContent = resumen;

        contenedor.querySelectorAll("[data-marca]").forEach((marca) => {
            const activa = marca.dataset.marca === configuracion.nivel;
            marca.classList.toggle("deslizador__marca--activa", activa);
            contenedor.classList.toggle(`deslizador--${marca.dataset.marca}`, activa);
            if (activa) {
                control.setAttribute("aria-valuetext", `${marca.textContent}: ${resumen}`);
            }
        });
    }
}
