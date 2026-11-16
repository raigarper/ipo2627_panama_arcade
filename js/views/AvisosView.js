/**
 * @file AvisosView.js
 * @capa Vista
 * @resumen Cortina de mensajes sobre el canvas (listo / pausa) y región `aria-live` para lectores de pantalla.
 * @depende JuegoModel (solo la constante ESTADOS)
 * @usadoPor app.js, AppController
 *
 * Por qué HTML y no texto dibujado en el canvas: un canvas es opaco para los
 * lectores de pantalla. El mensaje en HTML es seleccionable, accesible y se
 * posiciona con `position: absolute` sobre el lienzo sin desplazarlo
 * (posicionamiento justificado: debe FLOTAR sobre el juego).
 */

import { ESTADOS } from "../models/JuegoModel.js";

/** Textos de la cortina por estado; los estados sin entrada ocultan la cortina. */
const MENSAJES = Object.freeze({
    [ESTADOS.INICIAL]: { titulo: "Listo para jugar", texto: "Pulsa Comenzar (o Enter) para empezar la partida." },
    [ESTADOS.PAUSA]: { titulo: "Pausa", texto: "Pulsa Reanudar (o P) para continuar." },
});

export class AvisosView {
    #cortina;
    #titulo;
    #texto;
    #anuncios;

    /**
     * @param {HTMLElement} cortina - Capa `[data-cortina]` sobre el canvas.
     * @param {HTMLElement} anuncios - Región `[data-anuncios]` con `aria-live="polite"`.
     */
    constructor(cortina, anuncios) {
        this.#cortina = cortina;
        this.#titulo = cortina.querySelector("[data-cortina-titulo]");
        this.#texto = cortina.querySelector("[data-cortina-texto]");
        this.#anuncios = anuncios;
    }

    /**
     * Muestra u oculta la cortina según el estado de la partida.
     * @param {string} estado - Uno de ESTADOS.
     * @returns {void}
     */
    mostrarEstado(estado) {
        const mensaje = MENSAJES[estado];
        this.#cortina.classList.toggle("escenario__cortina--oculta", mensaje === undefined);
        if (mensaje) {
            this.#titulo.textContent = mensaje.titulo;
            this.#texto.textContent = mensaje.texto;
        }
    }

    /**
     * Anuncia un mensaje a los lectores de pantalla (sin mostrarlo en pantalla).
     * Se usa solo para eventos relevantes (oleada, impacto, fin), no para cada punto.
     * @param {string} mensaje - Texto a anunciar.
     * @returns {void}
     */
    anunciar(mensaje) {
        this.#anuncios.textContent = mensaje;
    }
}
