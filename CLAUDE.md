# CLAUDE.md — Reglas de desarrollo del proyecto

Instrucciones obligatorias para cualquier agente que trabaje en este repositorio.
El enunciado está en [README.md](README.md); aquí van las **normas** de desarrollo.
Ante un conflicto entre el código y este documento, manda este documento. Ante un conflicto entre este documento y el enunciado, manda el enunciado.

## Contexto en una línea

Matamarcianos arcade para la asignatura de Interacción Persona-Ordenador. HTML + CSS + JavaScript nativos, **Canvas API**, patrón MVC. **Sin dependencias, sin framework, sin build.** Se evalúa por la calidad de la interfaz (diseño cromático, tipográfico y espacial), el uso correcto de Canvas y la limpieza de la arquitectura.

---

## Estándar de comentarios (OBLIGATORIO)

Todo fichero y toda función deben poder entenderse y buscarse sin leer su cuerpo. El formato es único en todo el proyecto.

### 1. Cabecera de fichero (JS, CSS y HTML)

Bloque al principio de **cada** fichero, con estas etiquetas y en este orden:

```js
/**
 * @file NombreDelFichero.js
 * @capa Modelo | Vista | Controlador | Raíz | Estilos (n/4)
 * @resumen Una frase: qué hace este fichero.
 * @depende Módulos o hojas de los que depende (o "Nada").
 * @usadoPor Quién lo usa.
 *
 * Reglas y "por qué" relevantes (decisiones de diseño, restricciones de la capa).
 */
```

### 2. Funciones, métodos, getters y constructores (JS)

JSDoc **en todos**, también en los privados (`#metodo`):

```js
/**
 * Qué hace, en una frase en indicativo.
 * @param {tipo} nombre - Qué es y en qué unidades.
 * @returns {tipo} Qué devuelve (omitir solo si es `void`: escribir `@returns {void}`).
 * @throws {RangeError} Cuándo lanza (si lanza).
 */
```

- Los **campos de clase** llevan un comentario `/** @type {tipo} Descripción. */`.
- Las **constantes** de módulo llevan un comentario de una línea con su significado y su unidad.
- Los comentarios explican el **porqué**, no repiten el qué de la línea siguiente.
- Idioma: español. Mismas palabras clave de búsqueda: `@file`, `@capa`, `@resumen`, `@param`, `@returns`.

### 3. CSS

Cabecera `@file/@capa/@resumen/@depende/@usadoPor` y, encima de cada bloque, un comentario de sección con el nombre del bloque (`/* ===== Botón de texto ===== */`). Las decisiones de estrategia (cromática, tipográfica, espacial) se documentan en `variables.css`.

### 4. HTML

Cabecera con las mismas etiquetas y un comentario de sección (`<!-- ===== CABECERA ===== -->`) sobre cada región, explicando qué vista la gestiona.

### 5. Cómo buscar

```bash
grep -rn "@capa Modelo" js/          # todos los ficheros del modelo
grep -rn "@resumen" js/ css/         # qué hace cada fichero
grep -rn "@usadoPor AppController" js/   # quién depende del controlador
```

Un cambio de comportamiento que no actualice su comentario se considera un error.

---

## Prohibiciones absolutas

| Nunca | Siempre |
|---|---|
| `var` | `const`, y `let` solo si hay reasignación |
| `onclick` u otros atributos de evento en el HTML | `addEventListener` |
| `elemento.style.loQueSea = …` | `classList.add/remove/toggle` |
| `innerHTML` con datos | `createElement` + `textContent` |
| Nombres de color, `#hex` o `rgb()` en componentes | `hsl()` parametrizado desde `variables.css` |
| Valores sueltos de color, tamaño o espacio | `var(--variable)` declarada en `variables.css` |
| `px` | `rem`/`em`; `%`, `dvh`, `clamp()`, `min()` en contenedores |
| Selectores de `id` o `!important` en CSS | Clases BEM |
| `float` o `position` para maquetar | Grid y Flexbox |
| Librerías, CDN, npm o compilación | Plataforma web nativa |

**Excepciones documentadas (única fuente de verdad):**
- `--borde-fino: 1px` en `variables.css`: grosor de bordes finos.
- `.style.setProperty("--sonda", …)` en `LienzoView`: solo sobre una **propiedad personalizada**, para resolver un color del CSS a `rgb()` que el canvas pueda usar. No es una escritura de estilo visual.
- `document` aparece en `js/app.js` (composition root) y en `js/views/`. En ningún otro sitio.
- Los atributos `width`/`height` de `<canvas>` los escribe `LienzoView` (resolución interna del lienzo, no un estilo).
- `favicon.svg` usa colores literales: es un recurso gráfico, no CSS.

---

## Arquitectura: qué puede hacer cada capa

