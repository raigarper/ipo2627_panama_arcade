/**
 * @file app.js
 * @capa Raíz (composition root)
 * @resumen Punto de entrada: localiza el DOM, crea modelo, vistas y controlador, los conecta y arranca.
 * @depende Todos los módulos de models/, views/ y controllers/
 * @usadoPor index.html (único `<script type="module">`)
 *
 * No contiene ninguna regla del juego ni decide nada: es solo "fontanería".
 * Todos los elementos se buscan por atributos `data-*`, nunca por `id` ni por
 * clase de estilo (las clases pertenecen al diseño, los `data-*` al JS).
 */

import { AppController } from "./controllers/AppController.js";
import { Configuracion } from "./models/Configuracion.js";
import { JuegoModel } from "./models/JuegoModel.js";
import { AjustesView } from "./views/AjustesView.js";
import { AudioView } from "./views/AudioView.js";
import { AvisosView } from "./views/AvisosView.js";
import { AyudaView } from "./views/AyudaView.js";
import { CabeceraView } from "./views/CabeceraView.js";
import { EntradaView } from "./views/EntradaView.js";
import { FinView } from "./views/FinView.js";
import { LienzoView } from "./views/LienzoView.js";
import { PaginaView } from "./views/PaginaView.js";

/**
 * Crea las piezas MVC y las conecta.
 *
 * Las vistas se construyen ANTES que el controlador porque necesitan sus
 * callbacks en el constructor y el controlador aún no existe. Se resuelve con
 * la variable `controlador`, capturada por clausura: los callbacks son
 * funciones flecha que la invocan en el momento del evento (no al declararse),
 * y para entonces ya está asignada.
 * @returns {void}
 */
function arrancar() {
    const configuracion = new Configuracion();
    const modelo = new JuegoModel(configuracion.parametros);

    let controlador;

    const lienzo = document.querySelector("[data-lienzo]");
    const lienzoView = new LienzoView(lienzo);

    const cabeceraView = new CabeceraView(document.querySelector("[data-cabecera]"), {
        alComenzar: () => controlador.comenzar(),
        alAlternarPausa: () => controlador.alternarPausa(),
        alFinalizar: () => controlador.finalizar(),
        alAbrirAyuda: () => controlador.abrirAyuda(),
        alAbrirAjustes: () => controlador.abrirAjustes(),
        alAlternarSonido: () => controlador.alternarSonido(),
    });

    const avisosView = new AvisosView(
        document.querySelector("[data-cortina]"),
        document.querySelector("[data-anuncios]"),
    );

    const ayudaView = new AyudaView(document.querySelector("[data-ayuda]"));

    const ajustesView = new AjustesView(document.querySelector("[data-ajustes]"), {
        alCambiarDificultad: (valor) => controlador.cambiarDificultad(valor),
        alCambiarControles: (valor) => controlador.cambiarControles(valor),
        alCambiarPaleta: (valor) => controlador.cambiarPaleta(valor),
        alCambiarAltoContraste: (activo) => controlador.cambiarAltoContraste(activo),
        alCambiarSonido: (activo) => controlador.cambiarSonido(activo),
    });

    const finView = new FinView(document.querySelector("[data-fin]"), {
        alJugarDeNuevo: () => controlador.jugarDeNuevo(),
    });

    const entradaView = new EntradaView(lienzo, document.querySelector("[data-mandos]"), {
        alAccion: (accion, activa) => controlador.registrarAccion(accion, activa),
        alAlternarPausa: () => controlador.alternarPausa(),
        alConfirmar: () => controlador.confirmar(),
        alPerderFoco: () => controlador.alPerderFoco(),
    });

    const paginaView = new PaginaView(document.querySelector("[data-pagina]"));
    const audioView = new AudioView();

    controlador = new AppController({
        configuracion,
        modelo,
        lienzoView,
        cabeceraView,
        avisosView,
        ajustesView,
        ayudaView,
        finView,
        entradaView,
        paginaView,
        audioView,
    });

    controlador.iniciar();
}

try {
    arrancar();
} catch (error) {
    // Único `console.error` permitido: un fallo de arranque (p. ej. un selector
    // que no encontró su elemento) no debe quedar en silencio.
    console.error("No se pudo iniciar el arcade:", error);
}
