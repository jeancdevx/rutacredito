# RutaCréditos

**Tu próximo paso, claro.** Aplicación pública, gratuita y sin cuenta para
consultar avance ISIA, revisar transición desde ICSI y explorar próximos ciclos.
Todos los datos del visitante se procesan en su navegador. No requiere API de
IA, base de datos ni servicios externos.

## Ejecutar

Requisitos: **Node 24 LTS** (fijado a 24.22.3 en `.nvmrc` y `.node-version`) y
**pnpm 10.33.2**. El manifiesto también fija el ejecutable local de Node para
que los scripts utilicen Node 24. Si la terminal usa otra versión, activa
primero Node 24 con tu gestor; no ignores el aviso de `engines` en el entorno de
despliegue.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Abrir el Local URL que imprime Next, normalmente `http://localhost:3000`. El
acceso a `/app?mode=demo` carga un perfil ficticio aislado. `/app` abre el
espacio personal y su configuración. La demo nunca reemplaza el espacio
personal.

```sh
pnpm typecheck
pnpm lint
pnpm format:check
pnpm catalog:validate
pnpm test
pnpm build
pnpm start
```

`pnpm check` reúne las comprobaciones de código, catálogo, motor y build. Next
16.4.6 / React 19.3, TypeScript, CSS con variables y fuentes locales. Las
dependencias y el lockfile están fijados.

## Pruebas de navegador

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwright inicia producción en **3100**, separado del dev en 3000. Requiere un
build previo. Detecta el Chrome local de este entorno; en otros equipos utiliza
el Chromium instalado por Playwright. Se puede indicar otro ejecutable mediante
`PLAYWRIGHT_CHROMIUM_EXECUTABLE`.

Los recorridos usan exclusivamente perfiles y PDFs sintéticos. Cubren escritorio
y 360 px, foco, demo/personal, historial por lote y deshacer, detalle, periodos,
comparación, respaldo, recarga, recuperación e importaciones. Las capturas se
escriben en `docs/screenshots/`; los informes temporales están ignorados por
git. `docs/STATUS.md` registra resultados y límites de la verificación.

## Qué está implementado

- Landing con explorador de conexiones real sobre un ejemplo ficticio.
- Configuración explícita de cohorte, plan de ingreso y transición, sin deducir
  el plan por el año ni por prefijos de cursos.
- Avance de destino, créditos originales conocidos, electivos por cupos e
  incertidumbres separadas.
- Historial de intentos, búsqueda, edición por lote con resumen, deshacer y
  eliminación confirmada.
- Malla por conexiones, ciclos y lista; ficha con reglas, razones, dependientes,
  correspondencias y fuentes.
- Planificador de varios periodos, carga preferida, heurística determinista,
  escenarios persistidos y comparación con diferencias.
- Transición con evidencia y declaraciones individuales separadas de la tabla.
- Respaldo/importación JSON, plantilla e historial CSV, exportación de
  escenarios, lector PDF local con revisión y resumen imprimible para guardar
  PDF.
- Almacenamiento versionado, recuperación de copia anterior válida, advertencias
  de cuota/restricción y protección ante cambios en otra pestaña.

## Cobertura académica

Catálogo ISIA de **Codificación currículo ISIA-2025.pdf**, inicio documentado
202510: 65 opciones de asignatura, 58 obligatorias y dos cupos electivos.
**197 + 8 = 205 créditos de requisitos**; no se suman todas las opciones
electivas. ICSI 2022 es únicamente origen parcial para historial y
correspondencias. No se anuncia una malla ICSI completa ni se certifica egreso
de transición.

Hay 11 incidencias académicas preservadas, incluidas ISIA-103/nombre del
requisito de Aprendizaje estadístico, alcance «todo octavo ciclo», diferencia
Tesis II / Trabajo de investigación y discrepancias de códigos de origen. Las
reglas vacías o contradictorias devuelven «no verificable». Ver
[la auditoría](docs/CURRICULUM_AUDIT.md) y [límites](docs/KNOWN_LIMITATIONS.md).

La tabla documental no convalida cursos individuales. Los créditos mínimos se
evalúan al inicio de un periodo. En curso no significa aprobado. Una simulación
solo asume aprobados los cursos válidos de periodos anteriores; nunca habilita
prerrequisitos dentro del mismo periodo. Ninguna vista representa oferta real,
horarios o vacantes de la universidad.

## Estructura y mantenimiento

