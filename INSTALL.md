# INSTALL.md — Cómo ejecutar el proyecto

El proyecto no tiene dependencias ni paso de compilación. Solo hace falta un **navegador moderno** (Chrome/Edge 120+, Firefox 117+, Safari 17.2+; se usa anidamiento nativo de CSS, `<dialog>` y módulos ES).

## Importante: servir por HTTP

Usa módulos ES (`<script type="module">`), que los navegadores **bloquean con `file://`**. Hay que servir la carpeta por HTTP:

```bash
# Opción 1: Python (viene con la mayoría de sistemas)
python -m http.server 8000

# Opción 2: Node
npx serve -l 8000

# Opción 3: VS Code → extensión "Live Server" → "Go Live"
```

Abre <http://localhost:8000>.

## Comprobación rápida

1. La consola del navegador no muestra errores.
2. Se ve el tablero con la formación y el mensaje «Listo para jugar».
3. **Comenzar** inicia la partida; **Pausar**/**Reanudar** y **Finalizar** responden.
4. Flechas (o A/D) mueven la nave y **Espacio** dispara.
5. La ayuda (icono `?`) y los ajustes se abren y la partida se pausa sola.

## Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| Página en blanco y error de CORS/módulos | Abierto con `file://` | Servir por HTTP (ver arriba) |
| Las teclas no mueven la nave | El foco no está en el juego | Pulsa Comenzar (da el foco al canvas) o haz clic en el juego |
| No suena nada | El sonido está silenciado por defecto | Icono de altavoz o Ajustes → Sonido → Activado |
| No hay partículas de explosión ni animación de sprites | `prefers-reduced-motion` activo en el sistema | Es intencionado (accesibilidad) |
| Botones táctiles no visibles | Solo aparecen en dispositivos táctiles (`pointer: coarse`) | Usa emulación móvil en las herramientas de desarrollo |
