# Auditoría curricular

Revisión: 2026-11-17. Versión normalizada: `2026-11-17.1`.

## Selección de versión y cobertura

Se usa el PDF **Codificación currículo ISIA-2025**, que declara inicio 202510 y
referencia a la Resolución de Asamblea Universitaria N.º 4-2024-AU-UPAO. La
referencia impresa no sustituye la resolución original ni determina el plan de
cada estudiante. Se conserva una sola versión coherente: Tesis II de 2 créditos,
Trabajo de investigación de 1 crédito y 58 asignaturas obligatorias.

Hay 65 opciones de asignatura: 197 créditos obligatorios y dos cupos de 4
créditos. Sumar las siete opciones electivas sería un error; el total de
requisitos de esta versión es **205**, y la suma del catálogo es **225**.

La columna derecha identifica ICSI con inicio 202220 y referencia CD N.º
203-2022-CD-UPAO. Es una columna de correspondencias, no un catálogo completo de
origen ni una columna de prerrequisitos. Se modela como cobertura parcial: no se
certifican créditos totales, saldo final ni egreso de ICSI.

## Extracción y trazabilidad

- `scripts/extract_sources.py`: lectura XML de DOCX/XLSX/PPTX sin depender de
  librerías Office; conserva coordenadas de celdas, fórmulas, valores cacheados,
  combinaciones y tablas. No procesa los reportes privados.
- PDF leído con `pdftotext -layout` y revisión visual de las filas de
  requisitos, tablas de equivalencias y celdas fusionadas de electivos. Se
  revisó la página 2 renderizada para distinguir los grupos 59 y 60.
- DOCX: tablas 5C y 5E y sumillas. Contiene diferencias internas y no se eleva
  su número de versión a jerarquía normativa.
- XLSX Instrumento: se distinguen las matrices por plan, las fórmulas VLOOKUP de
  ejemplos y la hoja con cifras individuales. Esos ejemplos y errores `#N/A` no
  son reglas de producto ni perfiles de demostración.
- XLSX v13: filas de malla y fórmulas de totales se contrastan como versión
  alternativa; no se toman sus créditos para completar filas del PDF.
- PPTX: diapositivas 13 y 14, estrategia de implementación. La frase sobre
  créditos de la malla de ingreso impide usar automáticamente 205 como saldo de
  transición.

La transcripción revisada está en `src/data/isia-2025-reviewed.csv`. El script
`build_catalog.py` genera IDs estables, códigos normalizados, expresiones,
grupos y evidencias por campo. `catalog.json` conserva SHA-256 de cada fuente,
ubicaciones e incidencias. Los originales no están publicados en `public/`.

## Reglas implementadas

Distribución de expresiones de la versión consultada:
`{'none': 6, 'pass': 34, 'unknown': 19, 'and': 5, 'set': 1}`.

- «Ninguno» solo se asigna donde el PDF lo escribe: primeras seis filas.
- Los signos `+` del PDF se interpretan como AND. No se convierte una barra de
  una sumilla en OR por su apariencia.
- Celdas vacías, conflicto ISIA-103/nombre y alcance «todo octavo ciclo» quedan
  como expresiones no resueltas, con explicación.
- «De la 1 a la 54» se convierte en el conjunto de códigos de esas filas
  obligatorias del PDF. No se compara el número de código ni el ciclo sugerido.
- Electivo I: ISIA-127, 128, 129. Electivo II: ISIA-130, 131, 132, 133. Un cupo
  por grupo. La división se revisó en las celdas fusionadas del PDF.
- El motor admite OR, umbrales y ciclos completos para nuevas fuentes; no se
  atribuyen a UPAO reglas que solo existen en pruebas sintéticas.
- No se exige ningún correquisito porque las fuentes seleccionadas no lo
  documentan. No hay umbral de nota supuesto.

## Correspondencias y contabilidad

60 correspondencias direccionales, incluidas alternativas con código en disputa.
Una tabla documentada no concede reconocimiento individual. El usuario declara
ese reconocimiento con procedencia, y el motor exige las aprobaciones de todos
los orígenes.

Los créditos originales de referencia proceden de la columna de origen de la
tabla 5E cuando el código es identificable. No se toman los créditos de destino
para llenar un origen ausente. En códigos problemáticos se conserva `null` y el
usuario puede declarar los de su reporte. Los nombres de referencia pueden
proceder de la tabla 5E; la ficha de correspondencia identifica su evidencia. No
se anuncia una malla ICSI completa por reunir estas filas.

Los intentos se deduplican por plan y código. Las aprobaciones correspondientes
en ambos planes se agrupan para no duplicar el historial; esto no agrega
reconocimiento de destino. El destino cuenta sus propios créditos una vez y
limita los electivos por cupos, sin recortar un porcentaje para ocultar errores.

## Registro de incidencias

### AC-01 · ISIA-106

- Fuente: Codificación currículo ISIA-2025.pdf.
- Ubicación: p. 1, fila 30; DOCX tabla 5C, fila 25.
- Campos: `prerequisite`.
- Hallazgo: Código ISIA-103 corresponde a Sistemas empresariales; el nombre
  indica Estadística para ingenieros (ISIA-101).
