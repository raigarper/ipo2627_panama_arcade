/**
 * @file AjustesView.js
 * @capa Vista
 * @resumen Diálogo de ajustes: deslizador de dificultad e interruptores de controles, tema, alto contraste y sonido.
 * @depende Dialogo
 * @usadoPor app.js, AppController
 *
 * Esta vista NO valida ni aplica ajustes: lee el control accionado y avisa al
 * controlador con un valor de texto. Después el controlador llama a
 * `actualizar()` para reflejar el valor realmente activo, de modo que la
 * interfaz nunca muestra algo desincronizado del modelo.
 *
 * Cada control lleva `data-control` (qué ajuste es):
 *  - Deslizador (`input[type=range]`): `data-valores="a b c"` lista, en orden, los
 *    valores que representa cada posición.
 *  - Interruptor (`input[type=checkbox][role=switch]`): `data-valor-activo` y
 *    `data-valor-inactivo` son los valores que representan encendido y apagado.
 * Así la vista es genérica y no conoce el significado de ningún ajuste.
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
     *   alCambiarDificultad: (valor:string) => void,
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
                control.addEventListener("input", () => accion(this.#valoresDe(control)[Number(control.value)]));
            } else {
                control.addEventListener("change", () => {
                    accion(control.checked ? control.dataset.valorActivo : control.dataset.valorInactivo);
                });
            }
        });
    }

    /**
     * Refleja la configuración en los controles: posición del deslizador,
     * estado de los interruptores y marca activa de la dificultad.
     * @param {import("../models/Configuracion.js").Configuracion} configuracion - Ajustes actuales.
     * @returns {void}
     */
    actualizar(configuracion) {
        const actuales = {
            dificultad: configuracion.dificultad,
            controles: configuracion.controles,
            tema: configuracion.tema,
            "alto-contraste": String(configuracion.altoContraste),
            sonido: String(configuracion.sonido),
        };
        this.#controles.forEach((control) => {
            const valor = actuales[control.dataset.control];
            if (control.type === "range") {
                this.#reflejarDeslizador(control, valor);
            } else {
                control.checked = control.dataset.valorActivo === valor;
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
     * Lee la lista de valores que representa cada posición de un deslizador.
     * @param {HTMLInputElement} control - Deslizador con `data-valores`.
     * @returns {string[]} Valores en orden.
     */
    #valoresDe(control) {
        return control.dataset.valores.split(" ");
    }

    /**
     * Coloca el deslizador en la posición de un valor, resalta su marca y
     * actualiza `aria-valuetext` para que un lector de pantalla diga "Normal"
     * en vez de "1".
     * @param {HTMLInputElement} control - Deslizador.
     * @param {string} valor - Valor activo.
     * @returns {void}
     */
    #reflejarDeslizador(control, valor) {
        control.value = String(this.#valoresDe(control).indexOf(valor));
        const marcas = Array.from(control.closest("[data-deslizador]").querySelectorAll("[data-marca]"));
        marcas.forEach((marca) => {
            const activa = marca.dataset.marca === valor;
            marca.classList.toggle("deslizador__marca--activa", activa);
            if (activa) {
                control.setAttribute("aria-valuetext", marca.textContent);
            }
        });
    }
}
