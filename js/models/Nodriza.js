/**
 * @file Nodriza.js
 * @capa Modelo
 * @resumen Platillo nodriza bonus: cruza la parte superior del mundo y da muchos puntos si se destruye.
 * @depende Entidad
 * @usadoPor JuegoModel, LienzoView (solo lectura)
 */

import { Entidad } from "./Entidad.js";

/** Puntos que da la nodriza. */
export const PUNTOS_NODRIZA = 100;

export class Nodriza extends Entidad {
    /** Anchura del platillo: 16 celdas de sprite × 3 unidades. */
    static ANCHO = 48;
    /** Altura del platillo: 7 celdas de sprite × 3 unidades. */
    static ALTO = 21;

    /** @type {number} Velocidad horizontal en unidades/s (signo = sentido). */
    velocidadX;

    /**
     * @param {number} x - Posición inicial X (justo fuera del mundo).
     * @param {number} velocidadX - Velocidad horizontal con signo.
     */
    constructor(x, velocidadX) {
        super(x, 12, Nodriza.ANCHO, Nodriza.ALTO);
        this.velocidadX = velocidadX;
    }

    /**
     * Avanza la nodriza en línea recta.
     * @param {number} dt - Segundos transcurridos en este paso.
     * @returns {void}
     */
    mover(dt) {
        this.x += this.velocidadX * dt;
    }

    /**
     * Indica si ya cruzó todo el mundo y puede descartarse.
     * @param {number} anchoMundo - Anchura lógica del mundo.
     * @returns {boolean}
     */
    estaFuera(anchoMundo) {
        return this.x > anchoMundo || this.x + this.ancho < 0;
    }
}