```
Vista ──eventos──▶ Controlador ──llamadas──▶ Modelo
  ▲                     │                       │
  └──órdenes de pintado─┘◀──eventos (observador)┘
```

- **`js/models/`** — estado y reglas del juego (movimiento, física, colisiones, puntuación, oleadas). **No puede** tocar el DOM, el canvas ni el teclado. **Debe ejecutarse en Node.** Avisa de lo que pasa emitiendo eventos.
- **`js/views/`** — leen/escriben el DOM y el canvas, escuchan eventos del usuario y pintan. **No pueden** contener reglas del juego ni hablar con otra vista.
- **`js/controllers/`** — único punto donde vistas y modelo se encuentran. **No manipula el DOM.** Contiene el bucle principal.
- **`js/app.js`** — composition root: instancia y conecta. Nada de lógica.

### Estructura de ficheros

```
ipo2627_panama_arcade/
├── index.html  favicon.svg  README.md  INSTALL.md  GUIA.md  CLAUDE.md  AGENTS.md
├── css/        style.css (@import) · reset.css · variables.css · layout.css · components.css
└── js/
    ├── app.js
    ├── models/       Mundo, Entidad, Bala, Nave, Enemigo, Nodriza, Formacion, Configuracion, JuegoModel
    ├── views/        LienzoView, CabeceraView, AvisosView, AjustesView, AyudaView, FinView,
    │                 EntradaView, PaginaView, AudioView, Dialogo, sprites, spriteSvg
    └── controllers/  AppController
```

Orden de CSS en `style.css`: `reset` → `variables` → `layout` → `components`. Un solo `<script type="module" src="js/app.js">`.

---

## Reglas del dominio (viven en el modelo)

- **El mundo ocupa toda la pantalla y su tamaño lógico NO es fijo**: `calcularMundo(proporcion)` (`Mundo.js`) da alto 640 en apaisado y ancho 360 en vertical. `JuegoModel.redimensionar` lo aplica y recoloca nave y formación. Nunca hardcodear 480/640: leer `modelo.ancho` y `modelo.alto`.
- Paso de simulación fijo **1/60 s** (`PASO_FIJO`).
- Estados: `inicial → jugando ⇄ pausa → terminado`. Solo `iniciar()` sale de `inicial` o `terminado`.
- Nave: movimiento horizontal, **máx. 3 balas** propias en pantalla, invulnerabilidad 1,6 s tras un impacto.
- Enemigos: 3 tipos (pulpo 10, cangrejo 20, calamar 30 puntos). Formación de 4 a 12 columnas según el ancho del mundo (como máximo el 70 % del ancho, para que tenga recorrido lateral), que baja una fila al tocar un borde y acelera al quedar pocos. Solo el enemigo más bajo de cada columna dispara.
- Cada sprite mide celdas × `CELDA` (3) unidades y **debe coincidir con la caja de colisión** de su entidad (enemigo 33×24, nave 39×24, nodriza 48×21).
- Nodriza bonus: cruza arriba cada 15–25 s, 100 puntos.
- La partida termina por: sin vidas, invasión (un enemigo llega a la altura de la nave) o abandono.
- La dificultad (vidas, velocidad, frecuencia de disparo) **no cambia una partida en curso**: aplica a la siguiente. Controles, tema, contraste y sonido aplican al instante.
- La aleatoriedad se **inyecta** en `JuegoModel` para poder probarlo de forma determinista.

---

## Canvas y bucle principal

- Bucle con **paso fijo y acumulador** (`AppController.#bucle`): actualizar N veces, pintar una vez. Nunca multiplicar la física por un `dt` variable de renderizado.
- El canvas **rellena todo su contenedor, sin marco**. Resolución interna = tamaño en pantalla × `devicePixelRatio` (`LienzoView.medir`), que además avisa de la proporción para que el modelo adapte el mundo.
- Los **sprites** son bitmaps de texto en `sprites.js` (una sola definición para canvas e interfaz). Se pre-renderizan a lienzos de 1 píxel por celda y se escalan con `imageSmoothingEnabled = false`. La interfaz los usa vía `spriteSvg.js`.
- Los **colores del canvas salen del CSS** (`releerColores`); no se escribe ningún color en JS. Tras cambiar tema o contraste hay que llamar a `releerColores()` (regenera también los sprites).
- Partículas y parallax son efectos de vista y se desactivan con `prefers-reduced-motion`.
- Pausa automática al perder foco / ocultar pestaña / abrir un diálogo.

---

## Selección por `data-*`

El JS **nunca** busca por clase de estilo ni por `id`. Anclajes: `data-pagina`, `data-lienzo`, `data-cabecera`, `data-cortina`, `data-anuncios`, `data-mandos`, `data-tactil`, `data-ayuda`, `data-ajustes`, `data-fin`, `data-accion`, `data-control` (con `data-valores` en el deslizador o `data-valor-activo`/`data-valor-inactivo` en los interruptores), `data-marcador-*`, `data-cortina-*`, `data-deslizador`, `data-marca`, `data-leyenda-sprite`, `data-cerrar`. Nombres en español y kebab-case, leídos con `dataset`. Los `id` del HTML existen solo para relaciones ARIA y el enlace de salto.

