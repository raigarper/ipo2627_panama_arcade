/**
 * @file Formacion.js
 * @capa Modelo
 * @resumen Bloque de enemigos que se mueve en horizontal y baja una fila al tocar un borde.
 * @depende Enemigo, Mundo
 * @usadoPor JuegoModel
 *
 * Por qué: separar la formación de JuegoModel mantiene cada clase pequeña y
 * permite razonar por separado sobre "cómo se mueven los enemigos" y "cómo se
 * desarrolla la partida".
 */

import { Enemigo } from "./Enemigo.js";
import { MUNDO } from "./Mundo.js";

const COLUMNAS = 8;
const SEPARACION_X = 48;
const SEPARACION_Y = 40;
/** Distancia mínima a los bordes laterales antes de invertir el sentido. */
const MARGEN = 12;
/** Cuánto desciende la formación al invertir el sentido. */
const BAJADA = 18;
const INICIO_Y = 64;
/** Tipo de enemigo de cada fila, de arriba abajo (las filas de arriba valen más). */
const TIPO_POR_FILA = Object.freeze([2, 1, 1, 0, 0]);
/** Anchura de un enemigo, para centrar la formación. */
const ANCHO_ENEMIGO = 32;

export class Formacion {
    /** @type {Enemigo[]} Enemigos vivos. */
    #enemigos = [];
    /** @type {number} +1 hacia la derecha, -1 hacia la izquierda. */
    #direccion = 1;
    /** @type {number} Cuántos enemigos tenía la oleada al empezar (para acelerar al quedar pocos). */
    #total = 0;

    /**
     * @returns {Enemigo[]} Enemigos vivos (solo lectura para las vistas).
     */
    get enemigos() {
        return this.#enemigos;
    }

    /**
     * @returns {number} Número de enemigos vivos.
     */
    get cantidad() {
        return this.#enemigos.length;
    }

    /**
     * @returns {number} Coordenada Y del borde inferior del enemigo más bajo (0 si no hay ninguno).
     */
    get limiteInferior() {
        return this.#enemigos.reduce((maximo, e) => Math.max(maximo, e.y + e.alto), 0);
    }

    /**
     * Genera una formación nueva, centrada y completa.
     * @param {number} filas - Número de filas (entre 1 y TIPO_POR_FILA.length).
     * @returns {void}
     */
    crear(filas) {
        const anchoTotal = (COLUMNAS - 1) * SEPARACION_X + ANCHO_ENEMIGO;
        const inicioX = (MUNDO.ancho - anchoTotal) / 2;
        this.#enemigos = [];
        for (let fila = 0; fila < Math.min(filas, TIPO_POR_FILA.length); fila += 1) {
            for (let columna = 0; columna < COLUMNAS; columna += 1) {
                this.#enemigos.push(
                    new Enemigo(
                        inicioX + columna * SEPARACION_X,
                        INICIO_Y + fila * SEPARACION_Y,
                        TIPO_POR_FILA[fila],
                        columna,
                    ),
                );
            }
        }
        this.#total = this.#enemigos.length;
        this.#direccion = 1;
    }

    /**
     * Mueve toda la formación. Cuantos menos enemigos quedan, más rápido va
     * (efecto clásico de tensión creciente). Al tocar un borde invierte el
     * sentido y baja una fila.
     * @param {number} dt - Segundos transcurridos en este paso.
     * @param {number} velocidadBase - Velocidad horizontal base en unidades/s.
     * @returns {void}
     */
    avanzar(dt, velocidadBase) {
        if (this.#enemigos.length === 0) {
            return;
        }
        const aceleracion = 1 + 1.5 * (1 - this.#enemigos.length / this.#total);
        const desplazamiento = this.#direccion * velocidadBase * aceleracion * dt;
        const minimoX = Math.min(...this.#enemigos.map((e) => e.x));
        const maximoX = Math.max(...this.#enemigos.map((e) => e.x + e.ancho));
        const tocaBorde =
            (desplazamiento > 0 && maximoX + desplazamiento > MUNDO.ancho - MARGEN) ||
            (desplazamiento < 0 && minimoX + desplazamiento < MARGEN);

        if (tocaBorde) {
            this.#direccion *= -1;
            this.#enemigos.forEach((e) => {
                e.y += BAJADA;
            });
        } else {
            this.#enemigos.forEach((e) => {
                e.x += desplazamiento;
            });
        }
    }

    /**
     * Enemigo más bajo de cada columna: solo ellos pueden disparar, para que
     * los enemigos no se disparen unos a otros a través de la formación.
     * @returns {Enemigo[]}
     */
    inferiores() {
        const porColumna = new Map();
        this.#enemigos.forEach((e) => {
            const actual = porColumna.get(e.columna);
            if (!actual || e.y > actual.y) {
                porColumna.set(e.columna, e);
            }
        });
        return Array.from(porColumna.values());
    }

    /**
     * Elimina un enemigo de la formación.
     * @param {Enemigo} enemigo - Enemigo destruido.
     * @returns {void}
     */
    retirar(enemigo) {
        this.#enemigos = this.#enemigos.filter((e) => e !== enemigo);
    }
}
