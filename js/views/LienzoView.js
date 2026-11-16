/**
 * @file LienzoView.js
 * @capa Vista
 * @resumen Renderizado con Canvas API a pantalla completa: fondo, estrellas, sprites clásicos, balas, partículas y suelo.
 * @depende JuegoModel (solo ESTADOS), sprites
 * @usadoPor app.js, AppController
 *
 * Reglas de la capa:
 *  - Solo LEE el modelo (nunca lo modifica ni decide nada del juego).
 *  - Los colores NO se escriben aquí: se leen del CSS (`variables.css`) mediante
 *    un elemento "sonda" (`releerColores`), así hay un único punto de verdad
 *    para la estrategia cromática y el canvas cambia con el tema.
 *  - Los sprites son bitmaps (sprites.js) que se pre-renderizan a lienzos
 *    pequeños y se escalan SIN suavizado: píxeles nítidos, estilo arcade.
 *  - El canvas ocupa todo su contenedor. El tamaño lógico del mundo lo decide
 *    el modelo a partir de la proporción del canvas (`alRedimensionar`); si la
 *    proporción no coincide exactamente, se centra el mundo y el fondo rellena el resto.
 *  - Las partículas y las estrellas son efectos puramente visuales: viven aquí,
 *    no en el modelo, y se desactivan con `prefers-reduced-motion`.
 */

import { ESTADOS } from "../models/JuegoModel.js";
import { SPRITES } from "./sprites.js";

/** Nombres de los tokens de color que se leen del CSS (`--color-<nombre>`). */
const COLORES = Object.freeze([
    "juego-a", "juego-b", "estrella", "nave", "bala", "bala-enemiga",
    "enemigo-0", "enemigo-1", "enemigo-2", "bonus", "suelo",
]);
/** Token de color con el que se pinta cada sprite del canvas. */
const COLOR_SPRITE = Object.freeze({
    enemigo0: "enemigo-0",
    enemigo1: "enemigo-1",
    enemigo2: "enemigo-2",
    nave: "nave",
    nodriza: "bonus",
});
const NUMERO_ESTRELLAS = 90;
const MAX_PARTICULAS = 240;
/** Partículas por explosión. */
const PARTICULAS_POR_EXPLOSION = 16;
/** Duración de una partícula, en segundos. */
const VIDA_PARTICULA = 0.55;
/** Distancia entre el borde inferior del mundo y la línea del suelo. */
const ALTURA_SUELO = 20;
/** Fotogramas de animación por segundo de los enemigos (2 cuadros: 2 cambios/s). */
const CAMBIOS_POR_SEGUNDO = 2;

export class LienzoView {
    /** @type {HTMLCanvasElement} */
    #lienzo;
    /** @type {CanvasRenderingContext2D} */
    #ctx;
    /** @type {{alRedimensionar:(proporcion:number)=>void}} */
    #callbacks;
    /** @type {HTMLElement} Elemento oculto usado para resolver colores CSS a `rgb()`. */
    #sonda;
    /** @type {Record<string,string>} Colores ya resueltos, por nombre. */
    #colores = {};
    /** @type {Record<string, HTMLCanvasElement[]>} Sprites pre-renderizados (un lienzo por fotograma). */
    #sprites = {};
    /** @type {{u:number,v:number,capa:number}[]} Estrellas con posición normalizada (0 a 1). */
    #estrellas = [];
    /** @type {{x:number,y:number,vx:number,vy:number,vida:number,color:string}[]} */
    #particulas = [];
    /** @type {boolean} Preferencia del sistema: sin animaciones decorativas. */
    #movimientoReducido;
    /** @type {number|null} Instante del fotograma anterior, para calcular dt de los efectos. */
    #instanteAnterior = null;
    /** @type {number} Tiempo de animación acumulado mientras se juega (s): mueve estrellas y cuadros. */
    #reloj = 0;

