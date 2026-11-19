# Estructura de componentes

Se aplica la convención de
[Josh W. Comeau, Delightful React File/Directory Structure](https://www.joshwcomeau.com/react/file-structure/),
consultada el 18 de noviembre de 2026: organización por función, directorios
PascalCase, implementación con nombre propio y punto de entrada mínimo. Cada
`index.ts` reexporta explícitamente el componente; no contiene implementación ni
exporta con comodines, siguiendo la advertencia del artículo para App Router.

```text
src/
  app/                         Rutas y layouts exigidos por Next.js
  components/
    CurriculumMap/
      CurriculumMap.tsx
      CurriculumMap.css
      CurriculumMap.constants.ts
      CourseDetail.tsx          Hijo privado
      RuleText.tsx              Hijo privado
      index.ts
    CourseRoute/
      CourseRoute.tsx
      CourseRoute.css
      CourseRoute.constants.ts
      index.ts
    Planner/
      Planner.tsx
      Planner.helpers.ts
      index.ts
    WorkspaceFrame/
      WorkspaceFrame.tsx
      WorkspaceFrame.css
      index.ts
    …
  helpers/
    academic.helpers.ts         Motor puro, sin React ni almacenamiento
    curriculum.helpers.ts       Catálogo y normalización
    storage.helpers.ts          Persistencia y recuperación
    transfer.helpers.ts         Importación/exportación
    validation.helpers.ts       Esquemas y tipos de dominio
  data/                         Catálogo normalizado y transcripción revisada
```

Importar componentes como `@/components/CurriculumMap`. Los detalles privados se
importan relativamente dentro de su carpeta. Un hijo compartido se promueve a su
propio directorio; no se crea un barrel global que importe todos los
componentes. Los estilos propios se colocan junto al componente y los tokens,
fuentes, reset y estilos compartidos permanecen en `src/app/globals.css`. No se
crean carpetas vacías de hooks o utilidades: se añaden cuando existe una función
reutilizable real. Pruebas de dominio y recorridos permanecen en `tests/`.

`LandingNavigation`, `ScrollWorldHero`, `InteractionMode` y `Select` siguen la
misma convención: carpeta por componente y exportación explícita. Los wrappers
de Base UI viven en sus carpetas y exponen una API pequeña. Tailwind recibe los
tokens de marca desde `src/app/globals.css`; no hay configuración paralela de
colores o fuentes. El render de vídeo vive fuera del bundle en `motion/`.

`ClosingInvitation`, `FAQ` y `NoticeToast` encapsulan el cierre editorial, el
acordeón y los avisos. Las herramientas de revisión y render están en
`scripts/`; el motor académico no depende de las animaciones.
