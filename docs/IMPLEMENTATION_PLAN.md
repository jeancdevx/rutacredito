# RutaCréditos: plan de implementación

Estado inicial: starter Next.js 16.4.6 / React 19.3, sin funciones de producto.
Se conserva el cambio previo del usuario en `.gitignore`.

1. [completo] Inventariar fuentes, proteger reportes personales, extraer tablas
   y registrar diferencias por versión. Seleccionar un catálogo coherente.
2. [completo] Configurar Node 24, pnpm, Oxlint/Oxfmt, Husky, lint-staged y
   Conventional Commits. Integrar marca y fuentes locales.
3. [completo] Implementar esquema versionado, motor puro de tres valores,
   equivalencias, contabilidad, simulación y validadores con pruebas sintéticas.
4. [completo] Entregar entrada → perfil/demo → historial → malla explicada →
   escenario persistido. Mantener demo y perfil personal aislados.
5. [completo] Comparación, transición, importación revisable JSON/CSV/PDF local,
   exportaciones e impresión. Recuperación de almacenamiento.
6. [completo] Revisar teclado, móvil/tableta/escritorio y capturas sintéticas.
   Ejecutar typecheck, lint, tests y build. Corregir fallos observados.
7. [completo] Documentar cobertura, límites, demostración y despliegue.

## Dirección de interfaz

Landing breve: cabecera, hero con vista real del producto, tres pasos, beneficio
editorial y preguntas frecuentes; pie con fuentes y privacidad. Hero: «Tu
próximo paso, claro.» / «Entiende tu avance, revisa qué te falta y explora tus
próximos ciclos con reglas que puedes consultar.» CTA «Explorar mi malla» y
acceso secundario «Probar con un ejemplo». Sin cuenta; los datos permanecen en
el navegador. Beneficios: explicar bloqueos, distinguir créditos y ensayar
escenarios. Tres pasos: confirmar plan, registrar avance, explorar próximos
ciclos. FAQ: cobertura, privacidad, aprobación individual de equivalencias,
simulaciones, recuperación y oferta real. SEO: indexable, título y descripción
descriptivos; sin canonical hasta disponer de URL pública. Composición editorial
con producto como protagonista, papel/ciruela/coral y assets originales Umbral +
Dovi.

Las instrucciones explícitas de marca del usuario prevalecen sobre elecciones
tipográficas genéricas de las skills. Motion solo como respuesta breve a
acciones, con reducción de movimiento; navegación y datos sin animaciones
repetitivas.

## Cierre de implementación

Entregas verticales ejecutadas. Se añadieron el rediseño investigado, el
explorador funcional y la estructura `src/components/Nombre/Nombre.tsx` según la
convención solicitada. La verificación final y los pasos externos quedan en
`STATUS.md`. La publicación requiere conectar el repositorio a un proyecto
Vercel autorizado; no se ha inventado un enlace ni enviado una postulación.

## Refinamiento solicitado

8. [completo] Integrar Base UI, Next Link/Image y next/font/local, y Tailwind 4.
9. [completo] Revisar Arko en web y código; generar tres frames conceptuales y
   renderizar la escena 2.5D local con HyperFrames en horizontal y vertical.
10. [completo] Corregir hover, capas y acciones del hero; reescribir el cierre.
11. [completo] Revisar movimiento e interrupciones, teclado, reducción de
    movimiento y CPU limitada; 18 recorridos de navegador y capturas nuevas.

Los límites del render 2.5D y de la prueba móvil emulada son explícitos en
`MOTION_REVIEW.md`, `MOTION_METRICS.json` y `KNOWN_LIMITATIONS.md`.
