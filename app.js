// Blog estático. Todos los datos están en memoria: se pueden crear entradas,
// comentarios, categorías y usuarios, pero al recargar la página se pierden
// los cambios y vuelven los datos de ejemplo.

// ---------- Datos de ejemplo ----------

const usuarios = [
  { id: 1, nombre: 'Admin', email: 'admin@blog.com', contrasena: 'admin', rol: 'admin' }
];

const categorias = [
  { id: 1, nombre: 'Viajes' },
  { id: 2, nombre: 'Tecnología' },
  { id: 3, nombre: 'Cocina' }
];

const entradas = [
  {
    id: 1,
    titulo: 'Una semana en Lisboa',
    categoria: 1,
    fecha: '12/10/2026',
    imagen: 'https://picsum.photos/seed/lisboa/800/400',
    texto: 'Lisboa es una ciudad para recorrer a pie, subiendo y bajando sus colinas.\n' +
      'El tranvía 28 cruza los barrios más antiguos y desde los miradores se ve todo el río Tajo.\n' +
      'Lo mejor del viaje fue perderse por Alfama al atardecer.',
    comentarios: [{ autor: 'Lucía', fecha: '13/10/2026', texto: '¡Qué ganas de ir!' }]
  },
  {
    id: 2,
    titulo: 'Primeros pasos con HTML y CSS',
    categoria: 2,
    fecha: '02/11/2026',
    imagen: 'https://picsum.photos/seed/codigo/800/400',
    texto: 'Toda página web empieza con HTML, que define su estructura: cabecera, menú, contenido y pie.\n' +
      'Con CSS se le da estilo: colores, tamaños y la colocación de cada elemento.\n' +
      'Con Flexbox y Grid se pueden maquetar columnas y filas con muy pocas reglas.',
    comentarios: []
  },
  {
    id: 3,
    titulo: 'Tortilla de patatas jugosa',
    categoria: 3,
    fecha: '18/11/2026',
    imagen: 'https://picsum.photos/seed/cocina/800/400',
    texto: 'Ingredientes: 5 huevos, 4 patatas, 1 cebolla, aceite de oliva y sal.\n' +
      'Pocha la patata y la cebolla a fuego lento, escúrrelas y mézclalas con el huevo batido.\n' +
      'Cuaja la tortilla un par de minutos por cada lado.',
    comentarios: [{ autor: 'Marcos', fecha: '19/11/2026', texto: 'Con cebolla, siempre.' }]
  }
];

// Identificador para lo que se cree nuevo (entradas, categorías, usuarios)
let siguienteId = 100;

// Usuario conectado (null si no hay nadie)
let usuario = null;

// Zona central donde se pinta cada página y caja de mensajes de error
const contenido = document.getElementById('contenido');
const mensajeError = document.getElementById('mensaje-error');

// ---------- Utilidades ----------

const buscarEntrada = (id) => entradas.find((e) => e.id === Number(id));
const buscarCategoria = (id) => categorias.find((c) => c.id === Number(id));
const esAdmin = () => usuario?.rol === 'admin';
const hoy = () => new Date().toLocaleDateString('es-ES');

// Copia la plantilla <template id="..."> de index.html y rellena sus campos:
// cada elemento con data-campo="x" recibe datos.x. Se pone como texto, nunca
// como HTML, así lo que escriben los usuarios no se interpreta como código.
function rellenarPlantilla(idPlantilla, datos = {}) {
  const copia = document.getElementById(idPlantilla).content.cloneNode(true);
  copia.querySelectorAll('[data-campo]').forEach((elemento) => {
    const valor = datos[elemento.dataset.campo] ?? '';
    if (elemento.matches('input, textarea')) {
      elemento.value = valor;
    } else if (elemento.matches('img')) {
      elemento.src = valor;
      elemento.hidden = !valor; // Sin imagen, no se muestra
    } else {
      elemento.textContent = valor;
    }
  });
  return copia;
}

function mostrarError(texto) {
  mensajeError.textContent = texto;
  mensajeError.hidden = false;
}

function ocultarError() {
  mensajeError.hidden = true;
}

// Cuando se envía el formulario de la página, evita que se recargue y llama a
// "accion" con sus datos como objeto ({ email: ..., contrasena: ... }).
// Si "accion" lanza un error, lo muestra.
function alEnviarFormulario(accion) {
  const formulario = contenido.querySelector('form');
  formulario?.addEventListener('submit', (evento) => {
    evento.preventDefault();
    try {
      accion(Object.fromEntries(new FormData(formulario)));
    } catch (error) {
      mostrarError(error.message);
    }
  });
}