- Tratamiento: Pendiente de confirmación académica; regla no verificable.

### AC-02 · ISIA-125

- Fuente: Codificación currículo ISIA-2025.pdf.
- Ubicación: p. 2, filas 56–57; DOCX tabla 5C, filas 57–59.
- Campos: `credits,requirements`.
- Hallazgo: PDF: Tesis II 2 + Trabajo de investigación 1. DOCX y XLSX: Tesis II
  3, sin esa fila separada.
- Tratamiento: Se conserva completa la versión PDF, sin mezclar créditos.

### AC-03 · ISIA-123

- Fuente: Codificación currículo ISIA-2025.pdf.
- Ubicación: p. 2, filas 54–55; DOCX sumillas Taller integrador I y Prácticas.
- Campos: `prerequisite`.
- Hallazgo: Todo octavo ciclo no define si exige solo ciclo VIII o todos los
  anteriores; la sumilla dice hasta el octavo inclusive.
- Tratamiento: Alcance sin resolver; no se elige una interpretación de otra
  versión.

### AC-04 · Reglas y cobertura

- Fuente: ISIA Reunión con estudiantes 04_12_2024.pptx.
- Ubicación: diapositiva 14; codificación p. 3.
- Campos: `graduation,credits`.
- Hallazgo: Se exige cumplir créditos de malla de ingreso; 205 es el total de
  destino, no un saldo individual de transición.
- Tratamiento: Sin certificación de egreso. Origen parcial y destino separados.

### AC-05 · ISIA-134

- Fuente: Codificación currículo ISIA-2025.pdf.
- Ubicación: p. 2, fila 57.
- Campos: `prerequisite`.
- Hallazgo: De la 1 a la 54 refiere a filas de este documento, no a números de
  códigos ni comparación genérica de ciclos.
- Tratamiento: Conjunto explícito de las primeras 54 filas obligatorias de esta
  versión.

### AC-06 · Reglas y cobertura

- Fuente: Codificación currículo ISIA-2025.pdf.
- Ubicación: p. 2, celdas fusionadas 59 y 60; p. 3.
- Campos: `electiveGroup`.
- Hallazgo: Siete opciones electivas, pero dos cupos. Fila 59: 127–129; fila 60:
  130–133.
- Tratamiento: Un curso de 4 créditos por grupo. Recuento total: 197
  obligatorios + 8 electivos = 205.

### AC-07 · CIEN-768

- Fuente: Codificación currículo ISIA-2025.pdf.
- Ubicación: p. 1, fila 11; DOCX sumilla Física I.
- Campos: `prerequisite`.
- Hallazgo: Casilla de prerrequisito vacía; sumilla menciona Álgebra matricial.
  Otras casillas vacías tampoco dicen Ninguno.
- Tratamiento: Casilla vacía se conserva como no verificable; no se elimina
  dependencia.

### AC-08 · Reglas y cobertura

- Fuente: Instrumento malla 2025.xlsx.
- Ubicación: Matrices, filas 148,151,159; DOCX tabla 5E.
- Campos: `equivalence`.
- Hallazgo: Diferencias de códigos en Estadística descriptiva (651/655),
  Procesos (516/519) y Vigencia (1027/1012).
- Tratamiento: Correspondencias alternativas conservadas como pendientes, nunca
  reconocimiento automático.

### AC-09 · Reglas y cobertura

- Fuente: Codificación currículo ISIA-2025.pdf.
- Ubicación: encabezado p. 1 y columna derecha.
- Campos: `originCoverage`.
- Hallazgo: La columna ICSI no es la malla de origen completa ni describe todos
  sus prerrequisitos.
- Tratamiento: ICSI 2022 solo catálogo parcial para historial y transición; no
  planificable como plan completo.

### AC-10 · Reglas y cobertura

- Fuente: Codificación currículo ISIA-2025.pdf.
- Ubicación: p. 1 filas 1–6 y casillas de requisito vacías restantes.
- Campos: `prerequisite`.
- Hallazgo: Ninguno es explícito en las primeras seis filas; una celda en blanco
  no aporta la misma evidencia.
- Tratamiento: Las demás ausencias quedan por verificar, aunque haya sumillas de
  propuesta que sugieran Ninguno.

### AC-11 · Reglas y cobertura

- Fuente: 1 Ingeniería de Sistemas e Inteligencia Artificial v17.docx.
- Ubicación: tabla 5C y sumillas Percepción, Modelos generativos, PLN, Tesis I,
  UX/UI.
- Campos: `prerequisite`.
- Hallazgo: Hay diferencias internas en requisitos entre tablas y sumillas,
  además de la versión PDF.
- Tratamiento: Se preservan como versiones de contraste; no se mezclan para
  fabricar una versión nueva.

## Validación

`pnpm catalog:validate` comprueba códigos e IDs duplicados, referencias, ciclos
del grafo, créditos positivos, suma de requisitos, grupos y fuentes. Las reglas
problemáticas no se borran para pasar el validador. El resultado estructural
válido no resuelve las incidencias académicas anteriores.
