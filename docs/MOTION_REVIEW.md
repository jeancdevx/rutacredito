# Revisión de movimiento · RutaCréditos

Aplicación de `review-animations`, `animate`, `choreograph`,
`animation-performance` y `mobile-native`. Las curvas provienen de sus tablas;
se conserva `--ease` y se añade la curva específica de paneles `--ease-drawer`.

| Antes                                                                | Después                                                                                                        | Por qué                                                                                |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Scroll → búsqueda inmediata de un frame lejano                       | Interpolación 0.18 de scroll-world normalizada por tiempo; se detiene al estabilizarse                         | Evitar saltos al mover rueda o invertir dirección, sin un bucle permanente             |
| Titulares desmontados con keyframes nuevos                           | Tres estados superpuestos en una cuadrícula; transiciones de opacity/transform, entrada 280 ms y salida 140 ms | Se pueden interrumpir; la altura no cambia al alternar y las acciones permanecen fijas |
| Aviso montado/desmontado con keyframes                               | Aviso persistente con estado, transición de opacity/translate y salida 160 ms                                  | Una nueva operación puede retomar el movimiento desde su posición actual               |
| Panel y fondo con tiempos inconexos                                  | Fondo/modal 250 ms; lateral 300 ms con curva de drawer; salida 160 ms                                          | Se leen como una sola respuesta; cerrar resulta más rápido                             |
| Preguntas con apertura nativa instantánea                            | Accordion de Base UI, altura medida 200 ms y control por teclado                                               | Relación visible entre pregunta y respuesta; excepción de altura justificada           |
| Cambio de sección académica con fade                                 | Cambio inmediato                                                                                               | Los datos y las acciones frecuentes no esperan una animación                           |
| Hover con desplazamiento y sombra animada sin filtrar puntero        | Movimiento de 1 px en tarjetas solo con mouse preciso; sombra fija                                             | Evita hover pegajoso en táctil y repintado innecesario                                 |
| Reducción global que anulaba todo                                    | Vídeo estático y desplazamientos desactivados; fades breves en superficies                                     | Respeta la preferencia sin perder la confirmación visual                               |
| «No tienes que ver todo el camino» y palabras con retrasos uniformes | «Lo que viene empieza contigo», un único gesto editorial y acciones siempre disponibles                        | Cierre positivo y concreto; no retrasa la conversión                                   |

## Dictamen

Se corrigieron los problemas de interrupción, frecuencia, origen y respuesta por
teclado. Los datos académicos, las filas y las cifras permanecen inmóviles. Los
popovers escalan desde `--transform-origin`, con foco gestionado por Base UI. No
se añadieron gestos de arrastre sin necesidad ni una biblioteca de animación
para efectos que resuelven CSS y Web Animations API.

La inspección de código verifica propiedades y presupuestos. La comprobación de
navegador mide recuperación tras cambios rápidos, decodificación y bucles en
reposo. Los resultados están en `MOTION_METRICS.json`; las pruebas funcionales
se registran en `STATUS.md`. Chromium con CPU limitada no certifica rendimiento
de GPU o Safari en un teléfono físico. Ese contraste sigue pendiente.

Decisión de código: **aprobado para la comprobación funcional y visual**. El
rendimiento en hardware móvil real requiere una medición posterior; no se afirma
que se haya probado.