    /**
     * Prepara el canvas, la sonda de color y el reescalado automático.
     * @param {HTMLCanvasElement} lienzo - Canvas `[data-lienzo]`.
     * @param {{alRedimensionar:(proporcion:number)=>void}} callbacks - Aviso al controlador del tamaño del canvas.
     */
    constructor(lienzo, callbacks) {
        this.#lienzo = lienzo;
        this.#ctx = lienzo.getContext("2d");
        this.#callbacks = callbacks;
        this.#movimientoReducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        this.#sonda = document.createElement("span");
        this.#sonda.classList.add("sonda");
        this.#sonda.hidden = true;
        lienzo.parentElement.appendChild(this.#sonda);

        this.#generarEstrellas();
        this.releerColores();
        new ResizeObserver(() => this.medir()).observe(lienzo);
    }

    /**
     * Adapta la resolución interna del canvas a su tamaño en pantalla y a la
     * densidad de píxeles (para que no salga borroso en pantallas HiDPI) y
     * avisa de la nueva proporción para que el modelo ajuste el mundo.
     * @returns {void}
     */
    medir() {
        const proporcion = window.devicePixelRatio || 1;
        const ancho = Math.round(this.#lienzo.clientWidth * proporcion);
        const alto = Math.round(this.#lienzo.clientHeight * proporcion);
        if (ancho < 1 || alto < 1) {
            return;
        }
        this.#lienzo.width = ancho;
        this.#lienzo.height = alto;
        this.#callbacks.alRedimensionar(ancho / alto);
    }

    /**
     * Vuelve a leer los colores del CSS y regenera los sprites. Hay que
     * llamarlo tras cambiar de tema o de contraste, porque esos cambios
     * alteran las variables CSS.
     * @returns {void}
     */
    releerColores() {
        COLORES.forEach((nombre) => {
            this.#sonda.style.setProperty("--sonda", `var(--color-${nombre})`);
            this.#colores[nombre] = getComputedStyle(this.#sonda).color;
        });
        this.#prerenderizar();
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
            const velocidad = 60 + Math.random() * 100;
            this.#particulas.push({
                x, y, vx: Math.cos(angulo) * velocidad, vy: Math.sin(angulo) * velocidad, vida: VIDA_PARTICULA, color,
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
        const dtEfectos = modelo.estado === ESTADOS.JUGANDO ? dt : 0;
        this.#reloj += dtEfectos;

        const ctx = this.#ctx;
        const anchoPx = this.#lienzo.width;
        const altoPx = this.#lienzo.height;
        const escala = Math.min(anchoPx / modelo.ancho, altoPx / modelo.alto);
        const desplazamientoX = (anchoPx - modelo.ancho * escala) / 2;
        const desplazamientoY = (altoPx - modelo.alto * escala) / 2;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const degradado = ctx.createLinearGradient(0, 0, 0, altoPx);
        degradado.addColorStop(0, this.#colores["juego-a"]);
        degradado.addColorStop(1, this.#colores["juego-b"]);
        ctx.fillStyle = degradado;
        ctx.fillRect(0, 0, anchoPx, altoPx);

        ctx.setTransform(escala, 0, 0, escala, desplazamientoX, desplazamientoY);
        ctx.imageSmoothingEnabled = false;

        this.#pintarEstrellas(modelo);
        this.#pintarSuelo(modelo);
        this.#pintarNodriza(modelo.nodriza);
        const cuadro = this.#movimientoReducido ? 0 : Math.floor(this.#reloj * CAMBIOS_POR_SEGUNDO) % 2;
        modelo.enemigos.forEach((enemigo) => this.#pintarSprite(`enemigo${enemigo.tipo}`, cuadro, enemigo));
        modelo.balasJugador.forEach((bala) => this.#pintarBalaJugador(bala));
        modelo.balasEnemigas.forEach((bala) => this.#pintarBalaEnemiga(bala, cuadro));
        this.#pintarNave(modelo.nave, instante);
        this.#pintarParticulas(dtEfectos);
    }

    /**
     * Pre-renderiza cada fotograma de cada sprite a un lienzo de 1 píxel por
     * celda, con el color actual. Después se escala con `drawImage` sin
     * suavizado, lo que es mucho más rápido que dibujar celda a celda y evita
     * costuras entre píxeles.
     * @returns {void}
     */
    #prerenderizar() {
        this.#sprites = {};
        Object.entries(COLOR_SPRITE).forEach(([nombre, color]) => {
            this.#sprites[nombre] = SPRITES[nombre].map((fotograma) => this.#crearBitmap(fotograma, this.#colores[color]));
        });
    }

    /**
     * Dibuja un fotograma de sprite en un lienzo de 1 píxel por celda.
     * @param {string[]} fotograma - Filas del fotograma (`X` relleno).
     * @param {string} color - Color CSS ya resuelto.
     * @returns {HTMLCanvasElement} Lienzo pequeño con el sprite.
     */
    #crearBitmap(fotograma, color) {
        const bitmap = document.createElement("canvas");
        bitmap.width = fotograma[0].length;
        bitmap.height = fotograma.length;
        const ctx = bitmap.getContext("2d");
        ctx.fillStyle = color;
        fotograma.forEach((fila, y) => {
            for (let x = 0; x < fila.length; x += 1) {
                if (fila[x] === "X") {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        });
        return bitmap;
    }

    /**
     * Genera estrellas con un generador congruencial fijo, para que el fondo sea
     * idéntico en cada carga y no dependa de `Math.random`. Las posiciones son
     * normalizadas, así valen para cualquier tamaño de mundo.
     * @returns {void}
     */
    #generarEstrellas() {
        let semilla = 7;
        const siguiente = () => {
            semilla = (semilla * 16807) % 2147483647;
            return semilla / 2147483647;
        };
        this.#estrellas = Array.from({ length: NUMERO_ESTRELLAS }, () => ({
            u: siguiente(),
            v: siguiente(),
            capa: 1 + Math.floor(siguiente() * 3),
        }));
    }

    /**
     * Dibuja las estrellas; las capas más cercanas (mayor número) se mueven más rápido (parallax).
     * @param {import("../models/JuegoModel.js").JuegoModel} modelo - Para conocer el tamaño del mundo.
     * @returns {void}
     */
    #pintarEstrellas(modelo) {
        const ctx = this.#ctx;
        ctx.fillStyle = this.#colores.estrella;
        this.#estrellas.forEach((estrella) => {
            const y = (estrella.v * modelo.alto + this.#reloj * estrella.capa * 10) % modelo.alto;
            ctx.fillRect(Math.round(estrella.u * modelo.ancho), Math.round(y), estrella.capa, estrella.capa);
        });
    }

    /**
     * Dibuja la línea del suelo, bajo la nave.
     * @param {import("../models/JuegoModel.js").JuegoModel} modelo - Para conocer el tamaño del mundo.
     * @returns {void}
     */
    #pintarSuelo(modelo) {
        this.#ctx.fillStyle = this.#colores.suelo;
        this.#ctx.fillRect(0, modelo.alto - ALTURA_SUELO, modelo.ancho, 2);
    }

    /**
     * Dibuja un sprite pre-renderizado ocupando la caja de una entidad.
     * @param {string} nombre - Clave de sprite ("enemigo0", "nave", "nodriza"...).
     * @param {number} cuadro - Índice del fotograma (se limita al último disponible).
     * @param {{x:number,y:number,ancho:number,alto:number}} entidad - Caja donde dibujarlo.
     * @returns {void}
     */
    #pintarSprite(nombre, cuadro, entidad) {
        const cuadros = this.#sprites[nombre];
        this.#ctx.drawImage(
            cuadros[Math.min(cuadro, cuadros.length - 1)],
            Math.round(entidad.x),
            Math.round(entidad.y),
            entidad.ancho,
            entidad.alto,
        );
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
        this.#pintarSprite("nave", 0, nave);
        ctx.globalAlpha = 1;
    }

    /**
     * Dibuja el platillo nodriza, si hay uno en pantalla.
     * @param {import("../models/Nodriza.js").Nodriza|null} nodriza - Nodriza o `null`.
     * @returns {void}
     */
    #pintarNodriza(nodriza) {
        if (nodriza) {
            this.#pintarSprite("nodriza", 0, nodriza);
        }
    }

    /**
     * Dibuja una bala de la nave: rectángulo vertical.
     * @param {import("../models/Bala.js").Bala} bala - Bala a dibujar.
     * @returns {void}
     */
    #pintarBalaJugador(bala) {
        this.#ctx.fillStyle = this.#colores.bala;
        this.#ctx.fillRect(Math.round(bala.x), Math.round(bala.y), bala.ancho, bala.alto);
    }

    /**
     * Dibuja una bala enemiga como un zigzag clásico que cambia con el cuadro de
     * animación; su forma y color distintos a los de la nave evitan depender solo del color.
     * @param {import("../models/Bala.js").Bala} bala - Bala a dibujar.
     * @param {number} cuadro - 0 o 1: fase del zigzag.
     * @returns {void}
     */
    #pintarBalaEnemiga(bala, cuadro) {
        const ctx = this.#ctx;
        const segmento = bala.alto / 4;
        ctx.fillStyle = this.#colores["bala-enemiga"];
        for (let i = 0; i < 4; i += 1) {
            ctx.fillRect(Math.round(bala.x) + ((i + cuadro) % 2) * 2, Math.round(bala.y + i * segmento), 2, Math.ceil(segmento));
        }
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
            ctx.globalAlpha = Math.max(0, p.vida / VIDA_PARTICULA);
            ctx.fillStyle = p.color;
            ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3);
        });
        ctx.globalAlpha = 1;
    }
}
