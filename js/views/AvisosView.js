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
    /** @type {HTMLElement[]} Teclas de movimiento mostradas en la pista (`[data-tecla]`). */
    #teclas;

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
        this.#teclas = Array.from(cortina.querySelectorAll("[data-tecla]"));
        this.#boton.addEventListener("click", () => callbacks.alConfirmar());
    }

    /**
     * Muestra en la pista de la pantalla de inicio las teclas del esquema de
     * control elegido. Cada tecla trae sus etiquetas en atributos
     * `data-etiqueta-<esquema>` (p. ej. `data-etiqueta-wasd="A"`), así la vista no
     * necesita conocer cuáles son las teclas de cada esquema.
     * @param {string} esquema - Esquema de control activo ("flechas" o "wasd").
     * @returns {void}
     */
    mostrarControles(esquema) {
        this.#teclas.forEach((tecla) => {
            tecla.textContent = tecla.getAttribute(`data-etiqueta-${esquema}`) ?? tecla.textContent;
        });
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
