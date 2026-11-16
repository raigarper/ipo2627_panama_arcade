/**
 * @file JuegoModel.js
 * @capa Modelo
 * @resumen Estado y reglas del matamarcianos: bucle de simulación, física, colisiones, puntuación, oleadas y tamaño del mundo.
 * @depende Bala, Configuracion, Formacion, Mundo, Nave, Nodriza
 * @usadoPor app.js, AppController, LienzoView (solo lectura)
 *
 * Reglas de la capa:
 *  - No toca el DOM, ni el canvas, ni el teclado. Es ejecutable en Node.
 *  - Avisa de lo que ocurre emitiendo eventos (patrón observador):
 *      "cambio"       cambió el estado de la partida o el marcador.
 *      "disparo"      alguien disparó           detail: { propietario }
 *      "destruccion"  algo fue destruido        detail: { x, y, tipo, puntos }
 *      "impacto"      la nave perdió una vida   detail: { vidas }
 *      "oleada"       empieza una oleada nueva  detail: { numero }
 *      "fin"          terminó la partida        detail: { puntos, oleada, motivo }
 *  - La aleatoriedad se inyecta (`aleatorio`) para poder probar el modelo de forma determinista.
 *  - El tamaño del mundo NO es fijo: se adapta a la proporción del canvas
 *    (ver Mundo.js y `redimensionar`) para que el juego ocupe toda la pantalla.
 */

import { Bala, PROPIETARIOS } from "./Bala.js";
import { Configuracion } from "./Configuracion.js";
import { Formacion } from "./Formacion.js";
import { calcularMundo, MUNDO_INICIAL } from "./Mundo.js";
import { Nave } from "./Nave.js";
import { Nodriza, PUNTOS_NODRIZA } from "./Nodriza.js";

/** Estados posibles de la partida. */
export const ESTADOS = Object.freeze({
    INICIAL: "inicial",
    JUGANDO: "jugando",
    PAUSA: "pausa",
    TERMINADO: "terminado",
});

/** Máximo de balas de la nave en pantalla a la vez (obliga a apuntar). */
const MAX_BALAS_JUGADOR = 3;
const VELOCIDAD_BALA_JUGADOR = 520;
const VELOCIDAD_BALA_ENEMIGA = 210;
/** Velocidad horizontal base de la formación, en unidades/s (antes de dificultad y oleada). */
const VELOCIDAD_FORMACION_BASE = 34;
/** Velocidad horizontal de la nodriza, en unidades/s. */
const VELOCIDAD_NODRIZA = 110;
/** Filas de enemigos en la primera oleada (sube una por oleada hasta el máximo). */
const FILAS_INICIALES = 4;

export class JuegoModel extends EventTarget {
    /** @type {() => number} Generador de números en [0,1). */
    #aleatorio;
    /** @type {{ancho:number, alto:number}} Tamaño lógico actual del mundo. */
    #mundo = { ...MUNDO_INICIAL };
    /** @type {string} Uno de ESTADOS. */
    #estado = ESTADOS.INICIAL;
    /** @type {{vidas:number, factorVelocidad:number, intervaloDisparo:number}} Parámetros de la partida en curso. */
    #parametros;
    /** @type {Nave} */
    #nave;
    /** @type {Formacion} */
    #formacion = new Formacion();
    /** @type {Bala[]} */
    #balasJugador = [];
    /** @type {Bala[]} */
    #balasEnemigas = [];
    /** @type {Nodriza|null} */
    #nodriza = null;
    #puntos = 0;
    #oleada = 1;
    /** @type {{izquierda:boolean, derecha:boolean, disparo:boolean}} Acciones que el jugador mantiene pulsadas. */
    #entrada = { izquierda: false, derecha: false, disparo: false };
    /** Segundos hasta el próximo disparo enemigo. */
    #relojDisparoEnemigo = 0;
    /** Segundos hasta que aparezca la próxima nodriza. */
    #relojNodriza = 0;

    /**
     * Prepara una partida en estado inicial (la formación se ve, pero no se mueve hasta `iniciar`).
     * @param {{vidas:number, factorVelocidad:number, intervaloDisparo:number}} [parametros] - Parámetros de dificultad.
     * @param {() => number} [aleatorio] - Generador aleatorio (inyectable para pruebas).
     */
    constructor(parametros = new Configuracion().parametros, aleatorio = Math.random) {
        super();
        this.#aleatorio = aleatorio;
        this.#preparar(parametros);
    }

    /** @returns {string} Estado actual (uno de ESTADOS). */
    get estado() {
        return this.#estado;
    }

