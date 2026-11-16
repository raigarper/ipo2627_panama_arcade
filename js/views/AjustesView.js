/**
 * @file AjustesView.js
 * @capa Vista
 * @resumen Diálogo de ajustes: dificultad, controles, paleta, alto contraste y sonido.
 * @depende Dialogo, formaEnemigo
 * @usadoPor app.js, AppController
 *
 * Esta vista NO valida ni aplica ajustes: lee el control pulsado
 * (`data-control` + `data-valor`) y avisa al controlador. Después el
 * controlador llama a `actualizar()` para marcar el valor realmente activo,
 * de modo que la interfaz nunca muestra algo desincronizado del modelo.
 */

import { Dialogo } from "./Dialogo.js";
import { crearFormaSvg } from "./formaEnemigo.js";

export class AjustesView {
    /** @type {Dialogo} */
    #dialogo;
    /** @type {Record<string, HTMLElement[]>} Botones agrupados por `data-control`. */
    #controles = {};
    #avisoDificultad;

    /**
     * Localiza los controles por `data-*`, enlaza sus clics y pinta las muestras de paleta.
     * @param {HTMLDialogElement} elemento - Diálogo `[data-ajustes]`.
     * @param {{
     *   alCambiarDificultad: (valor:string) => void,
     *   alCambiarControles: (valor:string) => void,
     *   alCambiarPaleta: (valor:string) => void,
     *   alCambiarAltoContraste: (activo:boolean) => void,
     *   alCambiarSonido: (activo:boolean) => void,
     * }} callbacks - Avisos al controlador.
     */
    constructor(elemento, callbacks) {
        this.#dialogo = new Dialogo(elemento);
        this.#avisoDificultad = elemento.querySelector("[data-aviso-dificultad]");

        const acciones = {
            dificultad: (valor) => callbacks.alCambiarDificultad(valor),
            controles: (valor) => callbacks.alCambiarControles(valor),
            paleta: (valor) => callbacks.alCambiarPaleta(valor),
            "alto-contraste": (valor) => callbacks.alCambiarAltoContraste(valor === "true"),
            sonido: (valor) => callbacks.alCambiarSonido(valor === "true"),
        };

        Object.entries(acciones).forEach(([nombre, accion]) => {
            const botones = Array.from(elemento.querySelectorAll(`[data-control='${nombre}']`));
            this.#controles[nombre] = botones;
            botones.forEach((boton) => {
                boton.addEventListener("click", () => accion(boton.dataset.valor));
            });
        });

        elemento.querySelectorAll("[data-muestra-forma]").forEach((hueco) => {
            hueco.appendChild(crearFormaSvg(Number(hueco.dataset.muestraForma)));
        });
    }

    /**
     * Marca como activo el botón de cada grupo que coincide con la configuración.
     * @param {import("../models/Configuracion.js").Configuracion} configuracion - Ajustes actuales.
     * @returns {void}
     */
    actualizar(configuracion) {
        this.#marcarActivo("dificultad", configuracion.dificultad);
        this.#marcarActivo("controles", configuracion.controles);
        this.#marcarActivo("paleta", configuracion.paleta);
        this.#marcarActivo("alto-contraste", String(configuracion.altoContraste));
        this.#marcarActivo("sonido", String(configuracion.sonido));
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
     * Marca activo el botón cuyo `data-valor` coincide, y actualiza `aria-pressed`
     * para que un lector de pantalla anuncie cuál está seleccionado.
     * @param {string} control - Nombre del grupo (`data-control`).
     * @param {string} valorActivo - Valor que debe quedar marcado.
     * @returns {void}
     */
    #marcarActivo(control, valorActivo) {
        this.#controles[control].forEach((boton) => {
            const activo = boton.dataset.valor === valorActivo;
            boton.classList.toggle("opcion--activa", activo);
            boton.setAttribute("aria-pressed", String(activo));
        });
    }
}
