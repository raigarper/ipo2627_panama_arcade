/**
 * @file AyudaView.js
 * @capa Vista
 * @resumen Diálogo de ayuda con las reglas del juego, los controles y la leyenda de enemigos.
 * @depende Dialogo, formaEnemigo
 * @usadoPor app.js, AppController
 */

import { Dialogo } from "./Dialogo.js";
import { crearFormaSvg } from "./formaEnemigo.js";

export class AyudaView {
    /** @type {Dialogo} */
    #dialogo;

    /**
     * Rellena la leyenda con las formas reales de los enemigos.
     * @param {HTMLDialogElement} elemento - Diálogo `[data-ayuda]`.
     */
    constructor(elemento) {
        this.#dialogo = new Dialogo(elemento);
        elemento.querySelectorAll("[data-leyenda-forma]").forEach((hueco) => {
            hueco.appendChild(crearFormaSvg(Number(hueco.dataset.leyendaForma)));
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
