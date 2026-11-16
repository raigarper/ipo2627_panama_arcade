/**
 * @file Enemigo.js
 * @capa Modelo
 * @resumen Invasor de la formación. Hay 3 tipos, que valen distintos puntos y se dibujan con forma y color distintos.
 * @depende Entidad
 * @usadoPor Formacion, JuegoModel, LienzoView (solo lectura)
 */

import { Entidad } from "./Entidad.js";

/** Puntos que da cada tipo de enemigo: el índice es el tipo (0, 1 o 2). */
export const PUNTOS_POR_TIPO = Object.freeze([10, 20, 30]);

export class Enemigo extends Entidad {
    /** @type {number} Tipo de enemigo: 0, 1 o 2. */
    tipo;
    /** @type {number} Columna de la formación a la que pertenece (no cambia aunque se mueva). */
    columna;

    /**
     * @param {number} x - Posición inicial X.
     * @param {number} y - Posición inicial Y.
     * @param {number} tipo - Tipo de enemigo (índice de PUNTOS_POR_TIPO).
     * @param {number} columna - Columna de la formación.
     */
    constructor(x, y, tipo, columna) {
        super(x, y, 32, 24);
        this.tipo = tipo;
        this.columna = columna;
    }

    /**
     * @returns {number} Puntos que se obtienen al destruir este enemigo.
     */
    get puntos() {
        return PUNTOS_POR_TIPO[this.tipo];
    }
}