---

## Composición y `position`

| Nodo | Sistema |
|---|---|
| Estructura de página (cabecera + juego) | Grid de 2 filas (`auto` + `minmax(0,1fr)`) |
| Cabecera (cambia de 3 columnas a 2 o 3 filas) | Grid con áreas con nombre |
| Escenario que contiene el canvas | Grid de una celda |
| Grupos de botones, marcadores, zona de juego, pista de teclas | Flexbox |
| Mandos táctiles (3 columnas, la central más ancha) | Grid |
| Texto de ayuda | Flujo normal |

`position` solo para lo que **flota sin desplazar nada**: la cortina de inicio/pausa sobre el canvas (`relative` + `absolute` + `inset`), el enlace de salto y el texto solo para lectores de pantalla. Nunca para colocar el canvas, botones ni marcadores.

**Responsive**: la página mide `100dvh` y hace scroll solo si no cabe (nunca recorta). Puntos de corte: `64em` (cabecera en 2 filas), `40em` (3 filas) y `height <= 30em` (móvil apaisado: una sola fila compacta; los tamaños se reducen redefiniendo variables, no reescribiendo reglas).

---

## Estrategias de diseño (se fijan en `variables.css`)

- **Cromática**: interfaz **monocromática** (un `--tono-interfaz`) con **dos temas** (oscuro por defecto y claro) que solo cambian luminosidades; enemigos **triádicos** fijos (+0°, +120°, +240° sobre `--tono-enemigos`; no hay selección de paleta); colores semánticos de tono fijo (peligro, bonus, vida, suelo, foco). Los temas se activan con clases en `.pagina` y recalculan los derivados porque estos se declaran en `:root, .pagina`.
- **Jerarquía del marcador**: los puntos son lo más grande y luminoso de la interfaz; las vidas son corazones (forma + color, y vacíos al perderse); la oleada es secundaria.
- **Ajustes**: deslizador para la dificultad (3 posiciones) e interruptores (`role="switch"`) para controles, tema, alto contraste y sonido.
- **Tipográfica**: **dos fuentes contrastadas** — monoespaciada para título y cifras, sans del sistema para texto.
- **Espacial**: `rem` y escala `xs < s < m < l < xl`; Gestalt (proximidad, semejanza, figura/fondo, región común).
- **Accesibilidad**: contraste de texto ≥ 4,5:1 y de gráficos/bordes ≥ 3:1, medido en los cuatro modos (oscuro, claro y sus altos contrastes); foco visible; tipo de enemigo codificado por **silueta y color**; `<dialog>` nativo; `aria-live` para eventos; canvas con `aria-label` dinámico; modo alto contraste; `prefers-reduced-motion`; controles táctiles.

---

## Antes de dar algo por terminado

```bash
# Sin antipatrones (debe salir vacío salvo falsos positivos del regex en index.html)
grep -rnE "\bvar |onclick|\.style\.|innerHTML|!important" js/ index.html | grep -v setProperty
# Sin px ni colores literales en CSS (solo --borde-fino)
grep -rnE "[0-9]px|rgb\(|#[0-9a-fA-F]{3,6}\b" css/
# document solo en app.js y views/
grep -rln "document\." js/ | grep -v "js/views/"
```

Y en el navegador, sirviendo por HTTP (`python -m http.server 8000`), nunca con `file://`:

1. Carga sin errores en consola.
2. Comenzar, pausar, reanudar y finalizar funcionan; los botones se habilitan según el estado.
3. Mover, disparar, destruir enemigos, perder vidas y pasar de oleada.
4. Abrir ayuda y ajustes (la partida se pausa); mover el deslizador y accionar los cuatro interruptores (tema claro y oscuro incluidos).
5. Jugar entero con teclado; probar controles táctiles en emulación móvil.
6. Cambiar el tamaño de la ventana y girar el móvil (también en plena partida): el canvas rellena todo el espacio, sin scroll horizontal ni recortes, y nada queda fuera del mundo.
7. Activar `prefers-reduced-motion`: sin partículas ni parallax.
8. Cambiar de pestaña: la partida se pausa.

El modelo se prueba sin navegador ejecutándolo con Node (partida simulada con aleatoriedad inyectada: debe terminar, puntuar y avanzar de oleada).

---

## Alcance

Práctica evaluada por su interfaz y su arquitectura. **No añadas funcionalidad no pedida**: ni backend, ni persistencia (no hay `localStorage`), ni tests en el repositorio. Si detectas una mejora, propónla antes de implementarla.
