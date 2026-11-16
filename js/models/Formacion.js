/**
 * @file Formacion.js
 * @capa Modelo
 * @resumen Bloque de enemigos que se mueve en horizontal y baja una fila al tocar un borde. El número de columnas se adapta al ancho del mundo.
 * @depende Enemigo
 * @usadoPor JuegoModel
 *
 * Por qué: separar la formación de JuegoModel mantiene cada clase pequeña y
 * permite razonar por separado sobre "cómo se mueven los enemigos" y "cómo se
 * desarrolla la partida".
 */

import { Enemigo } from "./Enemigo.js";

const MIN_COLUMNAS = 4;
const MAX_COLUMNAS = 12;
/**
 * Fracción máxima del ancho del mundo que ocupa la formación. Por qué: si
 * ocupara casi todo el ancho, rebotaría en los bordes continuamente y
 * bajaría una fila cada pocos segundos (partida injugable en móvil vertical).
 */
const FRACCION_ANCHO = 0.7;
const SEPARACION_X = 56;
const SEPARACION_Y = 36;
/** Distancia mínima a los bordes laterales antes de invertir el sentido. */
const MARGEN = 16;
/** Cuánto desciende la formación al invertir el sentido. */
const BAJADA = 20;
const INICIO_Y = 52;
/** Tipo de enemigo de cada fila, de arriba abajo (las filas de arriba valen más). */
const TIPO_POR_FILA = Object.freeze([2, 1, 1, 0, 0]);

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
     * Genera una formación nueva, centrada y completa. El número de columnas
     * depende del ancho: cuanto más ancha la pantalla, más enemigos caben.
     * @param {number} filas - Número de filas (entre 1 y TIPO_POR_FILA.length).
     * @param {number} anchoMundo - Ancho lógico del mundo.
     * @returns {void}
     */
    crear(filas, anchoMundo) {
        const disponible = anchoMundo * FRACCION_ANCHO - Enemigo.ANCHO;
        const columnas = Math.max(MIN_COLUMNAS, Math.min(MAX_COLUMNAS, Math.floor(disponible / SEPARACION_X) + 1));
        const anchoTotal = (columnas - 1) * SEPARACION_X + Enemigo.ANCHO;
        const inicioX = (anchoMundo - anchoTotal) / 2;
        this.#enemigos = [];
        for (let fila = 0; fila < Math.min(filas, TIPO_POR_FILA.length); fila += 1) {
            for (let columna = 0; columna < columnas; columna += 1) {
                this.#enemigos.push(
                    new Enemigo(inicioX + columna * SEPARACION_X, INICIO_Y + fila * SEPARACION_Y, TIPO_POR_FILA[fila], columna),
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
     * @param {number} anchoMundo - Ancho lógico del mundo.
     * @returns {void}
     */
    avanzar(dt, velocidadBase, anchoMundo) {
        if (this.#enemigos.length === 0) {
            return;
        }
        const aceleracion = 1 + 1.5 * (1 - this.#enemigos.length / this.#total);
        const desplazamiento = this.#direccion * velocidadBase * aceleracion * dt;
        const minimoX = Math.min(...this.#enemigos.map((e) => e.x));
        const maximoX = Math.max(...this.#enemigos.map((e) => e.x + e.ancho));
        const tocaBorde =
            (desplazamiento > 0 && maximoX + desplazamiento > anchoMundo - MARGEN) ||
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
     * Adapta la formación a un nuevo ancho de mundo (p. ej. al girar el móvil).
     * Si cabe, la desplaza para que quede dentro de los bordes; si es más ancha
     * que el mundo, la comprime horizontalmente.
     * @param {number} anchoMundo - Nuevo ancho lógico del mundo.
     * @returns {void}
     */
    ajustar(anchoMundo) {
        if (this.#enemigos.length === 0) {
            return;
        }
        const minimoX = Math.min(...this.#enemigos.map((e) => e.x));
        const maximoX = Math.max(...this.#enemigos.map((e) => e.x + e.ancho));
        const disponible = anchoMundo - 2 * MARGEN;

        if (maximoX - minimoX > disponible) {
            const factor = (disponible - Enemigo.ANCHO) / (maximoX - minimoX - Enemigo.ANCHO);
            this.#enemigos.forEach((e) => {
                e.x = MARGEN + (e.x - minimoX) * factor;
            });
            return;
        }
        let desplazamiento = 0;
        if (maximoX > anchoMundo - MARGEN) {
            desplazamiento = anchoMundo - MARGEN - maximoX;
        }
        if (minimoX + desplazamiento < MARGEN) {
            desplazamiento = MARGEN - minimoX;
        }
        this.#enemigos.forEach((e) => {
            e.x += desplazamiento;
        });
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