Se sigue la
[convención de Josh Comeau](https://www.joshwcomeau.com/react/file-structure/):
`src/components/Nombre/Nombre.tsx` e `index.ts` con reexportación explícita,
hijos/constantes/estilos locales junto al componente y funciones de dominio en
`src/helpers/`. Ver [estructura](docs/COMPONENT_STRUCTURE.md).

El motor puro está en `src/helpers/academic.helpers.ts`, separado de React,
almacenamiento y componentes. Los esquemas Zod están en
`src/helpers/validation.helpers.ts`; la contabilidad no depende de componentes.

Para agregar un plan:

1. Incorporar fuentes autorizadas y una versión coherente. Registrar cobertura,
   vigencia, total de requisitos y cada incidencia sin resolver.
2. Añadir cursos con IDs propios de versión, código original/normalizado,
   créditos, ciclo, obligatoriedad, grupo y evidencia por campo. Las expresiones
   pueden ser `none`, `pass`, `and`, `or`, `credits`, `set`, `cycles` o
   `unknown`.
3. Añadir correspondencias direccionales por conjuntos, condiciones, versiones y
   evidencia. Nunca asumir reconocimiento individual por coincidir un código.
4. Ampliar las opciones admitidas del esquema de perfil/intentos/escenario y el
   onboarding solo para la nueva cobertura validada. Las ramas visuales son
   específicas de versión y se añaden únicamente si sus aristas son
   verificables.
5. Ejecutar el validador y pruebas sintéticas de ese plan; contrastar totales y
   cupos. El motor recibe el catálogo como argumento y no necesita reescribirse.

La app funciona con `src/data/catalog.json` incluido; no necesita los
originales. Para reproducir la extracción, situar los insumos en la carpeta
privada de fuentes `docs/Umbral_Dovi_Final/`, luego ejecutar:

```sh
pnpm catalog:extract
pnpm catalog:build
pnpm catalog:validate
```

La extracción Office utiliza Python 3 estándar y conserva tablas, coordenadas y
fórmulas. La lectura inicial del PDF requiere `pdftotext`/`pdftoppm`; la
transcripción revisada se conserva como CSV. No se ejecutan scripts internos del
kit de marca.

## Privacidad y archivos

Los originales están ignorados. Los reportes personales se mantienen en
`docs/private/`, también ignorada. No se deben añadir a fixtures, capturas,
publicaciones, variables de entorno ni bundles. La app no importa esos archivos
ni conserva PDFs originales. No incluye analítica ni envía historial a un
servidor.

localStorage es local a este origen y navegador, puede borrarse y no sincroniza.
Exportar JSON antes de cambiar de dispositivo u origen. Las copias exportadas
contienen lo que se registró; deben conservarse de forma privada.

## Calidad de código y commits

- Oxlint y Oxfmt reemplazan ESLint. `pnpm lint:fix` y `pnpm format` aplican
  reglas.
- Husky: `pre-commit` ejecuta lint-staged y `commit-msg` comprueba Conventional
  Commits con commitlint. Ejemplos: `feat: añadir escenario`,
  `fix: corregir cálculo`.
- `pnpm install` ejecuta `prepare`: instala hooks cuando hay `.git` y copia el
  worker PDF local de la versión fijada. No utiliza CDN.
- Las licencias OFL de Newsreader e Instrument Sans están en `public/brand/`.

## Desplegar en Vercel

No hay un proyecto de despliegue conectado ni un enlace público comprobado en
este checkout. El build local está preparado para la plataforma estándar
Next.js.

1. Subir estos cambios al repositorio autorizado mediante el flujo habitual.
2. En Vercel, importar `jeancdevx/rutacredito`, raíz del repositorio y framework
   **Next.js**. Seleccionar **Node.js 24.x** en Build and Deployment.
3. Install: `pnpm install --frozen-lockfile`. Build: `pnpm build`. Output: valor
   predeterminado de Next.js. No configurar API keys ni una base de datos.
4. Opcional: establecer `NEXT_PUBLIC_SITE_URL` con la URL pública real. Si no se
   define, se detectan las variables Vercel de dominio. Localmente, sin URL, no
   se inventa un canonical; Next puede avisar que usa localhost para el OG.
5. Desplegar. En una sesión limpia comprobar `/`, demo, ficha, escenario,
   comparación, descarga y recuperación JSON. Abrir también desde un móvil.
6. Conservar la aplicación accesible hasta el 21 de noviembre de 2026 según las
   bases suministradas. No se ha enviado ninguna postulación.

[Node 24 está soportado por Vercel](https://vercel.com/changelog/node-js-24-lts-is-now-generally-available-for-builds-and-functions).
`.env.example` enumera los únicos campos opcionales; las funciones principales
funcionan sin variables.

## Material de demostración

[Guion de 2 minutos](docs/DEMO_SCRIPT.md),
[descripción de postulación](docs/SUBMISSION.md),
[investigación de diseño](docs/DESIGN_RESEARCH.md),
[plan de implementación](docs/IMPLEMENTATION_PLAN.md) y
[capturas reales con perfiles ficticios](docs/screenshots/).

### Recorrido de la portada

Los vídeos entregados están en `public/hero/` y no necesitan claves ni servicios
de generación para funcionar. Se usan `Link`, `Image`, fuentes locales de Next y
Tailwind 4 con tokens de marca. Select, Dialog y Popover proceden de Base UI.

El proyecto editable de HyperFrames está en `motion/ruta-world/`. Sus tres
imágenes originales generadas con imagegen se conservan en `assets/frames/`, con
prompts y procedencia. El render reconstruye una escena 2.5D con portales,
profundidad y cámara; no es una filmación de UPAO ni un vídeo de
Higgsfield/Sora.

Para volver a renderizar (Node 24, pnpm, Chromium con WebGL y FFmpeg
instalados):

```bash
pnpm motion:prepare
pnpm motion:render
pnpm motion:encode
```

El CLI HyperFrames está fijado en 0.9.65 para esa tarea de autoría. Los masters
y cachés quedan ignorados; los MP4 y pósters finales se incluyen para desplegar.
La cámara móvil se renderiza a 1080 × 1920 y se distribuye a 720 × 1280. El
vídeo solo sigue el scroll; movimiento reducido y ahorro de datos usan una
alternativa estática. El modo local no hace solicitudes a generadores de medios.

El recorrido puede seguir editándose en la aplicación de escritorio de
[HyperFrames](https://hyperframes.studio/studio/download?os=linux&src=cli),
abriendo el proyecto `motion/ruta-world`. Antes de abrirlo allí, detén cualquier
preview de ese proyecto para evitar dos editores sobre los mismos archivos.
