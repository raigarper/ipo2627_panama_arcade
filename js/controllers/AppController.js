/**
 * @file AppController.js
 * @capa Controlador
 * @resumen Único punto de encuentro entre vistas y modelo: bucle principal, acciones del usuario y ajustes.
 * @depende Mundo, JuegoModel (ESTADOS), vistas (por interfaz pública)
 * @usadoPor app.js
 *
 * Reglas de la capa:
 *  - Las vistas nunca se llaman entre sí ni conocen el modelo: avisan al
 *    controlador mediante callbacks y éste decide.
 *  - El controlador NO toca el DOM: solo invoca métodos públicos de las vistas.
 *
 * Bucle principal (game loop) con paso de tiempo FIJO y acumulador:
 *    cada fotograma:  acumulador += tiempo real transcurrido
 *                     mientras acumulador >= PASO_FIJO: modelo.actualizar(PASO_FIJO)
 *                     lienzo.pintar(modelo)
 *  Así la física es la misma a 30, 60 o 144 FPS, y el renderizado queda
 *  desacoplado de la actualización (requisito del enunciado).
 */

import { ESTADOS } from "../models/JuegoModel.js";
import { PASO_FIJO } from "../models/Mundo.js";

/** Tope de tiempo acumulable por fotograma (s): evita una "espiral de la muerte" tras una pausa larga. */
const MAX_TIEMPO_FOTOGRAMA = 0.1;

export class AppController {
    #configuracion;
    #modelo;
    #lienzoView;
    #cabeceraView;
    #avisosView;
    #ajustesView;
    #ayudaView;
    #finView;
    #entradaView;
    #paginaView;
    #audioView;

    /** @type {number|null} Instante del fotograma anterior (ms). */
    #instanteAnterior = null;
    /** @type {number} Tiempo real pendiente de simular (s). */
    #acumulador = 0;
    /** @type {string} Estado en el fotograma anterior, para anunciar solo los cambios. */
    #estadoPrevio = ESTADOS.INICIAL;

    /**
     * @param {{
     *   configuracion: import("../models/Configuracion.js").Configuracion,
     *   modelo: import("../models/JuegoModel.js").JuegoModel,
     *   lienzoView: import("../views/LienzoView.js").LienzoView,
     *   cabeceraView: import("../views/CabeceraView.js").CabeceraView,
     *   avisosView: import("../views/AvisosView.js").AvisosView,
     *   ajustesView: import("../views/AjustesView.js").AjustesView,
     *   ayudaView: import("../views/AyudaView.js").AyudaView,
     *   finView: import("../views/FinView.js").FinView,
     *   entradaView: import("../views/EntradaView.js").EntradaView,
     *   paginaView: import("../views/PaginaView.js").PaginaView,
     *   audioView: import("../views/AudioView.js").AudioView,
     * }} piezas - Instancias creadas por app.js (composition root).
     */
    constructor({ configuracion, modelo, lienzoView, cabeceraView, avisosView, ajustesView, ayudaView, finView, entradaView, paginaView, audioView }) {
        this.#configuracion = configuracion;
        this.#modelo = modelo;
        this.#lienzoView = lienzoView;
        this.#cabeceraView = cabeceraView;
        this.#avisosView = avisosView;
        this.#ajustesView = ajustesView;
        this.#ayudaView = ayudaView;
        this.#finView = finView;
        this.#entradaView = entradaView;
        this.#paginaView = paginaView;
        this.#audioView = audioView;

        this.#suscribirModelo();
    }

