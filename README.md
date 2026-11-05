# Cuestionario de satisfacción — Formaciones grupales (Arturo Alba)

Mismo diseño que "La Fórmula del Saber", con las 5 preguntas del cuestionario de satisfacción.
HTML + CSS + JS puros, sin build. Se puede subir tal cual a GitHub/Vercel.

## Páginas
- `index.html` — portada
- `pregunta-1.html` a `pregunta-6.html` — una pregunta por página (la 1 es la ciudad, campo de texto obligatorio)
- `gracias.html` — pantalla final

## Imágenes que tienes que subir a `assets/images/`
Cada pregunta tiene un panel con foto. Ahora mismo hay imágenes de relleno (copiadas de la web anterior): sustitúyelas subiendo las tuyas con el mismo nombre.

| Página | Archivo |
|---|---|
| pregunta-1.html (ciudad) | `encuesta-ciudad.png` |
| pregunta-2.html | `encuesta-1-valoracion-global.png` |
| pregunta-3.html | `encuesta-2-utilidad.png` |
| pregunta-4.html | `encuesta-3-formador.png` |
| pregunta-5.html (productos) | `encuesta-4-producto.png` |
| pregunta-6.html | `encuesta-5-proxima-formacion.png` |

`fondo-landing.png`, `fondo-final.png`, `logotipo.png` y `favicon.png` ya están (son los de la web anterior).

## QR por sesión
Genera el QR con la URL de la portada añadiendo la sesión:
`https://tu-web.vercel.app/?sesion=Madrid-2026-11-12`
Ese valor se guarda con cada respuesta, así puedes calcular la media por formación.

## Recoger las respuestas en Google Sheets (cuenta verbenacolectivo@gmail.com)

Las respuestas llegan a una hoja de cálculo de la cuenta de Google con la que se haga este proceso.
Hay que hacerlo una sola vez (unos 5 minutos):

1. Entra en Google con la cuenta que va a recibir los datos y crea una hoja nueva (sheets.new).
   Ponle un nombre, por ejemplo "Cuestionario satisfacción formaciones".
2. Menú **Extensiones → Apps Script**. Borra lo que haya y pega todo el contenido de
   `apps-script/Code.gs`. Guarda (icono del disquete).
3. En el desplegable de funciones elige **configurar** y pulsa **Ejecutar**. Acepta los permisos
   (si aparece "Google no ha verificado esta aplicación": *Configuración avanzada → Ir a ... (no seguro)*;
   es tu propio script). Se crean las pestañas de la hoja.
4. **Implementar → Nueva implementación → Aplicación web**.
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
   Pulsa Implementar y copia la URL (termina en `/exec`).
5. Pega esa URL en `ENDPOINT` al principio de `js/survey.js` (entre las comillas) y sube la web.
6. Prueba: rellena el cuestionario una vez, comprueba que aparece la fila en "Respuestas" y bórrala.

Si algún día cambias `Code.gs`, hay que hacer *Implementar → Administrar implementaciones →
editar (lápiz) → Versión: nueva versión → Implementar*; la URL no cambia.

### Pestañas que se crean
- **Respuestas**: una fila por cuestionario (fecha, sesión, ciudad, 3 valoraciones, producto, tema propuesto).
- **Resumen**: total de respuestas, medias globales, si se cumple el objetivo (media ≥ 8) y
  nº de respuestas y medias por sesión. Todo se actualiza solo.
- **Ciudades**: nº de respuestas y medias por ciudad.
- **Productos**: ranking de productos elegidos, con gráfico.
- **Temas**: respuestas abiertas de la última pregunta (tema para la próxima formación), de la más reciente a la más antigua, con su sesión y ciudad.

Para que se agrupe por formación, el QR debe llevar la sesión: `https://tu-web/?sesion=Madrid-2026-11-12`.

Las respuestas son anónimas: no se guarda nombre, correo ni ningún identificador de la persona.

## Editar textos
- Preguntas y opciones: directamente en cada `pregunta-N.html`.
- Lista de productos: `pregunta-5.html` (cada `<li>` es un producto). Si cambias algún nombre, se guarda tal cual en la hoja.

## Si ya tenías la hoja creada antes de añadir la pregunta de ciudad
La hoja ahora tiene una columna más (Ciudad), así que:
1. En la pestaña Respuestas, borra las filas de prueba (todo menos la fila 1).
2. Pega el nuevo `Code.gs` en Apps Script, guarda y ejecuta **configurar** otra vez.
3. Implementar → Administrar implementaciones → lápiz → Nueva versión → Implementar.
