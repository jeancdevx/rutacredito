# Investigación y decisiones de diseño

Revisión de referencias y capturas reales: 18 de noviembre de 2026.

Se consultaron los catálogos oficiales de
[shadcn/ui, Sidebar](https://ui.shadcn.com/docs/components/base/sidebar),
[Untitled UI, navegación lateral](https://www.untitledui.com/react/components/sidebar-navigations),
[Untitled UI, cabeceras](https://www.untitledui.com/react/components/header-navigations),
[Radix, Segmented Control](https://www.radix-ui.com/themes/docs/components/segmented-control)
y [Radix, Badge](https://www.radix-ui.com/themes/docs/components/badge).
Aplicación propia: navegación agrupada, pie de utilidades, cabecera contextual,
superficie principal contenida, controles de vista y estados con icono y texto.
No se importaron plantillas completas ni se cambiaron los assets de marca.

También se abrió la
[galería enviada por el usuario](https://miaai-lab.github.io/Claude-Opus-5.5-100-HTML-Files/)
en Chrome. Se inspeccionaron cuatro piezas:

- [RASTER](https://miaai-lab.github.io/Claude-Opus-5.5-100-HTML-Files/003-swiss-poster-machine.html):
  contraste de escala y composición tipográfica.
- [Nimbus](https://miaai-lab.github.io/Claude-Opus-5.5-100-HTML-Files/012-nimbus-weather.html):
  escena dominante con controles y datos integrados.
- [QUANTA](https://miaai-lab.github.io/Claude-Opus-5.5-100-HTML-Files/060-trading-terminal.html):
  densidad organizada y jerarquía de datos.
- [Portfolio bento](https://miaai-lab.github.io/Claude-Opus-5.5-100-HTML-Files/068-bento-portfolio.html):
  tamaños asimétricos, profundidad y un foco claro por superficie.

La adaptación a RutaCréditos es el explorador de conexiones: un tramo de
prerrequisitos reales, con estaciones seleccionables, estado calculado por el
motor y explicación inmediata. El tramo indica que no sustituye todos los
requisitos AND. La landing utiliza un perfil ficticio determinista y abre la
ficha elegida en el demo. No se copió código de las piezas de referencia, ni se
redistribuyen sus capturas o sus contenidos.

| Antes                               | Después                                              | Motivo                                                |
| ----------------------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| Maqueta estática del producto       | Explorador funcional en la landing                   | El primer contacto permite entender una decisión real |
| Cabecera extensa y sidebar estirado | Sidebar con altura de viewport y cabecera contextual | Navegación estable y espacio principal definido       |
| Estados tipográficos pequeños       | Etiquetas suaves con iconos y texto                  | Lectura consistente sin depender del color            |
| Solo catálogo de tarjetas           | Tramo de ruta seleccionable, ciclos y lista          | Vista distintiva con utilidad académica               |
| Navegación móvil amontonada         | Accesos rápidos y diálogo de navegación              | Controles al alcance y foco gestionado                |

Newsreader 600, Instrument Sans y la paleta Umbral prevalecen sobre estilos de
las referencias. Dovi y el logo son los originales. El motor y sus datos no se
alteran para obtener un efecto visual. Se limita el movimiento a respuestas
breves a acciones, sin bucles en la malla y con `prefers-reduced-motion`.

## Recorrido inmersivo y componentes

Se revisaron el
[repositorio de Arko](https://github.com/midudev/mcp-higgsfield-landing) y su
[versión publicada](https://arko-sushi.midudev.workers.dev/) en navegador,
incluido el comportamiento al avanzar y retroceder. La referencia relevante es
la imagen a pantalla completa, la profundidad, el texto subordinado y la
navegación compacta. No se copiaron fotos, vídeos, marca ni código del
restaurante.

La aplicación usa [Base UI](https://base-ui.com/react/components/select) 1.9:
Select, Dialog y Popover con foco, teclado y portales. Los desplegables visibles
ya no son selectores nativos. Tailwind 4.3 utiliza los tokens Umbral; se aplica
al Select y a la navegación. Las superficies académicas existentes conservan CSS
específico. Next Link, Image y next/font/local se utilizan en las rutas, assets
y fuentes; no se conservan anchors ni img en el JSX del producto.

Los tres frames de imagegen se conservan en `motion/ruta-world/assets/frames/`.
El proyecto HyperFrames y su revisión explican el render 2.5D local. No se
presenta como vídeo generado por Higgsfield ni como instalaciones reales de
UPAO. El scrub usa blobs, búsquedas de frame coalescidas, cámara vertical,
póster y una alternativa sin vídeo para movimiento reducido o ahorro de datos.
