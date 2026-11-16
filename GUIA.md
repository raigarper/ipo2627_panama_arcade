# GUIA.md — Guía fichero a fichero

Pensada para **defender el proyecto**: qué hace cada pieza, por qué está así y qué pregunta del profesor responde. Todo el código lleva cabecera `@file/@capa/@resumen/@depende/@usadoPor` y JSDoc en cada función (ver el estándar en [CLAUDE.md](CLAUDE.md)); se busca con `grep -rn "@resumen" js/ css/`.

## 1. Flujo de una partida

```
EntradaView (tecla/botón)  →  AppController.registrarAccion  →  JuegoModel.establecerEntrada
requestAnimationFrame      →  AppController.#bucle  →  JuegoModel.actualizar(PASO_FIJO) × N
                                                   →  LienzoView.pintar(modelo)
JuegoModel emite eventos   →  AppController los recibe →  actualiza vistas y audio
```

**Por qué paso fijo con acumulador.** `requestAnimationFrame` se dispara a la frecuencia del monitor (60, 144 Hz…). Si la física usara ese intervalo, el juego iría más rápido en pantallas rápidas. Con un paso fijo de 1/60 s la simulación es determinista y el renderizado queda **desacoplado** de la actualización.

## 2. Modelo (`js/models/`) — sin DOM, ejecutable en Node

| Fichero | Qué hace | Por qué así |
|---|---|---|
| `Mundo.js` | Dimensiones lógicas (480 × 640) y `PASO_FIJO` | El juego es igual en cualquier pantalla; la vista escala |
| `Entidad.js` | Posición, caja y `solapaCon` (colisión AABB) | Base común de todo lo que colisiona |
| `Bala.js` | Proyectil vertical de la nave o de un enemigo | Movimiento rectilíneo uniforme |
| `Nave.js` | Movimiento, cadencia, vidas, invulnerabilidad | Evita perder dos vidas seguidas |
| `Enemigo.js` | Invasor de 3 tipos con puntos distintos | Forma y color distintos por tipo |
| `Nodriza.js` | Bonus que cruza arriba | Riesgo/recompensa |
| `Formacion.js` | Movimiento de la formación, bajada al tocar borde, aceleración | Aísla «cómo se mueven los enemigos» |
| `Configuracion.js` | Ajustes inmutables y validados | El estado de ajustes cambia en un solo punto |
| `JuegoModel.js` | Estados, bucle de simulación, colisiones, puntos, oleadas, eventos | Núcleo del juego; aleatoriedad inyectable |

**Eventos del modelo** (patrón observador): `cambio`, `disparo`, `destruccion`, `impacto`, `oleada`, `fin`.

**Física presente (pide el enunciado):** velocidad constante de balas y nave; formación con velocidad que **aumenta** al quedar pocos enemigos y con la oleada; cadencia (enfriamiento) de disparo; invulnerabilidad temporal.

## 3. Vistas (`js/views/`)

| Fichero | Responsabilidad |
|---|---|
| `LienzoView.js` | Todo el dibujo con Canvas API. Colores leídos del CSS. HiDPI. Estrellas (parallax) y partículas |
| `CabeceraView.js` | Marcadores y botones de partida (se habilitan según el estado) |
| `AvisosView.js` | Cortina «Listo/Pausa» sobre el canvas y región `aria-live` |
| `AjustesView.js` | Diálogo de ajustes; avisa al controlador |
| `AyudaView.js` | Diálogo de ayuda con leyenda de enemigos |
| `FinView.js` | Diálogo de resultados |
| `EntradaView.js` | Teclado (por `event.code`), botones táctiles y pérdida de foco |
| `PaginaView.js` | Clases de paleta y alto contraste en la raíz |
| `AudioView.js` | Efectos con Web Audio, silenciado por defecto |
| `Dialogo.js` | Envoltorio de `<dialog>` nativo (abrir, cerrar, fondo) |
| `formaEnemigo.js` | SVG de cada tipo de enemigo, coloreado por CSS |

**Cómo el canvas usa los colores del CSS.** Una propiedad personalizada no se puede pasar al canvas tal cual. `LienzoView` crea un `<span>` oculto cuyo `color` es `var(--sonda)`; para cada token pone `--sonda: var(--color-X)` y lee `getComputedStyle(...).color`, que devuelve un `rgb()` ya resuelto. Así la paleta se define **solo** en `variables.css`.

**Por qué las teclas solo actúan con el foco en el canvas o el `body`.** Si el foco está en un botón y se pulsa Espacio, el navegador lo «pulsa». Limitando las teclas de juego al canvas, Espacio conserva su función normal en los botones (accesibilidad por teclado). `Comenzar` y `Reanudar` devuelven el foco al canvas.

## 4. Controlador (`js/controllers/AppController.js`)

Único punto de encuentro. Contiene el bucle principal, traduce acciones del usuario a llamadas al modelo, reacciona a sus eventos y aplica los ajustes. **No toca el DOM.**

Decisión de usabilidad: abrir ayuda o ajustes **pausa** la partida (el diálogo tapa el juego); la **dificultad** no altera una partida en curso (cambiar las reglas a mitad sería injusto) y se avisa de que aplica a la siguiente.

## 5. Estilos (`css/`)

| Fichero | Contenido |
|---|---|
| `style.css` | Único `<link>`; importa el resto en orden fijo |
| `reset.css` | Reset, foco visible, `prefers-reduced-motion` |
| `variables.css` | **Las tres estrategias de diseño** y todos los tokens |
| `layout.css` | Grid y Flexbox; único lugar con `position` |
| `components.css` | Bloques BEM con anidamiento nativo |

### Estrategia cromática
Interfaz **monocromática** (un tono, variando saturación y luminosidad) sobre tema oscuro; enemigos **triádicos** (+0°, +120°, +240°): 120° es la máxima separación posible entre tres colores. Tres paletas = tres tonos base. Colores semánticos fijos (peligro, bonus, foco) que no cambian con la paleta.

### Estrategia tipográfica
**Dos fuentes contrastadas:** monoespaciada para título y cifras (estética arcade; dígitos de ancho fijo que no «bailan») y sans del sistema para texto corrido.

### Estrategia espacial
`rem`, escala `xs < s < m < l < xl` y principios Gestalt: **proximidad** (botones de un grupo juntos, grupos separados), **semejanza** (todos los controles iguales), **figura y fondo** (canvas sobre interfaz oscura), **región común** (el escenario tiene borde propio).

### Composición
Grid para la página y los mandos táctiles (la columna central es más ancha); Flexbox para cabecera, grupos y zona de juego. `position` solo en la cortina sobre el canvas (debe flotar sin desplazarlo) y el enlace de salto.

## 6. Preguntas probables de la defensa

- **¿Por qué MVC?** El modelo es comprobable sin navegador; la vista se puede cambiar sin tocar las reglas.
- **¿Dónde está el bucle principal?** `AppController.#bucle`.
- **¿Cómo detectas colisiones?** AABB en `Entidad.solapaCon`; el modelo las resuelve en `#resolverColisiones`.
- **¿Por qué `<dialog>`?** Foco atrapado, Escape y capa superior gratis y accesibles.
- **¿Cómo es accesible un canvas?** `aria-label` dinámico, región `aria-live` para eventos, HTML para los mensajes, alto contraste y forma+color.
- **¿Por qué no hay `localStorage` ni tests en el repo?** Fuera del alcance acordado; el modelo se verificó en Node con una simulación determinista.
- **¿Por qué `px` en `--borde-fino`?** Única excepción documentada: bordes de grosor fino.
