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
 * Parámetros de juego de los TRES NIVELES DE REFERENCIA. La dificultad real es
 * continua (0 a 100) y se interpola entre estos tres puntos: Fácil = 0,
 * Normal = 50 y Difícil = 100.
 * - vidas: vidas iniciales de la nave.
 * - factorVelocidad: multiplicador de la velocidad de la formación enemiga.
 * - intervaloDisparo: segundos medios entre disparos enemigos.
 */
export const DIFICULTADES = Object.freeze({
    facil: Object.freeze({ vidas: 5, factorVelocidad: 0.8, intervaloDisparo: 1.6 }),
    normal: Object.freeze({ vidas: 3, factorVelocidad: 1, intervaloDisparo: 1.1 }),
    dificil: Object.freeze({ vidas: 2, factorVelocidad: 1.3, intervaloDisparo: 0.7 }),
});

/** Valor mínimo (Fácil) de la dificultad continua. */
export const DIFICULTAD_MIN = 0;
/** Valor máximo (Difícil) de la dificultad continua. */
export const DIFICULTAD_MAX = 100;
/** Valor por defecto (Normal) de la dificultad continua. */
export const DIFICULTAD_DEFECTO = 50;
/** Por debajo de este valor la dificultad se etiqueta como "fácil". */
const UMBRAL_FACIL = 34;
/** Desde este valor la dificultad se etiqueta como "difícil". */
const UMBRAL_DIFICIL = 67;

/**
 * Calcula los parámetros de juego de una dificultad continua, interpolando
 * linealmente entre los niveles de referencia. Las vidas se redondean porque
 * no puede haber media vida.
 * @param {number} valor - Dificultad de 0 (Fácil) a 100 (Difícil).
 * @returns {{vidas:number, factorVelocidad:number, intervaloDisparo:number}} Parámetros resultantes.
 */
function interpolarParametros(valor) {
    const mitad = (DIFICULTAD_MIN + DIFICULTAD_MAX) / 2;
    const [desde, hasta, t] = valor <= mitad
        ? [DIFICULTADES.facil, DIFICULTADES.normal, (valor - DIFICULTAD_MIN) / (mitad - DIFICULTAD_MIN)]
        : [DIFICULTADES.normal, DIFICULTADES.dificil, (valor - mitad) / (DIFICULTAD_MAX - mitad)];
    const mezclar = (a, b) => a + (b - a) * t;
    return Object.freeze({
        vidas: Math.round(mezclar(desde.vidas, hasta.vidas)),
        factorVelocidad: mezclar(desde.factorVelocidad, hasta.factorVelocidad),
        intervaloDisparo: mezclar(desde.intervaloDisparo, hasta.intervaloDisparo),
    });
}

/** Esquemas de control disponibles (el disparo es siempre la barra espaciadora). */
export const CONTROLES = Object.freeze(["flechas", "wasd"]);

/** Temas de color de la interfaz. */
export const TEMAS = Object.freeze(["oscuro", "claro"]);

export class Configuracion {
    /** @type {number} Dificultad continua, de DIFICULTAD_MIN (Fácil) a DIFICULTAD_MAX (Difícil). */
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
     * @param {{dificultad?:number, controles?:string, tema?:string, altoContraste?:boolean, sonido?:boolean}} [valores]
     * @throws {RangeError} Si algún valor no está permitido.
     */
    constructor({ dificultad = DIFICULTAD_DEFECTO, controles = "flechas", tema = "oscuro", altoContraste = false, sonido = false } = {}) {
        if (!Number.isFinite(dificultad) || dificultad < DIFICULTAD_MIN || dificultad > DIFICULTAD_MAX) {
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
     * @returns {{vidas:number, factorVelocidad:number, intervaloDisparo:number}} Parámetros de la dificultad actual (interpolados).
     */
    get parametros() {
        return interpolarParametros(this.dificultad);
    }

    /**
     * Nombre del tramo en el que cae la dificultad, para etiquetas y colores de la interfaz.
     * @returns {"facil"|"normal"|"dificil"} Tramo de dificultad.
     */
    get nivel() {
        if (this.dificultad < UMBRAL_FACIL) {
            return "facil";
        }
        return this.dificultad < UMBRAL_DIFICIL ? "normal" : "dificil";
    }

    /**
     * @param {number} dificultad - Dificultad continua de 0 (Fácil) a 100 (Difícil).
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
