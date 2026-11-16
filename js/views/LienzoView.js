/**
 * @file LienzoView.js
 * @capa Vista
 * @resumen Renderizado con Canvas API: fondo, estrellas, enemigos, nave, balas, nodriza y partículas.
 * @depende JuegoModel (solo ESTADOS), Mundo
 * @usadoPor app.js, AppController
 *
 * Reglas de la capa:
 *  - Solo LEE el modelo (nunca lo modifica ni decide nada del juego).
 *  - Los colores NO se escriben aquí: se leen del CSS (`variables.css`) mediante
 *    un elemento "sonda" (`releerColores`), así hay un único punto de verdad
 *    para la estrategia cromática y el canvas cambia con la paleta.
 *  - El dibujo es procedural (formas con la Canvas API), sin imágenes.
 *  - Las partículas y las estrellas son efectos puramente visuales: viven aquí,
 *    no en el modelo, y se desactivan con `prefers-reduced-motion`.
 */

import { ESTADOS } from "../models/JuegoModel.js";
import { MUNDO } from "../models/Mundo.js";

/** Nombres de los tokens de color que se leen del CSS (`--color-<nombre>`). */
const COLORES = Object.freeze([
    "fondo", "estrella", "nave", "bala", "bala-enemiga", "enemigo-0", "enemigo-1", "enemigo-2", "bonus",
]);
const NUMERO_ESTRELLAS = 48;
const MAX_PARTICULAS = 200;
/** Partículas por explosión. */
const PARTICULAS_POR_EXPLOSION = 14;

export class LienzoView {
    /** @type {HTMLCanvasElement} */
    #lienzo;
    /** @type {CanvasRenderingContext2D} */
    #ctx;
    /** @type {HTMLElement} Elemento oculto usado para resolver colores CSS a `rgb()`. */
    #sonda;
    /** @type {Record<string,string>} Colores ya resueltos, por nombre. */
    #colores = {};
    /** @type {{x:number,y:number,capa:number}[]} Estrellas del fondo (posiciones lógicas). */
    #estrellas = [];
    /** @type {{x:number,y:number,vx:number,vy:number,vida:number,color:string}[]} */
    #particulas = [];
    /** @type {boolean} Preferencia del sistema: sin animaciones decorativas. */
    #movimientoReducido;
    /** @type {number|null} Instante del fotograma anterior, para calcular dt de los efectos. */
    #instanteAnterior = null;