    /** @returns {number} Ancho lógico del mundo. */
    get ancho() {
        return this.#mundo.ancho;
    }

    /** @returns {number} Alto lógico del mundo. */
    get alto() {
        return this.#mundo.alto;
    }

    /** @returns {Nave} Nave del jugador (solo lectura para las vistas). */
    get nave() {
        return this.#nave;
    }

    /** @returns {import("./Enemigo.js").Enemigo[]} Enemigos vivos. */
    get enemigos() {
        return this.#formacion.enemigos;
    }

    /** @returns {Bala[]} Balas de la nave. */
    get balasJugador() {
        return this.#balasJugador;
    }

    /** @returns {Bala[]} Balas enemigas. */
    get balasEnemigas() {
        return this.#balasEnemigas;
    }

    /** @returns {Nodriza|null} Nodriza bonus en pantalla, o `null`. */
    get nodriza() {
        return this.#nodriza;
    }

    /** @returns {number} Puntuación actual. */
    get puntos() {
        return this.#puntos;
    }

    /** @returns {number} Número de oleada actual (empieza en 1). */
    get oleada() {
        return this.#oleada;
    }

    /** @returns {number} Vidas restantes de la nave. */
    get vidas() {
        return this.#nave.vidas;
    }

    /** @returns {number} Vidas con las que empezó la partida (para dibujar corazones llenos y vacíos). */
    get vidasIniciales() {
        return this.#parametros.vidas;
    }

    /**
     * Adapta el mundo a la proporción del canvas para que el juego ocupe toda
     * la pantalla. Recoloca la nave y la formación y descarta lo que quede fuera.
     * @param {number} proporcion - Ancho dividido por alto del canvas, en píxeles.
     * @returns {void}
     */
    redimensionar(proporcion) {
        const nuevo = calcularMundo(proporcion);
        if (nuevo.ancho === this.#mundo.ancho && nuevo.alto === this.#mundo.alto) {
            return;
        }
        this.#mundo = nuevo;
        this.#nave.colocar(nuevo.ancho, nuevo.alto, this.#estado === ESTADOS.INICIAL);
        if (this.#estado === ESTADOS.INICIAL) {
            // Aún no se juega: la formación se regenera para aprovechar el ancho nuevo.
            this.#formacion.crear(FILAS_INICIALES, nuevo.ancho);
        } else {
            this.#formacion.ajustar(nuevo.ancho);
        }
        this.#balasJugador = this.#balasJugador.filter((bala) => !bala.estaFuera(nuevo.alto));
        this.#balasEnemigas = this.#balasEnemigas.filter((bala) => !bala.estaFuera(nuevo.alto));
        if (this.#nodriza?.estaFuera(nuevo.ancho)) {
            this.#nodriza = null;
        }
    }

    /**
     * Comienza una partida nueva con los parámetros indicados.
     * @param {{vidas:number, factorVelocidad:number, intervaloDisparo:number}} parametros - Parámetros de dificultad.
     * @returns {void}
     */
    iniciar(parametros) {
        this.#preparar(parametros);
        this.#estado = ESTADOS.JUGANDO;
        this.#notificar();
    }

    /**
     * Pausa la partida (solo si está en marcha).
     * @returns {void}
     */
    pausar() {
        if (this.#estado === ESTADOS.JUGANDO) {
            this.liberarEntrada();
            this.#estado = ESTADOS.PAUSA;
            this.#notificar();
        }
    }

    /**
     * Reanuda la partida (solo si está en pausa).
     * @returns {void}
     */
    reanudar() {
        if (this.#estado === ESTADOS.PAUSA) {
            this.#estado = ESTADOS.JUGANDO;
            this.#notificar();
        }
    }

    /**
     * Termina la partida (por abandono, por quedarse sin vidas o por invasión).
     * @param {string} [motivo] - "abandono", "vidas" o "invasion".
     * @returns {void}
     */
    finalizar(motivo = "abandono") {
        if (this.#estado !== ESTADOS.JUGANDO && this.#estado !== ESTADOS.PAUSA) {
            return;
        }
        this.liberarEntrada();
        this.#estado = ESTADOS.TERMINADO;
        this.#emitir("fin", { puntos: this.#puntos, oleada: this.#oleada, motivo });
        this.#notificar();
    }

    /**
     * Registra si una acción del jugador está pulsada o suelta.
     * @param {string} accion - "izquierda", "derecha" o "disparo".
     * @param {boolean} activa - `true` al pulsar, `false` al soltar.
     * @returns {void}
     */
    establecerEntrada(accion, activa) {
        if (accion in this.#entrada) {
            this.#entrada[accion] = activa;
        }
    }

