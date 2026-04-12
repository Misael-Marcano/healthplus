Guía de implementación visual basada en el diseño
1. Estilo general de toda la interfaz

El sistema debe transmitir:

limpieza
orden
entorno médico/corporativo
interfaz amigable pero profesional
sensación de “software administrativo moderno”
Reglas generales
usar mucho espacio en blanco
bordes redondeados suaves
sombras ligeras
tipografía limpia y moderna
evitar saturar con colores fuertes
el azul debe dominar la navegación y acciones principales
los colores vivos solo deben usarse en estados, métricas y alertas
2. Header superior
Estructura

Debe incluir:

ícono hamburguesa a la izquierda
título o breadcrumb de la sección actual
avatar del usuario
nombre del usuario
rol debajo del nombre
ícono de configuración o ajustes
Indicaciones visuales
fondo blanco
altura aproximada entre 68px y 76px
borde inferior muy sutil o sombra leve
avatar circular
nombre en texto semibold
rol en tamaño menor y color gris suave
el header no debe verse pesado ni muy alto
Estilo recomendado
fondo: #FFFFFF
texto principal: #4B5563
texto secundario: #7A8798
borde inferior: #E5EAF1
3. Sidebar lateral

La barra lateral del mockup es muy importante. Debe sentirse elegante, limpia y fácil de navegar.

Estructura del sidebar

Debe contener:

logo arriba
menú principal
área separada para opciones secundarias abajo
Indicaciones de estilo
fondo azul muy claro
ancho aproximado entre 220px y 250px
bordes redondeados grandes en el contenedor general
cada item debe tener ícono + texto
el item activo debe resaltar con azul sólido
los demás items deben tener texto azul grisáceo
Estado normal de cada item
fondo transparente
texto color #4E6A8F
ícono del mismo color
padding vertical cómodo
borde redondeado medio
Estado hover
fondo azul muy suave
texto más oscuro
transición suave
Estado activo
fondo: #2C5FA3
texto blanco
ícono blanco
sombra muy leve
destacar claramente pero sin exagerar
Instrucciones exactas para el desarrollador
cada item debe tener altura entre 42px y 48px
usar display: flex
alinear ícono y texto horizontalmente
dejar gap de 10px a 12px
radio de borde de 10px a 12px
transición 200ms
4. Botones

En el diseño se ve un botón principal tipo “Añadir Requisito”. Ese debe ser la referencia principal.

Botón principal
Uso
guardar
añadir
crear
confirmar acciones principales
Estilo visual
fondo azul fuerte
texto blanco
ícono opcional a la izquierda
bordes redondeados medianos
altura media
sin sombra fuerte
elegante y limpio
Especificaciones
color fondo: #2C5FA3
hover: #244F88
texto: #FFFFFF
altura: 40px a 44px
padding horizontal: 16px a 20px
border-radius: 10px
font-weight: 600
Botón secundario
Uso
cancelar
volver
acciones complementarias
Estilo
fondo blanco o gris muy claro
borde suave
texto azul o gris oscuro
Especificaciones
fondo: #FFFFFF
borde: 1px solid #D9E2EC
texto: #4E6A8F
hover: fondo #F6F8FB
Botones de acceso rápido

Los botones de accesos rápidos del dashboard deben verse más ligeros.

Indicaciones
tamaño pequeño-mediano
fondo gris muy claro o blanco
borde muy sutil
ícono pequeño
texto azul grisáceo
no deben competir visualmente con el botón principal
5. Cards del dashboard

Las tarjetas de resumen son uno de los elementos más importantes.

Qué deben mostrar
ícono
título corto
número principal grande
Estilo general
forma rectangular
bordes redondeados
sin demasiado alto
alineación horizontal del ícono y texto
número destacado
color sólido según estado
Cards de estado
Total
fondo: #2F80D1
Pendientes
fondo: #E9BC62
Aprobados
fondo: #6BB58E
En revisión
fondo: #E45469
Indicaciones visuales
texto blanco
íconos blancos
número en tamaño mayor
título en tamaño pequeño a medio
padding interno generoso
mantener todas con la misma altura
Especificaciones sugeridas
altura: 88px a 100px
border-radius: 14px
padding: 16px
sombra: muy sutil
número con peso 700
6. Inputs y campos de formulario

El login marca bien la línea visual que deben seguir los formularios del resto del sistema.

Estilo de inputs
fondo blanco
borde gris claro
iconito a la izquierda o derecha según caso
bordes redondeados
altura cómoda
placeholder en gris suave
Especificaciones
altura: 44px a 48px
borde: 1px solid #D9E2EC
radio: 10px
padding horizontal: 14px
texto: #4B5563
placeholder: #9AA8B8
Estado focus
borde azul suave
aro de enfoque tenue
nunca usar un borde negro fuerte
Focus recomendado
border-color: #619CD0
box-shadow muy suave con ese color
Campos con iconos
ícono alineado verticalmente al centro
dejar espacio interno correcto
el ícono no debe robar protagonismo
7. Tarjetas blancas de contenido

El dashboard y la lista de requisitos usan paneles blancos internos.

Estilo
fondo blanco
bordes redondeados grandes
sombra tenue
padding interno amplio
separación clara entre bloques
Especificaciones
fondo: #FFFFFF
radio: 16px
borde opcional muy suave
sombra ligera
padding: 20px a 24px
8. Gráficos