    /**
     * Prepara el canvas, la sonda de color y el reescalado automático.
     * @param {HTMLCanvasElement} lienzo - Canvas `[data-lienzo]`.
     */
    constructor(lienzo) {
        this.#lienzo = lienzo;
        this.#ctx = lienzo.getContext("2d");
        this.#movimientoReducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        this.#sonda = document.createElement("span");
        this.#sonda.classList.add("sonda");
        this.#sonda.hidden = true;
        lienzo.parentElement.appendChild(this.#sonda);

        this.#generarEstrellas();
        this.releerColores();
        new ResizeObserver(() => this.#ajustarResolucion()).observe(lienzo);
        this.#ajustarResolucion();
    }

    /**
     * Vuelve a leer los colores del CSS. Hay que llamarlo tras cambiar de paleta
     * o de contraste, porque esos cambios alteran las variables CSS.
     * @returns {void}
     */
    releerColores() {
        COLORES.forEach((nombre) => {
            this.#sonda.style.setProperty("--sonda", `var(--color-${nombre})`);
            this.#colores[nombre] = getComputedStyle(this.#sonda).color;
        });
    }

    /**
     * Da el foco al canvas para que las teclas de juego funcionen.
     * @returns {void}
     */
    enfocar() {
        this.#lienzo.focus();
    }

    /**
     * Actualiza la descripción accesible del canvas (un canvas es opaco para lectores de pantalla).
     * @param {{puntos:number, vidas:number, oleada:number, estado:string}} datos - Estado resumido de la partida.
     * @returns {void}
     */
    describir({ puntos, vidas, oleada, estado }) {
        this.#lienzo.setAttribute(
            "aria-label",
            `Zona de juego del matamarcianos. Estado: ${estado}. Puntos: ${puntos}. Vidas: ${vidas}. Oleada: ${oleada}.`,
        );
    }

    /**
     * Crea una explosión de partículas en una posición del mundo.
     * @param {{x:number, y:number, tipo:number|string}} destruccion - Datos del evento "destruccion" del modelo.
     * @returns {void}
     */
    explosion({ x, y, tipo }) {
        if (this.#movimientoReducido) {
            return;
        }
        const color = tipo === "nodriza" ? this.#colores.bonus : this.#colores[`enemigo-${tipo}`];
        for (let i = 0; i < PARTICULAS_POR_EXPLOSION && this.#particulas.length < MAX_PARTICULAS; i += 1) {
            const angulo = (Math.PI * 2 * i) / PARTICULAS_POR_EXPLOSION;
            const velocidad = 60 + Math.random() * 90;
            this.#particulas.push({
                x, y, vx: Math.cos(angulo) * velocidad, vy: Math.sin(angulo) * velocidad, vida: 0.5, color,
            });
        }
    }

    /**
     * Dibuja un fotograma completo. Se llama una vez por `requestAnimationFrame`.
     * @param {import("../models/JuegoModel.js").JuegoModel} modelo - Modelo del que se lee el estado.
     * @param {number} instante - Marca de tiempo del fotograma (ms).
     * @returns {void}
     */
    pintar(modelo, instante) {
        const dt = this.#instanteAnterior === null ? 0 : Math.min((instante - this.#instanteAnterior) / 1000, 0.1);
        this.#instanteAnterior = instante;
        const jugando = modelo.estado === ESTADOS.JUGANDO;
        const dtEfectos = jugando ? dt : 0;
        const ctx = this.#ctx;
        const escala = this.#lienzo.width / MUNDO.ancho;

        ctx.setTransform(escala, 0, 0, escala, 0, 0);
        ctx.fillStyle = this.#colores.fondo;
        ctx.fillRect(0, 0, MUNDO.ancho, MUNDO.alto);

        this.#pintarEstrellas(dtEfectos);
        this.#pintarNodriza(modelo.nodriza);
        modelo.enemigos.forEach((enemigo) => this.#pintarEnemigo(enemigo));
        modelo.balasJugador.forEach((bala) => this.#pintarBalaJugador(bala));
        modelo.balasEnemigas.forEach((bala) => this.#pintarBalaEnemiga(bala));
        this.#pintarNave(modelo.nave, instante);
        this.#pintarParticulas(dtEfectos);
    }

    /**
     * Adapta la resolución interna del canvas a su tamaño en pantalla y a la
     * densidad de píxeles, para que el dibujo no salga borroso en pantallas HiDPI.
     * @returns {void}
     */
    #ajustarResolucion() {
        const proporcion = window.devicePixelRatio || 1;
        const ancho = Math.max(1, Math.round(this.#lienzo.clientWidth * proporcion));
        this.#lienzo.width = ancho;
        this.#lienzo.height = Math.round((ancho * MUNDO.alto) / MUNDO.ancho);
    }

    /**
     * Genera estrellas con un generador congruencial fijo, para que el fondo sea
     * idéntico en cada carga y no dependa de `Math.random`.
     * @returns {void}
     */
    #generarEstrellas() {
        let semilla = 7;
        const siguiente = () => {
            semilla = (semilla * 16807) % 2147483647;
            return semilla / 2147483647;
        };
        this.#estrellas = Array.from({ length: NUMERO_ESTRELLAS }, () => ({
            x: siguiente() * MUNDO.ancho,
            y: siguiente() * MUNDO.alto,
            capa: 1 + Math.floor(siguiente() * 3),
        }));
    }

    /**
     * Dibuja las estrellas; las capas más cercanas (mayor número) se mueven más rápido (parallax).
     * @param {number} dt - Segundos a avanzar (0 si no se juega o hay movimiento reducido).
     * @returns {void}
     */
    #pintarEstrellas(dt) {
        const ctx = this.#ctx;
        ctx.fillStyle = this.#colores.estrella;
        this.#estrellas.forEach((estrella) => {
            if (!this.#movimientoReducido) {
                estrella.y = (estrella.y + estrella.capa * 12 * dt) % MUNDO.alto;
            }
            ctx.fillRect(estrella.x, estrella.y, estrella.capa, estrella.capa);
        });
    }

    /**
     * Dibuja un enemigo con la silueta de su tipo: círculo, triángulo o rombo.
     * @param {import("../models/Enemigo.js").Enemigo} enemigo - Enemigo a dibujar.
     * @returns {void}
     */
    #pintarEnemigo(enemigo) {
        const ctx = this.#ctx;
        const { x, y, ancho, alto, centroX, centroY } = enemigo;
        ctx.fillStyle = this.#colores[`enemigo-${enemigo.tipo}`];
        ctx.beginPath();
        if (enemigo.tipo === 0) {
            ctx.ellipse(centroX, centroY, ancho / 2, alto / 2, 0, 0, Math.PI * 2);
        } else if (enemigo.tipo === 1) {
            ctx.moveTo(x, y);
            ctx.lineTo(x + ancho, y);
            ctx.lineTo(centroX, y + alto);
        } else {
            ctx.moveTo(centroX, y);
            ctx.lineTo(x + ancho, centroY);
            ctx.lineTo(centroX, y + alto);
            ctx.lineTo(x, centroY);
        }
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Dibuja la nave del jugador; parpadea (o se atenúa con movimiento reducido) mientras es invulnerable.
     * @param {import("../models/Nave.js").Nave} nave - Nave del jugador.
     * @param {number} instante - Marca de tiempo del fotograma (ms), para el parpadeo.
     * @returns {void}
     */
    #pintarNave(nave, instante) {
        const ctx = this.#ctx;
        if (nave.invulnerable) {
            ctx.globalAlpha = this.#movimientoReducido ? 0.5 : (Math.floor(instante / 100) % 2 === 0 ? 1 : 0.3);
        }
        ctx.fillStyle = this.#colores.nave;
        ctx.beginPath();
        ctx.moveTo(nave.centroX, nave.y);
        ctx.lineTo(nave.x + nave.ancho, nave.y + nave.alto);
        ctx.lineTo(nave.x, nave.y + nave.alto);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = this.#colores.fondo;
        ctx.fillRect(nave.centroX - 2, nave.y + 10, 4, 8);
        ctx.globalAlpha = 1;
    }

    /**
     * Dibuja la nodriza bonus (elipse con cúpula), si hay una en pantalla.
     * @param {import("../models/Nodriza.js").Nodriza|null} nodriza - Nodriza o `null`.
     * @returns {void}
     */
    #pintarNodriza(nodriza) {
        if (!nodriza) {
            return;
        }
        const ctx = this.#ctx;
        ctx.fillStyle = this.#colores.bonus;
        ctx.beginPath();
        ctx.ellipse(nodriza.centroX, nodriza.centroY + 3, nodriza.ancho / 2, nodriza.alto / 2 - 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(nodriza.centroX, nodriza.centroY, 9, Math.PI, 0);
        ctx.fill();
    }

    /**
     * Dibuja una bala de la nave: rectángulo vertical.
     * @param {import("../models/Bala.js").Bala} bala - Bala a dibujar.
     * @returns {void}
     */
    #pintarBalaJugador(bala) {
        this.#ctx.fillStyle = this.#colores.bala;
        this.#ctx.fillRect(bala.x, bala.y, bala.ancho, bala.alto);
    }

    /**
     * Dibuja una bala enemiga como rombo alargado: distinta forma y color que la
     * del jugador, para no depender solo del color.
     * @param {import("../models/Bala.js").Bala} bala - Bala a dibujar.
     * @returns {void}
     */
    #pintarBalaEnemiga(bala) {
        const ctx = this.#ctx;
        ctx.fillStyle = this.#colores["bala-enemiga"];
        ctx.beginPath();
        ctx.moveTo(bala.centroX, bala.y);
        ctx.lineTo(bala.x + bala.ancho + 2, bala.centroY);
        ctx.lineTo(bala.centroX, bala.y + bala.alto);
        ctx.lineTo(bala.x - 2, bala.centroY);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Actualiza y dibuja las partículas de las explosiones; descarta las que se agotan.
     * @param {number} dt - Segundos a avanzar (0 en pausa).
     * @returns {void}
     */
    #pintarParticulas(dt) {
        const ctx = this.#ctx;
        this.#particulas = this.#particulas.filter((p) => p.vida > 0);
        this.#particulas.forEach((p) => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vida -= dt;
            ctx.globalAlpha = Math.max(0, p.vida / 0.5);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
        });
        ctx.globalAlpha = 1;
    }
}
