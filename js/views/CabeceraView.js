/**
 * @file CabeceraView.js
 * @capa Vista
 * @resumen Cabecera: marcadores (puntos, vidas, oleada) y botones de partida (comenzar, pausar, finalizar), ayuda, ajustes y sonido.
 * @depende JuegoModel (solo la constante ESTADOS)
 * @usadoPor app.js, AppController
 *
 * Esta vista NO decide cuándo se puede pausar o finalizar: refleja el estado
 * que le pasa el controlador habilitando o deshabilitando los botones.
 */

import { ESTADOS } from "../models/JuegoModel.js";

export class CabeceraView {
    #marcadorPuntos;
    #marcadorVidas;
    #marcadorOleada;
    #botonComenzar;
    #botonPausar;
    #botonFinalizar;
    #botonSonido;

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
        this.#marcadorPuntos = cabecera.querySelector("[data-marcador-puntos]");
        this.#marcadorVidas = cabecera.querySelector("[data-marcador-vidas]");
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
    }

    /**
     * Actualiza los tres indicadores de progreso.
     * @param {{puntos:number, vidas:number, oleada:number}} marcadores - Valores actuales.
     * @returns {void}
     */
    actualizarMarcadores({ puntos, vidas, oleada }) {
        this.#marcadorPuntos.textContent = String(puntos);
        this.#marcadorVidas.textContent = String(vidas);
        this.#marcadorOleada.textContent = String(oleada);
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
}
