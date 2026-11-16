/**
 * @file Nave.js
 * @capa Modelo
 * @resumen Nave del jugador: movimiento horizontal, cadencia de disparo, vidas e invulnerabilidad temporal.
 * @depende Entidad, Mundo
 * @usadoPor JuegoModel, LienzoView (solo lectura)
 */

import { Entidad } from "./Entidad.js";
import { MUNDO } from "./Mundo.js";

/** Velocidad horizontal de la nave, en unidades/s. */
const VELOCIDAD = 260;
/** Segundos mínimos entre dos disparos (cadencia). */
const ENFRIAMIENTO = 0.35;
/** Segundos de invulnerabilidad tras recibir un impacto (evita perder dos vidas seguidas). */
const DURACION_INVULNERABLE = 1.6;
/** Separación mínima entre la nave y los bordes laterales del mundo. */
const MARGEN = 8;

export class Nave extends Entidad {
    /** @type {number} Vidas restantes. */
    vidas;
    /** @type {number} Segundos que faltan para poder volver a disparar. */
    #enfriamiento = 0;
    /** @type {number} Segundos de invulnerabilidad restantes. */
    #invulnerable = 0;

    /**
     * Coloca la nave centrada en la parte baja del mundo.
     * @param {number} vidas - Vidas iniciales (según la dificultad).
     */
    constructor(vidas) {
        super((MUNDO.ancho - 36) / 2, MUNDO.alto - 56, 36, 24);
        this.vidas = vidas;
    }

    /**
     * @returns {boolean} `true` mientras la nave no puede recibir daño.
     */
    get invulnerable() {
        return this.#invulnerable > 0;
    }

    /**
     * @returns {boolean} `true` si ya ha pasado el tiempo de enfriamiento y puede disparar.
     */
    get puedeDisparar() {
        return this.#enfriamiento === 0;
    }

    /**
     * Desplaza la nave en horizontal, sin salir del mundo.
     * @param {number} direccion - -1 izquierda, 0 quieta, +1 derecha.
     * @param {number} dt - Segundos transcurridos en este paso.
     * @returns {void}
     */
    mover(direccion, dt) {
        const destino = this.x + direccion * VELOCIDAD * dt;
        const maximo = MUNDO.ancho - MARGEN - this.ancho;
        this.x = Math.min(Math.max(destino, MARGEN), maximo);
    }

    /**
     * Descuenta los temporizadores internos (enfriamiento e invulnerabilidad).
     * @param {number} dt - Segundos transcurridos en este paso.
     * @returns {void}
     */
    avanzarTiempo(dt) {
        this.#enfriamiento = Math.max(0, this.#enfriamiento - dt);
        this.#invulnerable = Math.max(0, this.#invulnerable - dt);
    }

    /**
     * Anota que se ha disparado y reinicia el enfriamiento.
     * @returns {void}
     */
    registrarDisparo() {
        this.#enfriamiento = ENFRIAMIENTO;
    }

    /**
     * Aplica un impacto si la nave no es invulnerable.
     * @returns {boolean} `true` si el impacto restó una vida; `false` si se ignoró.
     */
    recibirImpacto() {
        if (this.invulnerable) {
            return false;
        }
        this.vidas -= 1;
        this.#invulnerable = DURACION_INVULNERABLE;
        return true;
    }
}