// ---------- Menú y lateral ----------

// Muestra u oculta los enlaces del menú según quién esté conectado.
// Cada enlace indica en data-visible para quién es: invitado, usuario o admin.
function pintarMenu() {
  const visible = { invitado: !usuario, usuario: !!usuario, admin: esAdmin() };
  document.querySelectorAll('[data-visible]').forEach((enlace) => {
    enlace.hidden = !visible[enlace.dataset.visible];
  });
  document.getElementById('nombre-usuario').textContent = usuario?.nombre ?? '';
}

// Pinta en el lateral la lista de categorías, cada una con su enlace
function pintarCategorias() {
  const lista = document.getElementById('lista-categorias');
  // Se conserva el primer enlace ("Todas") y se cambian los demás
  lista.replaceChildren(lista.firstElementChild, ...categorias.map((categoria) => {
    const enlace = rellenarPlantilla('plantilla-categoria', categoria);
    enlace.querySelector('a').href = '#/categoria/' + categoria.id;
    return enlace;
  }));
}

// ---------- Páginas ----------

// Listado de entradas, de la más nueva a la más antigua: todas o solo las de
// una categoría. De cada entrada se muestran los primeros 200 caracteres.
function mostrarEntradas(idCategoria) {
  const lista = entradas
    .filter((entrada) => !idCategoria || entrada.categoria === Number(idCategoria))
    .reverse();

  contenido.replaceChildren(...lista.map((entrada) => {
    const resumen = rellenarPlantilla('plantilla-resumen', {
      ...entrada,
      categoria: buscarCategoria(entrada.categoria).nombre,
      texto: entrada.texto.slice(0, 200) + '...'
    });
    resumen.querySelector('a').href = '#/entrada/' + entrada.id;
    return resumen;
  }));
  if (!lista.length) contenido.replaceChildren(rellenarPlantilla('plantilla-sin-entradas'));
}

// Entrada completa con sus comentarios. Si hay usuario conectado se muestra
// el formulario para comentar; si no, un aviso para entrar o registrarse.
function mostrarEntrada(id) {
  const entrada = buscarEntrada(id);
  if (!entrada) throw new Error('Entrada no encontrada');

  contenido.replaceChildren(rellenarPlantilla('plantilla-entrada', {
    ...entrada,
    categoria: buscarCategoria(entrada.categoria).nombre
  }));

  // Botón de editar, solo para el administrador
  const botonEditar = document.getElementById('boton-editar');
  botonEditar.href = '#/editar/' + entrada.id;
  botonEditar.hidden = !esAdmin();

  const listaComentarios = document.getElementById('lista-comentarios');
  listaComentarios.replaceChildren(
    ...entrada.comentarios.map((comentario) => rellenarPlantilla('plantilla-comentario', comentario))
  );
  if (!entrada.comentarios.length) {
    listaComentarios.replaceChildren(rellenarPlantilla('plantilla-sin-comentarios'));
  }

  contenido.append(rellenarPlantilla(usuario ? 'plantilla-comentar' : 'plantilla-aviso-comentar'));
  alEnviarFormulario((datos) => {
    entrada.comentarios.push({ autor: usuario.nombre, fecha: hoy(), texto: datos.texto });
    mostrarEntrada(id); // Se vuelve a pintar para ver el comentario nuevo
  });
}

// Formulario de acceso. Si los datos son correctos, guarda el usuario y va al inicio.
function mostrarLogin() {
  contenido.replaceChildren(rellenarPlantilla('plantilla-login'));
  alEnviarFormulario((datos) => {
    usuario = usuarios.find((u) => u.email === datos.email && u.contrasena === datos.contrasena);
    if (!usuario) throw new Error('Email o contraseña incorrectos');
    location.hash = '#/';
  });
}

// Formulario de registro. Tras crear la cuenta, entra directamente con ella.
function mostrarRegistro() {
  contenido.replaceChildren(rellenarPlantilla('plantilla-registro'));
  alEnviarFormulario((datos) => {
    if (usuarios.some((u) => u.email === datos.email)) {
      throw new Error('Ya existe un usuario con ese email');
    }
    usuario = { id: siguienteId++, ...datos, rol: 'usuario' };
    usuarios.push(usuario);
    location.hash = '#/';
  });
}

// Crea una fila del panel de administración guardando el id en el <li>,
// para que sus botones sepan sobre qué entrada o categoría actúan
function crearFilaAdmin(idPlantilla, elemento) {
  const fila = rellenarPlantilla(idPlantilla, elemento);
  fila.querySelector('li').dataset.id = elemento.id;
  return fila;
}

