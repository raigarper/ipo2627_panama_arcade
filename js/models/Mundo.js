/**
 * @file Mundo.js
 * @capa Modelo
 * @resumen Constantes del mundo de juego: dimensiones lógicas y paso de tiempo fijo.
 * @depende Nada.
 * @usadoPor Nave, Formacion, JuegoModel, AppController, LienzoView
 *
 * Por qué: el modelo trabaja en un espacio LÓGICO fijo (480 × 640) que no depende
 * del tamaño real del canvas en pantalla. La vista escala ese espacio al canvas,
 * así la jugabilidad es idéntica en cualquier dispositivo.
 */

/** Dimensiones lógicas del mundo, en unidades de juego (no en píxeles de pantalla). */
export const MUNDO = Object.freeze({ ancho: 480, alto: 640 });

/**
 * Paso de simulación fijo, en segundos (60 actualizaciones por segundo).
 * Por qué: con un paso fijo la física es determinista y no depende de los FPS
 * del monitor (ver AppController, bucle con acumulador).
 */
export const PASO_FIJO = 1 / 60;
