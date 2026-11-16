/**
 * @file Configuracion.js
 * @capa Modelo
 * @resumen Ajustes del jugador (dificultad, controles, tema, alto contraste, sonido). Objeto inmutable.
 * @depende Nada.
 * @usadoPor app.js, AppController, JuegoModel, AjustesView, PaginaView
 *
 * Por qué es inmutable: cada `conXxx()` devuelve una instancia NUEVA. Así el
 * estado de los ajustes solo cambia en un punto (el controlador) y nunca por
 * efectos laterales. Los valores por defecto y los permitidos viven aquí, en un
 * único sitio.
 */

/**
 * Parámetros de juego asociados a cada dificultad.
 * - vidas: vidas iniciales de la nave.
 * - factorVelocidad: multiplicador de la velocidad de la formación enemiga.
 * - intervaloDisparo: segundos medios entre disparos enemigos.
 */
export const DIFICULTADES = Object.freeze({
    facil: Object.freeze({ vidas: 5, factorVelocidad: 0.8, intervaloDisparo: 1.6 }),
    normal: Object.freeze({ vidas: 3, factorVelocidad: 1, intervaloDisparo: 1.1 }),
    dificil: Object.freeze({ vidas: 2, factorVelocidad: 1.3, intervaloDisparo: 0.7 }),
});

/** Esquemas de control disponibles (el disparo es siempre la barra espaciadora). */
export const CONTROLES = Object.freeze(["flechas", "wasd"]);

/** Temas de color de la interfaz. */
export const TEMAS = Object.freeze(["oscuro", "claro"]);

export class Configuracion {
    /** @type {string} Clave de DIFICULTADES. */
    dificultad;
    /** @type {string} Elemento de CONTROLES. */
    controles;
    /** @type {string} Elemento de TEMAS. */
    tema;
    /** @type {boolean} Si el modo de alto contraste está activo. */
    altoContraste;
    /** @type {boolean} Si el sonido está activado (por defecto, silenciado). */
    sonido;

    /**
     * Crea una configuración validando cada valor.
     * @param {{dificultad?:string, controles?:string, tema?:string, altoContraste?:boolean, sonido?:boolean}} [valores]
     * @throws {RangeError} Si algún valor no está permitido.
     */
    constructor({ dificultad = "normal", controles = "flechas", tema = "oscuro", altoContraste = false, sonido = false } = {}) {
        if (!(dificultad in DIFICULTADES)) {
            throw new RangeError(`Dificultad no válida: ${dificultad}`);
        }
        if (!CONTROLES.includes(controles)) {
            throw new RangeError(`Controles no válidos: ${controles}`);
        }
        if (!TEMAS.includes(tema)) {
            throw new RangeError(`Tema no válido: ${tema}`);
        }
        this.dificultad = dificultad;
        this.controles = controles;
        this.tema = tema;
        this.altoContraste = Boolean(altoContraste);
        this.sonido = Boolean(sonido);
        Object.freeze(this);
    }

    /**
     * @returns {{vidas:number, factorVelocidad:number, intervaloDisparo:number}} Parámetros de la dificultad actual.
     */
    get parametros() {
        return DIFICULTADES[this.dificultad];
    }

    /**
     * @param {string} dificultad - Clave de DIFICULTADES.
     * @returns {Configuracion} Copia con la dificultad cambiada.
     */
    conDificultad(dificultad) {
        return new Configuracion({ ...this, dificultad });
    }

    /**
     * @param {string} controles - Elemento de CONTROLES.
     * @returns {Configuracion} Copia con el esquema de control cambiado.
     */
    conControles(controles) {
        return new Configuracion({ ...this, controles });
    }

    /**
     * @param {string} tema - Elemento de TEMAS.
     * @returns {Configuracion} Copia con el tema cambiado.
     */
    conTema(tema) {
        return new Configuracion({ ...this, tema });
    }

    /**
     * @param {boolean} altoContraste - Nuevo estado del alto contraste.
     * @returns {Configuracion} Copia con el contraste cambiado.
     */
    conAltoContraste(altoContraste) {
        return new Configuracion({ ...this, altoContraste });
    }

    /**
     * @param {boolean} sonido - Nuevo estado del sonido.
     * @returns {Configuracion} Copia con el sonido cambiado.
     */
    conSonido(sonido) {
        return new Configuracion({ ...this, sonido });
    }
}
