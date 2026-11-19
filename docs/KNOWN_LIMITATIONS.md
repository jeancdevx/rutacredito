# Límites reales

- **Destino cubierto:** catálogo ISIA de la codificación que documenta inicio
  202510, 65 asignaturas y 205 créditos de requisitos. Las celdas vacías y
  reglas contradictorias no se transforman en «Ninguno». Consultar el registro
  en `src/data/catalog.json` y `CURRICULUM_AUDIT.md`.
- **Origen ICSI 2022 parcial:** se dispone de correspondencias y algunos
  créditos de referencia, no de una malla completa con todas sus reglas. No se
  anuncia cobertura integral de ICSI 2015/2019 ni de cohortes sin evidencia.
- **Transición individual:** una tabla no acredita convalidación personal. Las
  declaraciones del usuario requieren aprobación de origen y nota de
  procedencia. No se calcula un saldo definitivo de egreso de transición.
- **Versiones:** PDF, DOCX v17 y XLSX v13 no se fusionan. Se conserva Tesis II 2
  y Trabajo de investigación 1 del PDF. Los dos cupos electivos limitan el
  avance.
- **Oferta:** no hay horarios, vacantes, oferta semestral ni límite de matrícula
  oficial. La carga es preferencia personal. Las simulaciones suponen oferta y
  aprobación; no garantizan una ruta óptima ni fecha de egreso.
- **Periodos:** códigos de periodo de seis dígitos con terminaciones 10, 20
  o 30. La interfaz añade automáticamente periodos ordinarios 10/20. No se
  afirma que un periodo de verano oferte cursos. Máximo 12 periodos por
  escenario y 30 escenarios por espacio.
- **PDF:** lector local de reportes de notas de texto con columnas probadas de
  código, créditos, periodo, tipo y promedio. No deduce aprobación por promedio:
  propone resultados pendientes para revisión. Las fichas de matrícula y los
  escaneados no se importan con un éxito simulado; se ofrece CSV/editor. Sin
  OCR.
- **Persistencia:** localStorage no sincroniza dispositivos y puede borrarse o
  ser bloqueado. Se ofrece copia anterior válida, respaldo externo y avisos de
  cambios entre pestañas. Deshacer mantiene hasta 10 estados de esta sesión.
- **Respaldo:** versión de esquema 1. Versiones futuras no compatibles se
  rechazan; no hay una migración ficticia de esquemas que aún no existen.
  JSON/CSV hasta 2 MB, PDF hasta 10 MB y 30 páginas, 2000 intentos por espacio.
- **Dispositivos:** las pruebas automatizadas emulan tamaños y entrada táctil en
  Chromium. No sustituyen una prueba en hardware móvil real ni validan todos los
  lectores de pantalla.
- **Despliegue:** el repositorio no tiene un destino Vercel conectado ni una URL
  pública verificada. El paso externo pendiente es importar el repositorio en un
  proyecto autorizado de Vercel y desplegar con Node 24; ver README.

La portada usa una reconstrucción 2.5D de imágenes conceptuales, con una cámara
renderizada localmente por HyperFrames. Las uniones y la profundidad se
infieren; no reproduce una filmación ni un modelo arquitectónico completo. La
interfaz permanece utilizable si el vídeo no carga, con movimiento reducido o
ahorro de datos. No se probó en un iPhone físico; las comprobaciones móviles
usan Chromium emulado y no sustituyen esa comprobación de Safari.
