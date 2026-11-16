/**
 * @file PaginaView.js
 * @capa Vista
 * @resumen Aplica la apariencia global (tema claro u oscuro y alto contraste) como clases modificadoras en la raíz `.pagina`.
 * @depende Configuracion (solo la lista TEMAS)
 * @usadoPor app.js, AppController
 *
 * Por qué clases y no estilos en línea: el JS solo decide QUÉ estado hay y el
 * CSS decide CÓMO se ve. Cambiar de tema es cambiar una clase; los colores
 * viven únicamente en `variables.css`.
 */

import { TEMAS } from "../models/Configuracion.js";

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
     * Refleja en el DOM el tema y el contraste de la configuración.
     * @param {import("../models/Configuracion.js").Configuracion} configuracion - Ajustes actuales.
     * @returns {void}
     */
    aplicar(configuracion) {
        TEMAS.forEach((tema) => {
            this.#pagina.classList.toggle(`pagina--tema-${tema}`, tema === configuracion.tema);
        });
        this.#pagina.classList.toggle("pagina--alto-contraste", configuracion.altoContraste);
    }
}
