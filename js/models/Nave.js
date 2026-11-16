/**
 * @file Nave.js
 * @capa Modelo
 * @resumen Nave del jugador: movimiento horizontal, cadencia de disparo, vidas e invulnerabilidad temporal.
 * @depende Entidad
 * @usadoPor JuegoModel, LienzoView (solo lectura)
 */

import { Entidad } from "./Entidad.js";

/** Velocidad horizontal de la nave, en unidades/s. */
const VELOCIDAD = 260;
/** Segundos mínimos entre dos disparos (cadencia). */
const ENFRIAMIENTO = 0.35;
/** Segundos de invulnerabilidad tras recibir un impacto (evita perder dos vidas seguidas). */
const DURACION_INVULNERABLE = 1.6;
/** Separación mínima entre la nave y los bordes laterales del mundo. */
const MARGEN = 8;

export class Nave extends Entidad {
    /** Anchura de la nave: 13 celdas de sprite × 3 unidades. */
    static ANCHO = 39;
    /** Altura de la nave: 8 celdas de sprite × 3 unidades. */
    static ALTO = 24;
    /** Distancia entre el borde inferior del mundo y la parte superior de la nave. */
    static DISTANCIA_BASE = 48;

    /** @type {number} Vidas restantes. */
    vidas;
    /** @type {number} Segundos que faltan para poder volver a disparar. */
    #enfriamiento = 0;
    /** @type {number} Segundos de invulnerabilidad restantes. */
    #invulnerable = 0;

    /**
     * Coloca la nave centrada en la parte baja del mundo.
     * @param {number} vidas - Vidas iniciales (según la dificultad).
     * @param {number} anchoMundo - Ancho lógico del mundo.
     * @param {number} altoMundo - Alto lógico del mundo.
     */
    constructor(vidas, anchoMundo, altoMundo) {
        super(0, 0, Nave.ANCHO, Nave.ALTO);
        this.vidas = vidas;
        this.x = (anchoMundo - this.ancho) / 2;
        this.y = altoMundo - Nave.DISTANCIA_BASE;
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
     * Recoloca la nave tras un cambio de tamaño del mundo: vuelve a la parte
     * baja y se mantiene dentro de los bordes laterales (o se centra, si aún no se juega).
     * @param {number} anchoMundo - Nuevo ancho lógico del mundo.
     * @param {number} altoMundo - Nuevo alto lógico del mundo.
     * @param {boolean} [centrar] - `true` para centrarla en horizontal (antes de empezar la partida).
     * @returns {void}
     */
    colocar(anchoMundo, altoMundo, centrar = false) {
        this.y = altoMundo - Nave.DISTANCIA_BASE;
        this.x = centrar
            ? (anchoMundo - this.ancho) / 2
            : Math.min(Math.max(this.x, MARGEN), anchoMundo - MARGEN - this.ancho);
    }

    /**
     * Desplaza la nave en horizontal, sin salir del mundo.
     * @param {number} direccion - -1 izquierda, 0 quieta, +1 derecha.
     * @param {number} dt - Segundos transcurridos en este paso.
     * @param {number} anchoMundo - Ancho lógico del mundo.
     * @returns {void}
     */
    mover(direccion, dt, anchoMundo) {
        const destino = this.x + direccion * VELOCIDAD * dt;
        const maximo = anchoMundo - MARGEN - this.ancho;
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