El gráfico del dashboard debe verse simple y corporativo.

Indicaciones
nada recargado
líneas suaves
rejilla muy tenue
títulos discretos
mantener consistencia con la paleta
si hay varias líneas, usar tonos del sistema y no colores random
Recomendación visual
línea principal en azul
fondo blanco
ejes en gris suave
labels discretos
9. Lista de requisitos

Aunque en el mockup aparece como panel de últimos requisitos, el estilo debe escalar a una pantalla completa de listado.

Cada fila o item debe incluir
pequeño ícono o indicador de estado
nombre del requisito
fecha
acción o flecha a la derecha
Estilo del item
altura uniforme
separación sutil
fondo blanco
hover con gris muy claro
texto principal oscuro
fecha en gris medio
Indicaciones
cada fila debe sentirse “clicable”
usa hover muy ligero
no usar líneas muy oscuras entre filas
si hay estados, mostrar mini badge o punto de color
10. Badges y estados

El sistema debe usar estados visuales muy claros.

Badges sugeridos
Aprobado
fondo suave verde
texto verde más oscuro
Pendiente
fondo suave amarillo
texto mostaza oscuro
En revisión
fondo suave rojo/rosado
texto rojo medio
Borrador
fondo suave azul
texto azul oscuro
Cancelado
fondo gris claro
texto gris oscuro
Regla de uso

Los badges deben verse ligeros:

tamaño pequeño
muy redondeados
peso semibold
padding horizontal corto
11. Iconografía
Indicaciones
usar una sola librería de íconos
estilo lineal y limpio
grosor uniforme
tamaño consistente
evitar mezclar iconos rellenos con lineales si no hay intención clara
Recomendación
sidebar: 18px a 20px
botones: 16px a 18px
métricas/cards: 20px a 24px
12. Tipografía
Indicaciones

Usar una fuente moderna y legible. Puede ser:

Inter
Poppins
Nunito Sans
Jerarquía recomendada
título principal: semibold o bold
subtítulos: semibold
texto normal: regular
texto secundario: regular en gris
Tamaños sugeridos
título grande: 28px a 32px
título de sección: 20px a 24px
subtítulo: 16px a 18px
texto normal: 14px a 16px
texto auxiliar: 12px a 13px
13. Login

El login del mockup tiene un estilo más ilustrado y amable.

Instrucciones de composición
tarjeta centrada
fondo azul muy claro con ilustración o patrón suave
card blanca encima
logo arriba dentro de la card
campos debajo
botón principal ancho completo
enlace “olvidaste tu contraseña” abajo
Estilo de la card
blanca
muy limpia
bordes redondeados grandes
sombra suave
padding generoso
Recomendación
el botón debe ocupar todo el ancho
los inputs con suficiente separación vertical
el logo debe tener aire arriba y abajo
14. Espaciado y layout

Una interfaz como esta depende mucho del espaciado.

Reglas
usar separación consistente entre secciones
no pegar cards entre sí
títulos siempre con margen inferior
dentro de formularios, separación vertical uniforme
dentro de tablas, filas aireadas
Espaciados sugeridos
separación entre cards: 16px a 24px
separación entre bloques mayores: 24px a 32px
padding de página: 24px
padding interno de card: 20px a 24px
15. Sombras y bordes

El diseño no usa sombras duras.

Indicaciones
sombras suaves y elegantes
bordes casi invisibles
priorizar profundidad ligera sobre contraste agresivo
Recomendación
borde: #E5EAF1
sombras con opacidad baja
radio de borde consistente en todo el sistema
16. Comportamiento responsive

Aunque el mockup está en escritorio, hay que definir cómo debe bajar a tablet y móvil.

Tablet
sidebar colapsable
cards resumen en 2 columnas
tablas con scroll horizontal si hace falta
Móvil
menú tipo drawer
dashboard en una sola columna
botones full width cuando sea necesario
priorizar legibilidad sobre fidelidad exacta del layout escritorio
17. Reglas exactas para que se parezca al diseño

Pásale esto textual al desarrollador:

Mantener una estética médica corporativa, limpia y moderna.
Usar azul como color principal de navegación y acciones.
Usar verde turquesa solo como apoyo de marca.
Fondos siempre muy claros y limpios.
Cards blancas con bordes redondeados y sombras suaves.
Sidebar en tono azul claro con item activo en azul sólido.
Botones primarios sólidos en azul, con hover más oscuro.
Inputs blancos con bordes suaves y focus azul claro.
Tarjetas de métricas con colores semánticos sólidos.
Tipografía limpia, ligera y bien espaciada.
Evitar saturación visual, bordes duros y sombras pesadas.
Mantener consistencia en radios, paddings, tamaños e iconos.
18. Prompt corto para el desarrollador o diseñador UI

Puedes mandarle esto:

“Desarrolla las pantallas siguiendo fielmente el mockup entregado. La interfaz debe ser limpia, clínica, moderna y corporativa. Usa una base de fondos claros, cards blancas con bordes redondeados, sidebar azul claro con item activo azul sólido, botones primarios azules, inputs suaves con borde claro, y tarjetas de métricas con colores semánticos. Mantén una jerarquía visual clara, mucho espacio en blanco, iconografía lineal consistente y tipografía moderna. El resultado debe sentirse como un software administrativo premium del sector salud.”