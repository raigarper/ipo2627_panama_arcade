/**
 * @file formaEnemigo.js
 * @capa Vista (utilidad)
 * @resumen Crea el icono SVG de cada tipo de enemigo, para la ayuda y las muestras de paleta.
 * @depende Nada.
 * @usadoPor AyudaView, AjustesView
 *
 * Por qué: cada tipo de enemigo se distingue por FORMA y por COLOR a la vez
 * (círculo, triángulo, rombo). Así nunca depende solo del color, que es un
 * requisito de accesibilidad para usuarios con daltonismo. El color lo pone el
 * CSS con la clase `forma__cuerpo--tipo-N`; el JS solo asigna clases.
 */

const ESPACIO_SVG = "http://www.w3.org/2000/svg";

/**
 * Puntos del polígono de cada tipo en un viewBox de 100 × 100 (el tipo 0 es un círculo).
 * Deben coincidir con las siluetas que dibuja LienzoView.
 */
const PUNTOS_POLIGONO = Object.freeze({
    1: "8,18 92,18 50,88",
    2: "50,6 94,50 50,94 6,50",
});

/**
 * Crea el SVG de un tipo de enemigo.
 * @param {number} tipo - 0 círculo, 1 triángulo, 2 rombo.
 * @returns {SVGSVGElement} SVG decorativo (`aria-hidden`), coloreado por CSS.
 */
export function crearFormaSvg(tipo) {
    const svg = document.createElementNS(ESPACIO_SVG, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("forma");

    const cuerpo =
        tipo === 0
            ? document.createElementNS(ESPACIO_SVG, "circle")
            : document.createElementNS(ESPACIO_SVG, "polygon");
    if (tipo === 0) {
        cuerpo.setAttribute("cx", "50");
        cuerpo.setAttribute("cy", "50");
        cuerpo.setAttribute("r", "42");
    } else {
        cuerpo.setAttribute("points", PUNTOS_POLIGONO[tipo]);
    }
    cuerpo.classList.add("forma__cuerpo", `forma__cuerpo--tipo-${tipo}`);
    svg.appendChild(cuerpo);
    return svg;
}
