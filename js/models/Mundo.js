/**
 * @file Mundo.js
 * @capa Modelo
 * @resumen Dimensiones del mundo de juego (que se adaptan a la proporción de la pantalla) y paso de tiempo fijo.
 * @depende Nada.
 * @usadoPor JuegoModel, AppController
 *
 * Por qué: el modelo trabaja en un espacio LÓGICO que no depende de los píxeles
 * de pantalla. La vista escala ese espacio al canvas. Para que el juego ocupe
 * TODA la pantalla (y no un recuadro con huecos laterales), el tamaño lógico
 * del mundo se calcula a partir de la proporción del canvas:
 *   - Apaisado o cuadrado: alto fijo (ALTO_BASE) y ancho proporcional.
 *   - Vertical (móvil): ancho mínimo fijo (ANCHO_MIN) y alto proporcional.
 * Así, sea cual sea el dispositivo, los objetos tienen el mismo tamaño relativo
 * y la jugabilidad es equivalente.
 */

/** Alto lógico del mundo en pantallas apaisadas, en unidades de mundo. */
export const ALTO_BASE = 640;
/** Ancho lógico mínimo (pantallas verticales), en unidades de mundo. */
export const ANCHO_MIN = 360;
/** Ancho lógico máximo; por encima se deja una franja a los lados (proporciones extremas, > 4:1). */
export const ANCHO_MAX = 2560;
/** Alto lógico máximo; por encima se deja una franja arriba y abajo (proporciones extremas, < 1:4). */
export const ALTO_MAX = 1400;
/** Mundo inicial, antes de conocer el tamaño real del canvas. */
export const MUNDO_INICIAL = Object.freeze({ ancho: 480, alto: 640 });

/**
 * Paso de simulación fijo, en segundos (60 actualizaciones por segundo).
 * Por qué: con un paso fijo la física es determinista y no depende de los FPS
 * del monitor (ver AppController, bucle con acumulador).
 */
export const PASO_FIJO = 1 / 60;

/**
 * Calcula el tamaño lógico del mundo para una proporción ancho/alto del canvas.
 * @param {number} proporcion - Ancho dividido por alto del canvas, en píxeles.
 * @returns {{ancho:number, alto:number}} Tamaño del mundo en unidades de mundo (enteros).
 */
export function calcularMundo(proporcion) {
    const valida = Number.isFinite(proporcion) && proporcion > 0 ? proporcion : ANCHO_MIN / ALTO_BASE;
    if (valida >= ANCHO_MIN / ALTO_BASE) {
        return { ancho: Math.round(Math.min(ALTO_BASE * valida, ANCHO_MAX)), alto: ALTO_BASE };
    }
    return { ancho: ANCHO_MIN, alto: Math.round(Math.min(ANCHO_MIN / valida, ALTO_MAX)) };
}
