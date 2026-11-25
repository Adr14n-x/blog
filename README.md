# Blog

Blog estático hecho con tres ficheros: `index.html`, `styles.css` y `app.js`.
Usa solo HTML5, CSS y JavaScript, sin frameworks ni librerías externas.
No necesita servidor ni instalación: se abre `index.html` en el navegador o se publica en GitHub Pages.

## Funcionalidades

- Tres entradas de ejemplo con texto e imagen.
- Lateral con las categorías: al pulsar una se ven solo sus entradas.
- Página de cada entrada con sus comentarios.
- Registro y acceso de usuarios. Los usuarios conectados pueden comentar.
- El administrador puede crear, editar y borrar entradas, y crear, renombrar y borrar categorías.

Usuario administrador:

| Email          | Contraseña |
|----------------|------------|
| admin@blog.com | admin      |

## Limitaciones por ser una web estática

Al no haber servidor ni base de datos, todos los datos viven en memoria, en variables de `app.js`:

- Todo lo que se crea (entradas, comentarios, categorías, usuarios) se pierde al recargar la página y vuelven los datos de ejemplo.
- Cada visitante ve solo sus propios cambios, no los de los demás.
- El registro y el acceso son una simulación: no hay seguridad real.

## Cómo verlo

- **En local:** abrir `index.html` con doble clic en el navegador.
- **En GitHub Pages:** subir los tres ficheros a un repositorio de GitHub y, en *Settings > Pages*, elegir la rama `main` y la carpeta `/ (root)`. La web queda publicada en `https://<usuario>.github.io/<repositorio>/`.

## Estructura

```
index.html   Layout (cabecera, menú, lateral, contenido y pie) y plantillas <template> de cada página
styles.css   Todos los estilos: colores, layout (Grid y Flexbox), tarjetas, formularios y botones
app.js       Datos de ejemplo, navegación y lógica de cada página
```

## Cómo funciona

### Idea general

Cada fichero tiene un papel: `index.html` da la forma, `styles.css` el aspecto y `app.js` los datos y la lógica. `app.js` no contiene HTML: copia las plantillas de `index.html` y las rellena con los datos.

Cualquier cambio sigue siempre el mismo ciclo: **se modifican los datos en memoria y se vuelve a pintar la página.**

```
clic en un enlace  ->  cambia la dirección (#/entrada/1)
                   ->  navegar() decide la página
                   ->  mostrarEntrada(1) busca los datos
                   ->  rellenarPlantilla() copia el <template> y lo rellena
                   ->  se pinta en #contenido con los estilos de styles.css
```

### index.html: parte fija y plantillas

- **Parte fija:** cabecera, menú, lateral de categorías y pie. En el centro hay dos huecos que rellena `app.js`: `#contenido`, donde se pinta cada página, y `#mensaje-error`, la caja roja de errores.
- **Plantillas:** una etiqueta `<template>` por cada página o elemento repetido (resumen de entrada, entrada completa, comentario, login, registro, panel, fila del panel, editor...). Un `<template>` no se ve en la página: es un molde que `app.js` copia cuando lo necesita.

El HTML y el JavaScript se conectan con estos atributos:

| Atributo                       | Significado                                         | Lo usa                  |
|--------------------------------|-----------------------------------------------------|-------------------------|
| `data-campo="titulo"`          | Aquí va el dato `titulo`                            | `rellenarPlantilla()`   |
| `data-visible="admin"`         | Enlace del menú solo para `invitado`, `usuario` o `admin` | `pintarMenu()`    |
| `data-accion="borrarEntrada"`  | Botón del panel que ejecuta esa acción              | Manejador de clics del panel |
| `name="email"`                 | Nombre del dato al enviar un formulario             | `alEnviarFormulario()`  |
| `href="#/admin"`               | Página a la que lleva un enlace                     | `navegar()`             |

### styles.css

Solo da aspecto, no interviene en la lógica. Los colores están en variables CSS al principio del fichero (`--azul`, `--rojo`...). Las dos columnas (lateral y contenido) se colocan con CSS Grid. Los botones usan la clase `boton`, con las variantes `boton-secundario` y `boton-peligro`. Como las clases ya están en las plantillas, lo que pinta `app.js` sale con estilo.

### app.js, por bloques

