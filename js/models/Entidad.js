/**
 * @file Entidad.js
 * @capa Modelo
 * @resumen Clase base de todo objeto con posición y caja de colisión rectangular (AABB).
 * @depende Nada.
 * @usadoPor Nave, Enemigo, Nodriza, Bala
 */

export class Entidad {
    /** @type {number} Coordenada X de la esquina superior izquierda (unidades de mundo). */
    x;
    /** @type {number} Coordenada Y de la esquina superior izquierda (unidades de mundo). */
    y;
    /** @type {number} Anchura de la caja de colisión. */
    ancho;
    /** @type {number} Altura de la caja de colisión. */
    alto;

    /**
     * Crea una entidad con su caja de colisión.
     * @param {number} x - Esquina superior izquierda, eje X.
     * @param {number} y - Esquina superior izquierda, eje Y.
     * @param {number} ancho - Anchura de la caja.
     * @param {number} alto - Altura de la caja.
     */
    constructor(x, y, ancho, alto) {
        this.x = x;
        this.y = y;
        this.ancho = ancho;
        this.alto = alto;
    }

    /**
     * Coordenada X del centro de la caja.
     * @returns {number}
     */
    get centroX() {
        return this.x + this.ancho / 2;
    }

    /**
     * Coordenada Y del centro de la caja.
     * @returns {number}
     */
    get centroY() {
        return this.y + this.alto / 2;
    }

    /**
     * Detección de colisión AABB (Axis-Aligned Bounding Box): dos rectángulos
     * se solapan si lo hacen a la vez en el eje X y en el eje Y.
     * @param {Entidad} otra - Entidad contra la que se comprueba.
     * @returns {boolean} `true` si las cajas se solapan.
     */
    solapaCon(otra) {
        return (
            this.x < otra.x + otra.ancho &&
            this.x + this.ancho > otra.x &&
            this.y < otra.y + otra.alto &&
            this.y + this.alto > otra.y
        );
    }
}