    /**
     * Suelta todas las acciones (al pausar, perder el foco o terminar), para que
     * la nave no siga moviéndose "sola" con una tecla que ya no está pulsada.
     * @returns {void}
     */
    liberarEntrada() {
        this.#entrada.izquierda = false;
        this.#entrada.derecha = false;
        this.#entrada.disparo = false;
    }

    /**
     * Avanza la simulación un paso fijo. Orden: entrada → movimiento → disparos
     * enemigos → colisiones → fin de oleada. No hace nada si no se está jugando.
     * @param {number} dt - Duración del paso, en segundos.
     * @returns {void}
     */
    actualizar(dt) {
        if (this.#estado !== ESTADOS.JUGANDO) {
            return;
        }
        this.#moverNave(dt);
        this.#moverBalas(dt);
        this.#formacion.avanzar(
            dt,
            VELOCIDAD_FORMACION_BASE * this.#parametros.factorVelocidad * (1 + 0.12 * (this.#oleada - 1)),
            this.#mundo.ancho,
        );
        this.#dispararEnemigos(dt);
        this.#moverNodriza(dt);
        this.#resolverColisiones();
        if (this.#estado === ESTADOS.JUGANDO) {
            this.#comprobarInvasion();
        }
        if (this.#estado === ESTADOS.JUGANDO && this.#formacion.cantidad === 0) {
            this.#siguienteOleada();
        }
    }

    /**
     * Deja todo el estado listo para una partida nueva.
     * @param {{vidas:number, factorVelocidad:number, intervaloDisparo:number}} parametros - Parámetros de dificultad.
     * @returns {void}
     */
    #preparar(parametros) {
        this.#parametros = parametros;
        this.#nave = new Nave(parametros.vidas, this.#mundo.ancho, this.#mundo.alto);
        this.#balasJugador = [];
        this.#balasEnemigas = [];
        this.#nodriza = null;
        this.#puntos = 0;
        this.#oleada = 1;
        this.liberarEntrada();
        this.#formacion.crear(FILAS_INICIALES, this.#mundo.ancho);
        this.#relojDisparoEnemigo = parametros.intervaloDisparo;
        this.#relojNodriza = 12 + this.#aleatorio() * 8;
        this.#estado = ESTADOS.INICIAL;
    }

    /**
     * Mueve la nave según la entrada y dispara si procede.
     * @param {number} dt - Segundos del paso.
     * @returns {void}
     */
    #moverNave(dt) {
        const nave = this.#nave;
        nave.avanzarTiempo(dt);
        const direccion = (this.#entrada.derecha ? 1 : 0) - (this.#entrada.izquierda ? 1 : 0);
        nave.mover(direccion, dt, this.#mundo.ancho);

        if (this.#entrada.disparo && nave.puedeDisparar && this.#balasJugador.length < MAX_BALAS_JUGADOR) {
            this.#balasJugador.push(new Bala(nave.centroX, nave.y - Bala.ALTO, -VELOCIDAD_BALA_JUGADOR, PROPIETARIOS.JUGADOR));
            nave.registrarDisparo();
            this.#emitir("disparo", { propietario: PROPIETARIOS.JUGADOR });
        }
    }

    /**
     * Avanza todas las balas y descarta las que salieron del mundo.
     * @param {number} dt - Segundos del paso.
     * @returns {void}
     */
    #moverBalas(dt) {
        this.#balasJugador.forEach((bala) => bala.mover(dt));
        this.#balasEnemigas.forEach((bala) => bala.mover(dt));
        this.#balasJugador = this.#balasJugador.filter((bala) => !bala.estaFuera(this.#mundo.alto));
        this.#balasEnemigas = this.#balasEnemigas.filter((bala) => !bala.estaFuera(this.#mundo.alto));
    }

    /**
     * Cuenta atrás del disparo enemigo; al llegar a cero dispara el enemigo más
     * bajo de una columna elegida al azar. La frecuencia sube con la oleada.
     * @param {number} dt - Segundos del paso.
     * @returns {void}
     */
    #dispararEnemigos(dt) {
        this.#relojDisparoEnemigo -= dt;
        if (this.#relojDisparoEnemigo > 0) {
            return;
        }
        const candidatos = this.#formacion.inferiores();
        if (candidatos.length > 0) {
            const tirador = candidatos[Math.floor(this.#aleatorio() * candidatos.length)];
            this.#balasEnemigas.push(new Bala(tirador.centroX, tirador.y + tirador.alto, VELOCIDAD_BALA_ENEMIGA, PROPIETARIOS.ENEMIGO));
            this.#emitir("disparo", { propietario: PROPIETARIOS.ENEMIGO });
        }
        const intervalo = this.#parametros.intervaloDisparo / (1 + 0.08 * (this.#oleada - 1));
        this.#relojDisparoEnemigo = intervalo * (0.6 + 0.8 * this.#aleatorio());
    }

    /**
     * Gestiona la aparición, el movimiento y la salida de la nodriza bonus.
     * @param {number} dt - Segundos del paso.
     * @returns {void}
     */
    #moverNodriza(dt) {
        if (this.#nodriza) {
            this.#nodriza.mover(dt);
            if (this.#nodriza.estaFuera(this.#mundo.ancho)) {
                this.#nodriza = null;
            }
            return;
        }
        this.#relojNodriza -= dt;
        if (this.#relojNodriza <= 0) {
            const haciaLaDerecha = this.#aleatorio() < 0.5;
            this.#nodriza = haciaLaDerecha
                ? new Nodriza(-Nodriza.ANCHO, VELOCIDAD_NODRIZA)
                : new Nodriza(this.#mundo.ancho, -VELOCIDAD_NODRIZA);
            this.#relojNodriza = 15 + this.#aleatorio() * 10;
        }
    }

    /**
     * Resuelve las colisiones: balas de la nave contra enemigos y nodriza, y
     * balas enemigas contra la nave.
     * @returns {void}
     */
    #resolverColisiones() {
        for (const bala of [...this.#balasJugador]) {
            const enemigo = this.#formacion.enemigos.find((e) => e.solapaCon(bala));
            if (enemigo) {
                this.#balasJugador = this.#balasJugador.filter((b) => b !== bala);
                this.#formacion.retirar(enemigo);
                this.#sumarPuntos(enemigo.puntos);
                this.#emitir("destruccion", { x: enemigo.centroX, y: enemigo.centroY, tipo: enemigo.tipo, puntos: enemigo.puntos });
            } else if (this.#nodriza && this.#nodriza.solapaCon(bala)) {
                this.#balasJugador = this.#balasJugador.filter((b) => b !== bala);
                this.#emitir("destruccion", { x: this.#nodriza.centroX, y: this.#nodriza.centroY, tipo: "nodriza", puntos: PUNTOS_NODRIZA });
                this.#nodriza = null;
                this.#sumarPuntos(PUNTOS_NODRIZA);
            }
        }

        for (const bala of [...this.#balasEnemigas]) {
            if (!bala.solapaCon(this.#nave)) {
                continue;
            }
            this.#balasEnemigas = this.#balasEnemigas.filter((b) => b !== bala);
            if (this.#nave.recibirImpacto()) {
                this.#emitir("impacto", { vidas: this.#nave.vidas });
                this.#notificar();
                if (this.#nave.vidas <= 0) {
                    this.finalizar("vidas");
                    return;
                }
            }
        }
    }

    /**
     * La partida termina si algún enemigo toca la nave o llega a su altura.
     * @returns {void}
     */
    #comprobarInvasion() {
        const tocaNave = this.#formacion.enemigos.some((e) => e.solapaCon(this.#nave));
        if (tocaNave || this.#formacion.limiteInferior >= this.#nave.y) {
            this.finalizar("invasion");
        }
    }

    /**
     * Pasa a la oleada siguiente: más filas (hasta el máximo) y más velocidad.
     * @returns {void}
     */
    #siguienteOleada() {
        this.#oleada += 1;
        this.#balasEnemigas = [];
        this.#formacion.crear(FILAS_INICIALES + this.#oleada - 1, this.#mundo.ancho);
        this.#emitir("oleada", { numero: this.#oleada });
        this.#notificar();
    }

    /**
     * Suma puntos y avisa del cambio de marcador.
     * @param {number} cantidad - Puntos a sumar.
     * @returns {void}
     */
    #sumarPuntos(cantidad) {
        this.#puntos += cantidad;
        this.#notificar();
    }

    /**
     * Emite el evento "cambio" (estado o marcador modificado).
     * @returns {void}
     */
    #notificar() {
        this.#emitir("cambio", null);
    }

    /**
     * Emite un evento propio del juego.
     * @param {string} tipo - Nombre del evento.
     * @param {object|null} detalle - Datos del evento.
     * @returns {void}
     */
    #emitir(tipo, detalle) {
        this.dispatchEvent(new CustomEvent(tipo, { detail: detalle }));
    }
}
