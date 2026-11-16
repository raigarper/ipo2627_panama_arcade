/**
 * @file Dialogo.js
 * @capa Vista (utilidad)
 * @resumen Envuelve un `<dialog>` nativo: abrir modal, cerrar, cierre por fondo y por botones `[data-cerrar]`.
 * @depende Nada.
 * @usadoPor AyudaView, AjustesView, FinView
 *
 * Por qué `<dialog>` nativo: `showModal()` ya da trampa de foco, `Escape` para
 * cerrar, capa superior (top layer) y devolución del foco al elemento que lo
 * abrió. Es la solución semántica y accesible que sustituye al modal manual
 * con `div` + `role="dialog"` de las prácticas anteriores.
 */

export class Dialogo {
    /** @type {HTMLDialogElement} */
    #dialogo;

    /**
     * Enlaza los eventos del diálogo.
     * @param {HTMLDialogElement} dialogo - Elemento `<dialog>` ya presente en el HTML.
     */
    constructor(dialogo) {
        this.#dialogo = dialogo;

        dialogo.querySelectorAll("[data-cerrar]").forEach((boton) => {
            boton.addEventListener("click", () => this.cerrar());
        });
        // Un clic sobre el propio <dialog> (no sobre su contenido) es un clic en el fondo.
        dialogo.addEventListener("click", (evento) => {
            if (evento.target === dialogo) {
                this.cerrar();
            }
        });
    }

    /**
     * @returns {HTMLDialogElement} El elemento envuelto (para buscar controles dentro).
     */
    get elemento() {
        return this.#dialogo;
    }

    /**
     * @returns {boolean} `true` si el diálogo está abierto.
     */
    get abierto() {
        return this.#dialogo.open;
    }

    /**
     * Abre el diálogo como modal (si no estaba ya abierto).
     * @returns {void}
     */
    abrir() {
        if (!this.#dialogo.open) {
            this.#dialogo.showModal();
        }
    }

    /**
     * Cierra el diálogo; el navegador devuelve el foco a quien lo abrió.
     * @returns {void}
     */
    cerrar() {
        if (this.#dialogo.open) {
            this.#dialogo.close();
        }
    }
}
