/**
 * @file spriteSvg.js
 * @capa Vista (utilidad)
 * @resumen Crea el icono SVG de un sprite del juego, para la leyenda de la ayuda y los corazones del marcador.
 * @depende sprites
 * @usadoPor AyudaView, CabeceraView
 *
 * Por qué: el SVG se genera a partir del MISMO bitmap que usa el canvas, así la
 * interfaz y el juego siempre coinciden. Las filas de píxeles contiguos se
 * agrupan en rectángulos y todo el sprite es un único `<path>`, ligero y nítido
 * (`shape-rendering: crispEdges`). El color lo pone el CSS con la clase
 * `sprite__cuerpo--<nombre>`; el JS solo asigna clases.
 */

import { dimensiones, SPRITES } from "./sprites.js";

const ESPACIO_SVG = "http://www.w3.org/2000/svg";

/**
 * Convierte un fotograma en el atributo `d` de un `<path>`: un rectángulo por
 * cada tramo horizontal continuo de píxeles rellenos.
 * @param {string[]} fotograma - Filas del fotograma (`X` relleno, `.` vacío).
 * @returns {string} Datos del trazado SVG.
 */
function trazado(fotograma) {
    const segmentos = [];
    fotograma.forEach((fila, y) => {
        for (const tramo of fila.matchAll(/X+/g)) {
            segmentos.push(`M${tramo.index} ${y}h${tramo[0].length}v1h-${tramo[0].length}z`);
        }
    });
    return segmentos.join("");
}

/**
 * Crea el SVG de un sprite.
 * @param {string} nombre - Clave de SPRITES (p. ej. "enemigo0", "nodriza", "corazon").
 * @param {number} [cuadro] - Índice del fotograma (0 por defecto).
 * @returns {SVGSVGElement} SVG decorativo (`aria-hidden`), coloreado por CSS.
 */
export function crearSpriteSvg(nombre, cuadro = 0) {
    const fotograma = SPRITES[nombre][cuadro];
    const { columnas, filas } = dimensiones(fotograma);

    const svg = document.createElementNS(ESPACIO_SVG, "svg");
    svg.setAttribute("viewBox", `0 0 ${columnas} ${filas}`);
    svg.setAttribute("shape-rendering", "crispEdges");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("sprite");

    const cuerpo = document.createElementNS(ESPACIO_SVG, "path");
    cuerpo.setAttribute("d", trazado(fotograma));
    cuerpo.classList.add("sprite__cuerpo", `sprite__cuerpo--${nombre}`);
    svg.appendChild(cuerpo);
    return svg;
}
