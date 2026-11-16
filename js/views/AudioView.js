/**
 * @file AudioView.js
 * @capa Vista (salida de audio)
 * @resumen Efectos de sonido sintetizados con Web Audio API (sin ficheros de audio), silenciados por defecto.
 * @depende Nada.
 * @usadoPor app.js, AppController
 *
 * Por qué sintetizado: cumple "HTML, CSS y JS nativos" sin assets que licenciar.
 * Por qué silenciado por defecto: reproducir sonido sin que el usuario lo pida
 * es una mala práctica de usabilidad (y los navegadores exigen un gesto previo).
 * El contexto de audio se crea de forma perezosa, en el primer gesto del usuario.
 */

/** Volumen general de los efectos (0 a 1), bajo a propósito. */
const VOLUMEN = 0.08;

export class AudioView {
    /** @type {AudioContext|null} Se crea al activar el sonido, nunca antes. */
    #contexto = null;
    #activo = false;

    /**
     * Activa o silencia el sonido. Al activarlo crea (o reanuda) el contexto de audio.
     * @param {boolean} activo - `true` para activar.
     * @returns {void}
     */
    activar(activo) {
        this.#activo = activo;
        if (!activo) {
            return;
        }
        if (!this.#contexto && window.AudioContext) {
            this.#contexto = new window.AudioContext();
        }
        this.#contexto?.resume();
    }

    /**
     * Reproduce un efecto, si el sonido está activo.
     * @param {string} nombre - "disparo", "destruccion", "bonus", "impacto", "oleada" o "fin".
     * @returns {void}
     */
    reproducir(nombre) {
        if (!this.#activo || !this.#contexto) {
            return;
        }
        switch (nombre) {
            case "disparo":
                this.#tono("square", 880, 330, 0.08);
                break;
            case "destruccion":
                this.#ruido(0.18);
                break;
            case "bonus":
                this.#tono("square", 660, 1320, 0.25);
                break;
            case "impacto":
                this.#tono("sawtooth", 180, 40, 0.35);
                this.#ruido(0.25);
                break;
            case "oleada":
                this.#tono("triangle", 440, 880, 0.3);
                break;
            case "fin":
                this.#tono("sawtooth", 330, 55, 0.7);
                break;
            default:
                break;
        }
    }

    /**
     * Emite un tono con barrido de frecuencia y caída de volumen.
     * @param {OscillatorType} forma - Forma de onda.
     * @param {number} inicio - Frecuencia inicial (Hz).
     * @param {number} fin - Frecuencia final (Hz).
     * @param {number} duracion - Duración en segundos.
     * @returns {void}
     */
    #tono(forma, inicio, fin, duracion) {
        const ctx = this.#contexto;
        const ahora = ctx.currentTime;
        const oscilador = ctx.createOscillator();
        const ganancia = ctx.createGain();
        oscilador.type = forma;
        oscilador.frequency.setValueAtTime(inicio, ahora);
        oscilador.frequency.exponentialRampToValueAtTime(fin, ahora + duracion);
        ganancia.gain.setValueAtTime(VOLUMEN, ahora);
        ganancia.gain.exponentialRampToValueAtTime(0.0001, ahora + duracion);
        oscilador.connect(ganancia).connect(ctx.destination);
        oscilador.start(ahora);
        oscilador.stop(ahora + duracion);
    }

    /**
     * Emite una ráfaga de ruido blanco con caída de volumen (explosiones).
     * @param {number} duracion - Duración en segundos.
     * @returns {void}
     */
    #ruido(duracion) {
        const ctx = this.#contexto;
        const ahora = ctx.currentTime;
        const muestras = Math.floor(ctx.sampleRate * duracion);
        const buffer = ctx.createBuffer(1, muestras, ctx.sampleRate);
        const datos = buffer.getChannelData(0);
        for (let i = 0; i < muestras; i += 1) {
            datos[i] = Math.random() * 2 - 1;
        }
        const fuente = ctx.createBufferSource();
        const ganancia = ctx.createGain();
        fuente.buffer = buffer;
        ganancia.gain.setValueAtTime(VOLUMEN, ahora);
        ganancia.gain.exponentialRampToValueAtTime(0.0001, ahora + duracion);
        fuente.connect(ganancia).connect(ctx.destination);
        fuente.start(ahora);
    }
}