// Panel de administración: lista de entradas (editar, borrar) y lista de
// categorías (añadir, renombrar, borrar). Los botones se gestionan en "acciones".
function mostrarAdmin() {
  contenido.replaceChildren(rellenarPlantilla('plantilla-admin'));

  document.getElementById('admin-entradas').replaceChildren(...entradas.map((entrada) => {
    const fila = crearFilaAdmin('plantilla-fila-entrada', entrada);
    fila.querySelector('a').href = '#/editar/' + entrada.id;
    return fila;
  }));
  document.getElementById('admin-categorias').replaceChildren(
    ...categorias.map((categoria) => crearFilaAdmin('plantilla-fila-categoria', categoria))
  );

  // Formulario para añadir una categoría
  alEnviarFormulario((datos) => {
    categorias.push({ id: siguienteId++, nombre: datos.nombre });
    pintarCategorias();
    mostrarAdmin();
  });
}

// Formulario para crear (sin id) o editar (con id) una entrada.
// Al guardar, muestra la entrada.
function mostrarEditor(id) {
  const entrada = id ? buscarEntrada(id) : {};
  contenido.replaceChildren(rellenarPlantilla('plantilla-editor', {
    ...entrada,
    encabezado: id ? 'Editar entrada' : 'Nueva entrada'
  }));

  // Opciones del desplegable de categorías, con la de la entrada ya marcada
  document.querySelector('[name=categoria]').replaceChildren(
    ...categorias.map((c) => new Option(c.nombre, c.id, false, c.id === entrada.categoria))
  );

  alEnviarFormulario((datos) => {
    datos.categoria = Number(datos.categoria);
    if (id) {
      Object.assign(entrada, datos);
    } else {
      id = siguienteId++;
      entradas.push({ id, fecha: hoy(), comentarios: [], ...datos });
    }
    location.hash = '#/entrada/' + id;
  });
}

// ---------- Botones del panel de administración ----------

// Cada botón tiene data-accion con el nombre de la función; "fila" es su <li>
const acciones = {
  // Borra una entrada (y sus comentarios) tras pedir confirmación
  borrarEntrada(id) {
    if (confirm('¿Borrar la entrada y sus comentarios?')) {
      entradas.splice(entradas.indexOf(buscarEntrada(id)), 1);
    }
  },
  // Guarda el nombre escrito en la caja de texto de la fila
  guardarCategoria(id, fila) {
    buscarCategoria(id).nombre = fila.querySelector('input').value;
  },
  // Borra una categoría si no tiene entradas
  borrarCategoria(id) {
    if (entradas.some((entrada) => entrada.categoria === Number(id))) {
      throw new Error('No se puede borrar una categoría que tiene entradas');
    }
    categorias.splice(categorias.indexOf(buscarCategoria(id)), 1);
  }
};

// Un único manejador para todos los botones del panel: mira su data-accion,
// ejecuta la acción correspondiente y vuelve a pintar el panel y el lateral
contenido.addEventListener('click', (evento) => {
  const { accion } = evento.target.dataset;
  if (!accion) return; // No se ha pulsado un botón de acción
  const fila = evento.target.closest('li');
  ocultarError();
  try {
    acciones[accion](fila.dataset.id, fila);
    pintarCategorias();
    mostrarAdmin();
  } catch (error) {
    mostrarError(error.message);
  }
});

// ---------- Navegación ----------

// Muestra la página que indica la dirección: #/entrada/3, #/categoria/2, #/admin...
// Se ejecuta al arrancar y cada vez que cambia la parte de la dirección tras "#".
function navegar() {
  // "#/entrada/3" se divide en ["#", "entrada", "3"]
  const [, ruta, id] = location.hash.split('/');
  ocultarError();

  if (ruta === 'salir') {
    usuario = null;
    location.hash = '#/';
    return;
  }
  // Las páginas de administración solo son para el administrador
  if ((ruta === 'admin' || ruta === 'editar') && !esAdmin()) {
    location.hash = '#/login';
    return;
  }

  pintarMenu();
  try {
    if (ruta === 'entrada') mostrarEntrada(id);
    else if (ruta === 'categoria') mostrarEntradas(id);
    else if (ruta === 'login') mostrarLogin();
    else if (ruta === 'registro') mostrarRegistro();
    else if (ruta === 'admin') mostrarAdmin();
    else if (ruta === 'editar') mostrarEditor(id);
    else mostrarEntradas();
  } catch (error) {
    mostrarError(error.message);
  }
}

window.addEventListener('hashchange', navegar);
pintarCategorias();
navegar();