**1. Datos.** Tres listas: `usuarios`, `categorias` y `entradas`. Cada entrada guarda el id de su categoría y la lista de sus comentarios. Además, `usuario` guarda quién está conectado (`null` si nadie) y `siguienteId` da el id de lo que se crea nuevo.

**2. Utilidades.** Piezas que usan todas las páginas:

- `buscarEntrada()`, `buscarCategoria()`, `esAdmin()` y `hoy()`: atajos para no repetir código.
- `rellenarPlantilla()`: copia una plantilla y pone en cada elemento con `data-campo="x"` el dato `x`: en `value` si es un campo de formulario, en `src` si es una imagen y como texto en el resto. Al ponerlo como texto, lo que escriben los usuarios nunca se interpreta como HTML.
- `mostrarError()` y `ocultarError()`: enseñan u ocultan la caja roja.
- `alEnviarFormulario()`: evita que la página se recargue al enviar, convierte los campos en un objeto (`{ email, contrasena }`) usando sus `name`, se lo pasa a la función de cada página y muestra el error si algo falla.

**3. Menú y lateral.** `pintarMenu()` muestra cada enlace solo a quien indica su `data-visible`. `pintarCategorias()` rehace la lista del lateral con las categorías actuales.

**4. Páginas.** Una función por página. Todas siguen el mismo patrón: leen los datos, ponen la plantilla rellenada en `#contenido` y, si hay formulario, indican a `alEnviarFormulario()` qué hacer con los datos.

| Función               | Página                         | Al enviar el formulario                            |
|-----------------------|--------------------------------|----------------------------------------------------|
| `mostrarEntradas()`   | Todas las entradas o las de una categoría | (no tiene formulario)                   |
| `mostrarEntrada()`    | Entrada con sus comentarios    | Añade el comentario y vuelve a pintar la entrada   |
| `mostrarLogin()`      | Entrar                         | Comprueba email y contraseña y va al inicio        |
| `mostrarRegistro()`   | Registrarse                    | Crea el usuario, entra con él y va al inicio       |
| `mostrarAdmin()`      | Panel de administración        | Añade una categoría                                |
| `mostrarEditor()`     | Crear o editar una entrada     | Guarda la entrada y la muestra                     |

**5. Botones del panel.** Cada botón lleva `data-accion` con el nombre de la función que ejecuta (`borrarEntrada`, `guardarCategoria`, `borrarCategoria`) y su fila `<li>` guarda el id en `data-id`. En vez de un manejador por botón hay uno solo sobre `#contenido` (delegación de eventos): mira el `data-accion` del botón pulsado, llama a la acción con el id de su fila y vuelve a pintar el panel y el lateral.

**6. Navegación.** Es una página única que nunca se recarga. `navegar()` lee la dirección tras `#`, la divide (`#/entrada/3` da la ruta `entrada` y el id `3`) y llama a la función de esa página. Se ejecuta al abrir la web y cada vez que cambia la dirección (evento `hashchange`), por lo que también funcionan los botones Atrás y Adelante. Además:

- `#/salir` desconecta al usuario y vuelve al inicio.
- `#/admin` y `#/editar` llevan a `#/login` si no se es administrador.
- Si una página lanza un error (por ejemplo, una entrada que no existe), se muestra en la caja roja.

| Dirección       | Página                            |
|-----------------|-----------------------------------|
| #/              | Todas las entradas                |
| #/categoria/:id | Entradas de una categoría         |
| #/entrada/:id   | Entrada con sus comentarios       |
| #/login         | Entrar                            |
| #/registro      | Registrarse                       |
| #/salir         | Salir                             |
| #/admin         | Administrar entradas y categorías |
| #/editar/:id    | Crear o editar una entrada        |

### Ejemplos

**Un usuario comenta.**
1. Pulsa una entrada: cambia la dirección, `navegar()` llama a `mostrarEntrada()`.
2. Como hay usuario conectado, se añade el formulario de comentar.
3. Al enviarlo, el comentario se añade a la lista `comentarios` de la entrada.
4. `mostrarEntrada()` vuelve a pintar la entrada, ya con el comentario nuevo.

**El administrador intenta borrar una categoría que tiene entradas.**
1. Pulsa el botón con `data-accion="borrarCategoria"` y lo recoge el manejador del panel.
2. `borrarCategoria()` ve que la categoría tiene entradas y lanza un error.
3. El manejador recoge el error y lo muestra en la caja roja.
