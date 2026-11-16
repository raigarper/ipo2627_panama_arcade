/**
 * @file AyudaView.js
 * @capa Vista
 * @resumen Diálogo de ayuda con las reglas del juego, los controles y la leyenda de enemigos con sus sprites reales.
 * @depende Dialogo, spriteSvg
 * @usadoPor app.js, AppController
 */

import { Dialogo } from "./Dialogo.js";
import { crearSpriteSvg } from "./spriteSvg.js";

export class AyudaView {
    /** @type {Dialogo} */
    #dialogo;

    /**
     * Rellena la leyenda con los sprites reales del juego (`data-leyenda-sprite`).
     * @param {HTMLDialogElement} elemento - Diálogo `[data-ayuda]`.
     */
    constructor(elemento) {
        this.#dialogo = new Dialogo(elemento);
        elemento.querySelectorAll("[data-leyenda-sprite]").forEach((hueco) => {
            hueco.appendChild(crearSpriteSvg(hueco.dataset.leyendaSprite));
        });
    }

    /**
     * Abre la ayuda como diálogo modal.
     * @returns {void}
     */
    abrir() {
        this.#dialogo.abrir();
    }
}
