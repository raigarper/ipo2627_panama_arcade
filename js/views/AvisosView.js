/**
 * @file AvisosView.js
 * @capa Vista
 * @resumen Pantalla de inicio y de pausa sobre el canvas (con botón de acción) y región `aria-live` para lectores de pantalla.
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
    [ESTADOS.INICIAL]: { titulo: "¡Defiende la Tierra!", texto: "Destruye a los invasores antes de que lleguen hasta ti.", boton: "Comenzar" },
    [ESTADOS.PAUSA]: { titulo: "Pausa", texto: "La partida está detenida.", boton: "Reanudar" },
});

export class AvisosView {
    #cortina;
    #titulo;
    #texto;
    #boton;
    #anuncios;

    /**
     * @param {HTMLElement} cortina - Capa `[data-cortina]` sobre el canvas.
     * @param {HTMLElement} anuncios - Región `[data-anuncios]` con `aria-live="polite"`.
     * @param {{alConfirmar: () => void}} callbacks - Aviso al controlador al pulsar el botón de la cortina.
     */
    constructor(cortina, anuncios, callbacks) {
        this.#cortina = cortina;
        this.#titulo = cortina.querySelector("[data-cortina-titulo]");
        this.#texto = cortina.querySelector("[data-cortina-texto]");
        this.#boton = cortina.querySelector("[data-cortina-boton]");
        this.#anuncios = anuncios;
        this.#boton.addEventListener("click", () => callbacks.alConfirmar());
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
            this.#boton.textContent = mensaje.boton;
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
