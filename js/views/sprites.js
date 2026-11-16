/**
 * @file sprites.js
 * @capa Vista (datos)
 * @resumen Bitmaps de todos los sprites del juego (estilo arcade clásico): enemigos, nave, platillo y corazón.
 * @depende Nada.
 * @usadoPor LienzoView (dibujo en canvas), spriteSvg (iconos SVG de la interfaz)
 *
 * Por qué bitmaps de texto: cada sprite se define UNA sola vez y sirve para el
 * canvas (donde se pre-renderiza a un lienzo pequeño y se escala sin suavizado,
 * para que los píxeles se vean nítidos) y para la interfaz (leyenda de la ayuda
 * y corazones del marcador, como SVG). Así lo que se ve en la ayuda es
 * exactamente lo que se ve en el juego.
 *
 * Formato: cada sprite es un array de fotogramas; cada fotograma es un array de
 * filas; en cada fila `X` es un píxel relleno y `.` es transparente. El color
 * NO está aquí: lo pone quien dibuja, a partir de las variables CSS.
 *
 * El tamaño en unidades de mundo es: celdas × CELDA. Debe coincidir con la caja
 * de colisión de la entidad (Enemigo 11×8 celdas = 33×24; Nave 13×8 = 39×24;
 * Nodriza 16×7 = 48×21).
 */

/** Unidades de mundo que ocupa cada píxel (celda) de un sprite. */
export const CELDA = 3;

/** @type {Readonly<Record<string, string[][]>>} Sprites por nombre; cada uno con 1 o 2 fotogramas. */
export const SPRITES = Object.freeze({
    // Tipo 0 · Pulpo (10 puntos): ancho y bajo, mueve los tentáculos.
    enemigo0: [
        [
            "...XXXXX...",
            ".XXXXXXXXX.",
            "XXXXXXXXXXX",
            "XXX..X..XXX",
            "XXXXXXXXXXX",
            "..XX...XX..",
            ".XX.XXX.XX.",
            "XX.......XX",
        ],
        [
            "...XXXXX...",
            ".XXXXXXXXX.",
            "XXXXXXXXXXX",
            "XXX..X..XXX",
            "XXXXXXXXXXX",
            "...XX.XX...",
            "..XX...XX..",
            ".XX.....XX.",
        ],
    ],
    // Tipo 1 · Cangrejo (20 puntos): con pinzas que suben y bajan.
    enemigo1: [
        [
            "X.........X",
            ".X.......X.",
            ".XXXXXXXXX.",
            "XX.XXXXX.XX",
            "XXXXXXXXXXX",
            ".XXXXXXXXX.",
            "..X.....X..",
            ".X.......X.",
        ],
        [
            ".X.......X.",
            "X.X.....X.X",
            ".XXXXXXXXX.",
            "XX.XXXXX.XX",
            "XXXXXXXXXXX",
            ".XXXXXXXXX.",
            ".X.X...X.X.",
            "X.........X",
        ],
    ],
    // Tipo 2 · Calamar (30 puntos): el más pequeño y valioso.
    enemigo2: [
        [
            "....XXX....",
            "...XXXXX...",
            "..XXXXXXX..",
            ".XX.XXX.XX.",
            ".XXXXXXXXX.",
            "...X...X...",
            "..X.XXX.X..",
            ".X.X...X.X.",
        ],
        [
            "....XXX....",
            "...XXXXX...",
            "..XXXXXXX..",
            ".XX.XXX.XX.",
            ".XXXXXXXXX.",
            "...X...X...",
            ".X..XXX..X.",
            "..X.....X..",
        ],
    ],
    // Cañón del jugador.
    nave: [
        [
            "......X......",
            ".....XXX.....",
            ".....XXX.....",
            ".XXXXXXXXXXX.",
            "XXXXXXXXXXXXX",
            "XXXXXXXXXXXXX",
            "XXXXXXXXXXXXX",
            "XXXXXXXXXXXXX",
        ],
    ],
    // Platillo nodriza (bonus).
    nodriza: [
        [
            ".....XXXXXX.....",
            "...XXXXXXXXXX...",
            "..XXXXXXXXXXXX..",
            ".XX.XX.XX.XX.XX.",
            "XXXXXXXXXXXXXXXX",
            "..XXX..XX..XXX..",
            "...X........X...",
        ],
    ],
    // Corazón de las vidas (solo interfaz).
    corazon: [
        [
            ".XX.XX.",
            "XXXXXXX",
            "XXXXXXX",
            ".XXXXX.",
            "..XXX..",
            "...X...",
        ],
    ],
});

/**
 * Dimensiones en celdas de un fotograma.
 * @param {string[]} fotograma - Filas del fotograma.
 * @returns {{columnas:number, filas:number}} Anchura y altura en celdas.
 */
export function dimensiones(fotograma) {
    return { columnas: fotograma[0].length, filas: fotograma.length };
}