    /**
     * Sincroniza las vistas con la configuración inicial y arranca el bucle principal.
     * @returns {void}
     */
    iniciar() {
        this.#aplicarConfiguracion();
        this.#lienzoView.medir();
        this.#alCambiar();
        requestAnimationFrame(this.#bucle);
    }

    /**
     * Adapta el mundo del modelo a la proporción del canvas. Lo llama la vista
     * del lienzo cada vez que cambia su tamaño (girar el móvil, redimensionar
     * la ventana), de modo que el juego ocupa siempre toda la pantalla.
     * @param {number} proporcion - Ancho dividido por alto del canvas, en píxeles.
     * @returns {void}
     */
    redimensionar(proporcion) {
        this.#modelo.redimensionar(proporcion);
    }

    /**
     * Botón "Comenzar" (o Enter): empieza una partida nueva con la dificultad actual.
     * @returns {void}
     */
    comenzar() {
        if (this.#modelo.estado === ESTADOS.JUGANDO || this.#modelo.estado === ESTADOS.PAUSA) {
            return;
        }
        this.#modelo.iniciar(this.#configuracion.parametros);
        this.#ajustesView.mostrarAvisoDificultad(false);
        this.#lienzoView.enfocar();
    }

    /**
     * Botón "Jugar de nuevo" del diálogo de resultados.
     * @returns {void}
     */
    jugarDeNuevo() {
        this.#finView.cerrar();
        this.comenzar();
    }

    /**
     * Botón "Pausar/Reanudar" (o tecla P / Escape): alterna entre jugar y pausa.
     * @returns {void}
     */
    alternarPausa() {
        if (this.#modelo.estado === ESTADOS.JUGANDO) {
            this.#modelo.pausar();
        } else if (this.#modelo.estado === ESTADOS.PAUSA) {
            this.#modelo.reanudar();
            this.#lienzoView.enfocar();
        }
    }

    /**
     * Tecla Enter: confirma la acción principal según el estado (comenzar o reanudar).
     * @returns {void}
     */
    confirmar() {
        if (this.#modelo.estado === ESTADOS.PAUSA) {
            this.alternarPausa();
        } else {
            this.comenzar();
        }
    }

    /**
     * Botón "Finalizar": termina la partida en curso y muestra los resultados.
     * @returns {void}
     */
    finalizar() {
        this.#modelo.finalizar("abandono");
    }

    /**
     * Transmite al modelo una acción del jugador (pulsar o soltar).
     * @param {string} accion - "izquierda", "derecha" o "disparo".
     * @param {boolean} activa - `true` al pulsar, `false` al soltar.
     * @returns {void}
     */
    registrarAccion(accion, activa) {
        this.#modelo.establecerEntrada(accion, activa);
    }

    /**
     * Pausa automática al perder el foco o ocultarse la pestaña, para no perder
     * la partida mientras el jugador no está mirando.
     * @returns {void}
     */
    alPerderFoco() {
        this.#modelo.liberarEntrada();
        this.#modelo.pausar();
    }

    /**
     * Abre la ayuda; si se está jugando, pausa primero (el diálogo tapa el juego).
     * @returns {void}
     */
    abrirAyuda() {
        this.#modelo.pausar();
        this.#ayudaView.abrir();
    }

    /**
     * Abre los ajustes; si se está jugando, pausa primero.
     * @returns {void}
     */
    abrirAjustes() {
        this.#modelo.pausar();
        this.#ajustesView.abrir();
    }

    /**
     * Cambia la dificultad. No se aplica a una partida en curso (sería injusto
     * cambiar las reglas a mitad): se avisa de que afectará a la siguiente.
     * @param {string} dificultad - Clave de DIFICULTADES.
     * @returns {void}
     */
    cambiarDificultad(dificultad) {
        this.#configuracion = this.#configuracion.conDificultad(dificultad);
        this.#ajustesView.actualizar(this.#configuracion);
        const enCurso = this.#modelo.estado === ESTADOS.JUGANDO || this.#modelo.estado === ESTADOS.PAUSA;
        this.#ajustesView.mostrarAvisoDificultad(enCurso);
    }

    /**
     * Cambia el esquema de control (efecto inmediato).
     * @param {string} controles - "flechas" o "wasd".
     * @returns {void}
     */
    cambiarControles(controles) {
        this.#configuracion = this.#configuracion.conControles(controles);
        this.#aplicarConfiguracion();
    }

    /**
     * Cambia el tema de color de la interfaz (efecto inmediato).
     * @param {string} tema - Elemento de TEMAS ("oscuro" o "claro").
     * @returns {void}
     */
    cambiarTema(tema) {
        this.#configuracion = this.#configuracion.conTema(tema);
        this.#aplicarConfiguracion();
    }

    /**
     * Activa o desactiva el alto contraste (efecto inmediato).
     * @param {boolean} activo - Nuevo estado.
     * @returns {void}
     */
    cambiarAltoContraste(activo) {
        this.#configuracion = this.#configuracion.conAltoContraste(activo);
        this.#aplicarConfiguracion();
    }

    /**
     * Activa o silencia el sonido (efecto inmediato).
     * @param {boolean} activo - Nuevo estado.
     * @returns {void}
     */
    cambiarSonido(activo) {
        this.#configuracion = this.#configuracion.conSonido(activo);
        this.#aplicarConfiguracion();
        this.#avisosView.anunciar(activo ? "Sonido activado" : "Sonido desactivado");
    }

    /**
     * Botón de sonido de la cabecera: invierte el estado actual.
     * @returns {void}
     */
    alternarSonido() {
        this.cambiarSonido(!this.#configuracion.sonido);
    }

    /**
     * Bucle principal: simula con paso fijo y pinta una vez por fotograma.
     * Es una función flecha para conservar `this` al pasarla a requestAnimationFrame.
     * @param {number} instante - Marca de tiempo del fotograma (ms).
     * @returns {void}
     */
    #bucle = (instante) => {
        if (this.#instanteAnterior !== null) {
            this.#acumulador += Math.min((instante - this.#instanteAnterior) / 1000, MAX_TIEMPO_FOTOGRAMA);
        }
        this.#instanteAnterior = instante;

        while (this.#acumulador >= PASO_FIJO) {
            this.#modelo.actualizar(PASO_FIJO);
            this.#acumulador -= PASO_FIJO;
        }
        this.#lienzoView.pintar(this.#modelo, instante);
        requestAnimationFrame(this.#bucle);
    };

    /**
     * Refleja en todas las vistas la configuración actual (tema, contraste,
     * controles, sonido y estado de los ajustes).
     * @returns {void}
     */
    #aplicarConfiguracion() {
        this.#paginaView.aplicar(this.#configuracion);
        this.#lienzoView.releerColores();
        this.#entradaView.establecerEsquema(this.#configuracion.controles);
        this.#audioView.activar(this.#configuracion.sonido);
        this.#cabeceraView.actualizarSonido(this.#configuracion.sonido);
        this.#ajustesView.actualizar(this.#configuracion);
    }

    /**
     * Suscribe el controlador a los eventos del modelo (patrón observador).
     * @returns {void}
     */
    #suscribirModelo() {
        this.#modelo.addEventListener("cambio", () => this.#alCambiar());
        this.#modelo.addEventListener("disparo", (evento) => {
            if (evento.detail.propietario === "jugador") {
                this.#audioView.reproducir("disparo");
            }
        });
        this.#modelo.addEventListener("destruccion", (evento) => {
            this.#lienzoView.explosion(evento.detail);
            this.#audioView.reproducir(evento.detail.tipo === "nodriza" ? "bonus" : "destruccion");
        });
        this.#modelo.addEventListener("impacto", (evento) => {
            this.#audioView.reproducir("impacto");
            this.#avisosView.anunciar(`Impacto. Vidas restantes: ${evento.detail.vidas}`);
        });
        this.#modelo.addEventListener("oleada", (evento) => {
            this.#audioView.reproducir("oleada");
            this.#avisosView.anunciar(`Oleada ${evento.detail.numero}`);
        });
        this.#modelo.addEventListener("fin", (evento) => {
            this.#audioView.reproducir("fin");
            this.#avisosView.anunciar(`Partida terminada. ${evento.detail.puntos} puntos.`);
            this.#finView.abrir(evento.detail);
        });
    }

    /**
     * Repinta los indicadores cuando cambia el estado o el marcador, y anuncia
     * a los lectores de pantalla los cambios de estado de la partida.
     * @returns {void}
     */
    #alCambiar() {
        const { puntos, vidas, oleada, estado, vidasIniciales } = this.#modelo;
        this.#cabeceraView.actualizarMarcadores({ puntos, vidas, vidasMax: vidasIniciales, oleada });
        this.#cabeceraView.actualizarEstado(estado);
        this.#avisosView.mostrarEstado(estado);
        this.#lienzoView.describir({ puntos, vidas, oleada, estado });

        if (estado !== this.#estadoPrevio) {
            if (estado === ESTADOS.JUGANDO && this.#estadoPrevio === ESTADOS.PAUSA) {
                this.#avisosView.anunciar("Partida reanudada");
            } else if (estado === ESTADOS.JUGANDO) {
                this.#avisosView.anunciar("Comienza la partida");
            } else if (estado === ESTADOS.PAUSA) {
                this.#avisosView.anunciar("Partida en pausa");
            }
            this.#estadoPrevio = estado;
        }
    }
}
