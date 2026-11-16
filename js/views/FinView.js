/**
 * @file FinView.js
 * @capa Vista
 * @resumen Diálogo de resultados al terminar la partida (puntos, oleada alcanzada y motivo).
 * @depende Dialogo
 * @usadoPor app.js, AppController
 */

import { Dialogo } from "./Dialogo.js";

/** Texto del motivo de fin de partida, según lo que emite el modelo. */
const MOTIVOS = Object.freeze({
    vidas: "Te has quedado sin vidas.",
    invasion: "Los invasores han llegado hasta tu nave.",
    abandono: "Has finalizado la partida.",
});

export class FinView {
    /** @type {Dialogo} */
    #dialogo;
    #motivo;
    #puntos;
    #oleada;

    /**
     * @param {HTMLDialogElement} elemento - Diálogo `[data-fin]`.
     * @param {{ alJugarDeNuevo: () => void }} callbacks - Aviso al controlador.
     */
    constructor(elemento, callbacks) {
        this.#dialogo = new Dialogo(elemento);
        this.#motivo = elemento.querySelector("[data-fin-motivo]");
        this.#puntos = elemento.querySelector("[data-fin-puntos]");
        this.#oleada = elemento.querySelector("[data-fin-oleada]");
        elemento
            .querySelector("[data-accion='jugar-de-nuevo']")
            .addEventListener("click", () => callbacks.alJugarDeNuevo());
    }

    /**
     * Muestra el resultado de la partida.
     * @param {{puntos:number, oleada:number, motivo:string}} resultado - Datos del evento "fin" del modelo.
     * @returns {void}
     */
    abrir({ puntos, oleada, motivo }) {
        this.#motivo.textContent = MOTIVOS[motivo] ?? MOTIVOS.abandono;
        this.#puntos.textContent = String(puntos);
        this.#oleada.textContent = String(oleada);
        this.#dialogo.abrir();
    }

    /**
     * Cierra el diálogo de resultados.
     * @returns {void}
     */
    cerrar() {
        this.#dialogo.cerrar();
    }
}
