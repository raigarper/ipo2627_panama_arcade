/**
 * @file CabeceraView.js
 * @capa Vista
 * @resumen Cabecera: marcadores (vidas con corazones, puntos grandes, oleada) y botones de partida, ayuda, ajustes y sonido.
 * @depende JuegoModel (solo la constante ESTADOS), spriteSvg
 * @usadoPor app.js, AppController
 *
 * Esta vista NO decide cuándo se puede pausar o finalizar: refleja el estado
 * que le pasa el controlador habilitando o deshabilitando los botones.
 */

import { ESTADOS } from "../models/JuegoModel.js";
import { crearSpriteSvg } from "./spriteSvg.js";

export class CabeceraView {
    #contenedorVidas;
    #marcadorPuntos;
    #marcadorOleada;
    #botonComenzar;
    #botonPausar;
    #botonFinalizar;
    #botonSonido;
    /** @type {HTMLElement[]} Un elemento por cada corazón dibujado. */
    #corazones = [];

    /**
     * Localiza los elementos por atributos `data-*` y enlaza sus eventos.
     * @param {HTMLElement} cabecera - Contenedor `[data-cabecera]`.
     * @param {{
     *   alComenzar: () => void,
     *   alAlternarPausa: () => void,
     *   alFinalizar: () => void,
     *   alAbrirAyuda: () => void,
     *   alAbrirAjustes: () => void,
     *   alAlternarSonido: () => void,
     * }} callbacks - Avisos al controlador.
     */
    constructor(cabecera, callbacks) {
        this.#contenedorVidas = cabecera.querySelector("[data-marcador-vidas]");
        this.#marcadorPuntos = cabecera.querySelector("[data-marcador-puntos]");
        this.#marcadorOleada = cabecera.querySelector("[data-marcador-oleada]");
        this.#botonComenzar = cabecera.querySelector("[data-accion='comenzar']");
        this.#botonPausar = cabecera.querySelector("[data-accion='pausar']");
        this.#botonFinalizar = cabecera.querySelector("[data-accion='finalizar']");
        this.#botonSonido = cabecera.querySelector("[data-accion='alternar-sonido']");

        this.#botonComenzar.addEventListener("click", () => callbacks.alComenzar());
        this.#botonPausar.addEventListener("click", () => callbacks.alAlternarPausa());
        this.#botonFinalizar.addEventListener("click", () => callbacks.alFinalizar());
        cabecera
            .querySelector("[data-accion='abrir-ayuda']")
            .addEventListener("click", () => callbacks.alAbrirAyuda());
        cabecera
            .querySelector("[data-accion='abrir-ajustes']")
            .addEventListener("click", () => callbacks.alAbrirAjustes());
        this.#botonSonido.addEventListener("click", () => callbacks.alAlternarSonido());

        // Al ganar puntos el número "late" un instante; la clase se retira sola al acabar la animación.
        this.#marcadorPuntos.addEventListener("animationend", () => {
            this.#marcadorPuntos.classList.remove("puntos__valor--sube");
        });
    }

    /**
     * Actualiza los indicadores de progreso: puntos, vidas (corazones) y oleada.
     * @param {{puntos:number, vidas:number, vidasMax:number, oleada:number}} marcadores - Valores actuales.
     * @returns {void}
     */
    actualizarMarcadores({ puntos, vidas, vidasMax, oleada }) {
        if (String(puntos) !== this.#marcadorPuntos.textContent) {
            this.#marcadorPuntos.textContent = String(puntos);
            if (puntos > 0) {
                this.#marcadorPuntos.classList.add("puntos__valor--sube");
            }
        }
        this.#marcadorOleada.textContent = String(oleada);
        this.#pintarVidas(vidas, vidasMax);
    }

    /**
     * Habilita o deshabilita los botones de partida según el estado, y cambia
     * el texto de "Pausar" a "Reanudar" cuando la partida está en pausa.
     * @param {string} estado - Uno de ESTADOS.
     * @returns {void}
     */
    actualizarEstado(estado) {
        const enCurso = estado === ESTADOS.JUGANDO || estado === ESTADOS.PAUSA;
        this.#botonComenzar.disabled = enCurso;
        this.#botonPausar.disabled = !enCurso;
        this.#botonFinalizar.disabled = !enCurso;
        this.#botonPausar.textContent = estado === ESTADOS.PAUSA ? "Reanudar" : "Pausar";
    }

    /**
     * Refleja si el sonido está activado: `aria-pressed`, etiqueta accesible e icono.
     * @param {boolean} activo - `true` si el sonido está activado.
     * @returns {void}
     */
    actualizarSonido(activo) {
        this.#botonSonido.setAttribute("aria-pressed", String(activo));
        this.#botonSonido.setAttribute("aria-label", activo ? "Sonido activado" : "Sonido desactivado");
        this.#botonSonido.classList.toggle("boton-icono--silenciado", !activo);
    }

    /**
     * Dibuja los corazones: uno por cada vida inicial, llenos los que quedan y
     * vacíos los perdidos. Solo reconstruye los elementos si cambia el máximo.
     * @param {number} vidas - Vidas restantes.
     * @param {number} vidasMax - Vidas con las que empezó la partida.
     * @returns {void}
     */
    #pintarVidas(vidas, vidasMax) {
        if (this.#corazones.length !== vidasMax) {
            this.#contenedorVidas.textContent = "";
            this.#corazones = Array.from({ length: vidasMax }, () => {
                const corazon = document.createElement("span");
                corazon.classList.add("vidas__corazon");
                corazon.appendChild(crearSpriteSvg("corazon"));
                this.#contenedorVidas.appendChild(corazon);
                return corazon;
            });
        }
        this.#corazones.forEach((corazon, indice) => {
            corazon.classList.toggle("vidas__corazon--vacio", indice >= vidas);
        });
        this.#contenedorVidas.setAttribute("aria-label", `Vidas: ${vidas} de ${vidasMax}`);
    }
}
