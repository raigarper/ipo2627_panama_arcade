/**
 * @file Bala.js
 * @capa Modelo
 * @resumen Proyectil disparado por la nave o por un enemigo; se mueve en vertical a velocidad constante.
 * @depende Entidad
 * @usadoPor JuegoModel, LienzoView (solo lectura)
 */

import { Entidad } from "./Entidad.js";

/** Quién ha disparado la bala. Se usa para decidir contra qué colisiona. */
export const PROPIETARIOS = Object.freeze({ JUGADOR: "jugador", ENEMIGO: "enemigo" });

export class Bala extends Entidad {
    /** Anchura de toda bala, en unidades de mundo. */
    static ANCHO = 4;
    /** Altura de toda bala, en unidades de mundo. */
    static ALTO = 14;

    /** @type {number} Velocidad vertical en unidades/s (negativa = hacia arriba). */
    velocidadY;
    /** @type {string} Uno de PROPIETARIOS. */
    propietario;

    /**
     * @param {number} centroX - Coordenada X donde queda centrada la bala.
     * @param {number} y - Coordenada Y de su borde superior al nacer.
     * @param {number} velocidadY - Velocidad vertical en unidades/s (negativa sube).
     * @param {string} propietario - Uno de PROPIETARIOS.
     */
    constructor(centroX, y, velocidadY, propietario) {
        super(centroX - Bala.ANCHO / 2, y, Bala.ANCHO, Bala.ALTO);
        this.velocidadY = velocidadY;
        this.propietario = propietario;
    }

    /**
     * Avanza la bala (movimiento rectilíneo uniforme: posición += velocidad × tiempo).
     * @param {number} dt - Segundos transcurridos en este paso.
     * @returns {void}
     */
    mover(dt) {
        this.y += this.velocidadY * dt;
    }

    /**
     * Indica si la bala ya salió del mundo y puede descartarse.
     * @param {number} altoMundo - Altura lógica del mundo.
     * @returns {boolean}
     */
    estaFuera(altoMundo) {
        return this.y + this.alto < 0 || this.y > altoMundo;
    }
}
