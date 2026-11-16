/**
 * @file PaginaView.js
 * @capa Vista
 * @resumen Aplica la apariencia global (paleta y alto contraste) como clases modificadoras en la raíz `.pagina`.
 * @depende Configuracion (solo la lista PALETAS)
 * @usadoPor app.js, AppController
 *
 * Por qué clases y no estilos en línea: el JS solo decide QUÉ estado hay y el
 * CSS decide CÓMO se ve. Cambiar de paleta es cambiar una clase; los colores
 * viven únicamente en `variables.css`.
 */

import { PALETAS } from "../models/Configuracion.js";

export class PaginaView {
    /** @type {HTMLElement} */
    #pagina;

    /**
     * @param {HTMLElement} pagina - Contenedor raíz `[data-pagina]`.
     */
    constructor(pagina) {
        this.#pagina = pagina;
    }

    /**
     * Refleja en el DOM la paleta y el contraste de la configuración.
     * @param {import("../models/Configuracion.js").Configuracion} configuracion - Ajustes actuales.
     * @returns {void}
     */
    aplicar(configuracion) {
        PALETAS.forEach((paleta) => {
            this.#pagina.classList.toggle(`pagina--paleta-${paleta}`, paleta === configuracion.paleta);
        });
        this.#pagina.classList.toggle("pagina--alto-contraste", configuracion.altoContraste);
    }
}
