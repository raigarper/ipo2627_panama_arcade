# Matamarcianos Arcade

Juego arcade para la asignatura de **Interacción Persona-Ordenador**, hecho con **HTML, CSS y JavaScript nativos** y la **Canvas API**, sin bibliotecas ni frameworks. Sigue el patrón **MVC**.

Documentación: [INSTALL.md](INSTALL.md) (ejecutar) · [GUIA.md](GUIA.md) (guía fichero a fichero) · [CLAUDE.md](CLAUDE.md) / [AGENTS.md](AGENTS.md) (normas de desarrollo).

## Cómo se juega

Una formación de invasores desciende por la pantalla. Muévete y destrúyelos antes de que lleguen a tu nave.

| Acción | Teclado | Táctil |
|---|---|---|
| Mover | ← → (o A / D según ajustes) | Botones ◀ ▶ |
| Disparar | Espacio | Botón «Disparar» |
| Pausar / reanudar | P o Escape | Botón «Pausar» |

- **Puntos:** círculo 10, triángulo 20, rombo 30, nave nodriza 100.
- **Vidas:** pierdes una al recibir un disparo; después quedas protegido 1,6 s.
- **Oleadas:** cada oleada trae más filas y más velocidad.
- **Fin:** sin vidas, invasión o botón *Finalizar*.
- **Ajustes:** dificultad (se aplica a la siguiente partida), controles, paleta de enemigos, alto contraste y sonido (silenciado por defecto).

## Cumplimiento del enunciado

| Requisito | Dónde |
|---|---|
| Comenzar, pausar y finalizar | `CabeceraView` + `AppController` + `JuegoModel` (estados) |
| Componente de ayuda | `AyudaView` (`<dialog>`) |
| Ajuste de parámetros | `AjustesView` + `Configuracion` |
| Indicador de progreso | Marcadores de puntos, vidas y oleada (`CabeceraView`) |
| Bucle principal | `AppController.#bucle` (paso fijo con acumulador) |
| Actualización y renderizado separados | `JuegoModel.actualizar` / `LienzoView.pintar` |
| Colisiones | `Entidad.solapaCon` (AABB) + `JuegoModel.#resolverColisiones` |
| Física (velocidad, cadencia, aceleración de la formación) | `Nave`, `Bala`, `Formacion` |
| MVC | `js/models`, `js/views`, `js/controllers` |
| Vinculación moderna | Un `<link>` a `style.css` (con `@import` ordenados) y un `<script type="module">` |
| HTML semántico | `header`, `main`, `dl`, `dialog`, `section`, ARIA |
| Selectores mantenibles | BEM + hooks `data-*` para JS |
| Composición | Grid (página, mandos) y Flexbox (cabecera, grupos, zona de juego) |
| `position` justificado | Cortina sobre el canvas y enlace de salto (`layout.css`) |
| Estrategia cromática | Interfaz monocromática + enemigos triádicos |
| Estrategia tipográfica | Dos fuentes contrastadas (monoespaciada + sans) |
| Estrategia espacial | `rem`, escala de espacios, Gestalt |

## Arquitectura

```
Vista ──eventos──▶ Controlador ──llamadas──▶ Modelo
  ▲                     │                       │
  └──órdenes de pintado─┘◀──eventos (observador)┘
```

El modelo no conoce el DOM ni el canvas y se puede ejecutar en Node. Los detalles, fichero a fichero, están en [GUIA.md](GUIA.md).

## Accesibilidad y usabilidad

- Juego completo por teclado; controles táctiles en dispositivos táctiles.
- Diálogos con `<dialog>` nativo (foco atrapado, Escape, foco devuelto).
- Contraste de texto ≥ 4,5:1 y de bordes ≥ 3:1 (medido); modo alto contraste.
- Los enemigos se distinguen por **forma y color**, nunca solo por color.
- Canvas con `aria-label` dinámico y región `aria-live` para oleadas, impactos y fin de partida.
- `prefers-reduced-motion`: sin partículas ni parallax.
- Pausa automática al cambiar de pestaña o abrir un diálogo.

---

# Enunciado original

# PROYECTO Arcade

El proyecto consiste en una aplicación web que implementa un juego arcade.  

Se proponen las siguientes sugerencias (no vinculantes):

- Juego de plataformas tipo Mario: scroll lateral, saltos, enemigos y obstáculos.
- Circuito de coches: vehículo que recorre un trazado esquivando obstáculos o rivales.
- Matamarcianos: nave que dispara a enemigos en movimiento vertical u horizontal.

## Objetivos

El desarrollo se realizará en HTML, CSS y JS nativos, sin bibliotecas ni frameworks auxiliares.

El objetivo de esta actividad es el empleo de la interfaz Canvas API para el desarrollo de aplicaciones interactivas con un fuerte componente dinámico y visual.

## Descripción

El sistema interactúa con un único actor (jugador humano) que es el usuario encargado de jugar al juego. 

El sistema debe cumplir los siguientes requisitos: 
- el usuario tendrá la capacidad de comenzar, pausar o finalizar el juego
- el sistema ofrecerá un componente de ayuda para informar al usuario las reglas del juego


Si procede, en función del tipo de juego, el sistema 
- ofrecerá capacidad para ajustar parámetros antes de comenzar (o durante) la partida
- mostrará durante el juego un indicador de progreso (marcador, vidas, etc.) 

Los juegos deben implementar un bucle principal que centraliza el juego, y según las características del juego deberá contemplar aquellos componentes relevantes:
- acciones de las entidades según la variante: saltos y desplazamiento en plataformas, disparos en matamarcianos, aceleración y giro en circuitos, etc.
- actualización - estado y movimiento - y renderizado 
- detección de colisiones
- física de las entidades (velocidad, aceleración, gravedad, etc.)

## Diseño

- La aplicación deberá estar implementada siguiendo un patrón MVC (_Model-View-Controller_) con objeto de clarificar y diferenciar las distintas responsabilidades. 
- Tanto la distribución del código de los ficheros como la propia organización de los ficheros incluidos en la carpeta del proyecto deberán facilitar la comprensión y el mantenimiento de la solución aportada. 

### Interacción 

La implementación de la interacción estará guiada para favorecer la usabilidad de la aplicación.

## Buenas prácticas HTML/CSS/JS

- Vinculación moderna de los componentes HTML, CSS y JS
- Etiquetado HTML semántico y moderno
- Estrategia de selectores CSS mantenible
- Selección de composiciones apropiadas (unidimensional, bidimensional)
- Aplicación justificada del posicionamiento 
- Separación clara y organizada de los distintos aspectos estilísticos considerados: diseño cromático, tipográfico y espacial. Y cada uno estará cimentado en una sólida estrategia:
  - diseño cromático: monocromático, triádico, complementario, etc.
  - diseño tipográfico: dos fuentes contrastadas, una única fuente con niveles distintos de realce, etc.
  - diseño espacial: selección de unidades de medida y contenedores, principios de diseño `Gestalt`, etc. 
