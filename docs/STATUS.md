# Estado de entrega

Actualizado: 18 de noviembre de 2026, Perú.

## Implementado

Aplicación Next.js funcional, sin cuenta ni claves: onboarding, demo aislado,
avance, editor de intentos y lotes con revisión, deshacer, malla por
ciclos/lista, explorador de conexiones, detalle con fuentes, planificador de
varios periodos, escenarios persistidos, comparación, transición, declaraciones
individuales, JSON/CSV/PDF local con revisión y resumen imprimible. Recuperación
de datos corruptos y avisos de almacenamiento. Identidad original Umbral + Dovi.

Rediseño tras consultar catálogos oficiales y abrir cuatro piezas de la galería
que compartió el usuario. Componentes reorganizados según Josh Comeau, con
implementación e `index.ts` por directorio y archivos privados colocados junto
al componente. Ver `COMPONENT_STRUCTURE.md` y `DESIGN_RESEARCH.md`.

Portada inmersiva con tres frames originales de imagegen, reconstrucción 2.5D
local renderizada con HyperFrames, cámara vertical y reproducción controlada por
scroll. Base UI para Select, Dialog, Popover y Accordion; Tailwind 4.3 y tokens
compartidos. Next Link, Image y next/font/local integrados. Nuevo cierre «Lo que
viene empieza contigo». Movimiento revisado en `MOTION_REVIEW.md`.

## Verificación ejecutada

- Node de los scripts: **v24.22.3**, comprobado con
  `pnpm exec node -p process.version`. La terminal anfitriona tiene Node 26 y
  pnpm lo advierte; los scripts resuelven el ejecutable local fijado de Node 24.
  En Vercel debe seleccionarse 24.x.
- `pnpm typecheck`: aprobado.
- `pnpm lint`: aprobado con Oxlint y plugin Stylistic.
- `pnpm format:check`: aprobado con Oxfmt tras aplicar formato.
- `pnpm catalog:validate`: aprobado; 65 cursos, total 205 por requisitos y 11
  incidencias académicas conservadas.
- `pnpm test`: **22 casos aprobados**, sin omisiones. Motor, esquemas,
  importaciones, corrupción/recuperación, créditos, correspondencias y ramas.
- `pnpm build`: aprobado en producción con comprobación TypeScript de Next.
- `pnpm test:e2e`: **18 recorridos aprobados**, 9 en escritorio y 9 en 360 px.
  Incluyen detalle, varios periodos, comparación, respaldo/recarga/recuperación,
  perfil personal separado, lote/deshacer, transición, teclado y foco,
  importación CSV, PDF sintético local, rechazo de PDF no interpretable y vista
  de impresión. Incluyen hover con contraste calculado, navegación Next entre
  perfiles, vídeo seekable y reversible, reducción de movimiento, acordeón por
  teclado y apertura/cierre de panel con restauración de foco.
- Revisión adicional en **768 × 1024**: seis secciones, sin desborde de página
  ni errores JavaScript. Capturas en `docs/screenshots/`.
- HyperFrames: check sin errores; render local de 360 frames a 30 fps por
  composición. MP4 de 12 s verificados con ffprobe: 1920 × 1080 y 720 × 1280.
  Tres imágenes y fuentes editables en `motion/ruta-world/`; sin servicios de
  generación necesarios para ejecutar la web.
- Medición de movimiento en 1440 × 1000 y 360 × 800 (CPU 4× en este último):
  scroll reversible estabilizado, 0 callbacks RAF durante la ventana en reposo,
  0 tareas largas en la ventana medida tras carga, sin errores ni desbordes.
  Resultados y entorno exactos en `MOTION_METRICS.json`; no es una medición de
  hardware móvil real. Capturas del hero y cierre nuevas en `docs/screenshots/`.
- Reporte UPAO representativo probado localmente en navegador: extracción a
  revisión sin aplicar cambios, sin capturas, trazas, fixtures o contenidos
  personales publicados. Las filas desconocidas permanecen excluidas y los
  resultados se proponen pendientes, sin deducirlos por nota.
- Commitlint: mensaje Conventional Commit válido comprobado. Husky instalado
  (`core.hooksPath=.husky/_`); no se creó ningún commit ni se alteró el staging.
- `git diff --check`: aprobado. Reportes y originales protegidos por
  `.gitignore`.

Las primeras ejecuciones detectaron un choque de puerto 3000, restricciones del
sandbox para procesos hijos y carreras del helper de pruebas antes de hidratar
el menú móvil. Se corrigieron: puerto 3100 independiente, ejecución permitida y
espera explícita del espacio montado. No se reportaron esos intentos como
éxitos. El build también detectó una fecha variable en el ejemplo de landing; se
corrigió con un perfil ficticio determinista, sin desactivar la validación de
Next.

La inspección visual adicional detectó y corrigió un canvas cuadrado dentro del
render vertical. El tamaño del renderer ahora deriva del escenario; los MP4 y
pósters se volvieron a generar y revisar. El fondo final conserva su encuadre
para evitar una ampliación excesiva.

## Límites y paso externo pendiente

No hay pruebas en hardware móvil real ni certificación de lectores de pantalla.
No hay una URL pública verificada. El build advierte el fallback local de Open
Graph mientras no exista dominio; no se inventa un canonical. La URL real puede
configurarse con el campo opcional de `.env.example`, o detectarse en Vercel.

El paso externo pendiente es conectar/importar el repositorio en un proyecto
Vercel autorizado, elegir Node 24 y desplegar. README contiene los ajustes y el
recorrido de comprobación en sesión limpia. No se envió la postulación.

La cobertura curricular y las incertidumbres no requieren rehacer el desarrollo:
se mantienen explícitas en `CURRICULUM_AUDIT.md`, el catálogo y la interfaz.
