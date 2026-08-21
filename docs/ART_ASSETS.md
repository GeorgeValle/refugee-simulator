# Arte original y procedencia

Todos los archivos consumidos por el juego están en `public/assets/art/`. Se crearon con la
herramienta integrada `image_gen` y se optimizaron con Sharp; no se copiaron las imágenes de
referencia aportadas por el usuario.

## Fondos

Los siete prompts compartieron estas restricciones: ilustración anime semirrealista, composición
16:9 para novela visual, ciudad y cultura ficticias inspiradas respetuosamente en Oriente Medio,
sin texto, logotipos, marcas, banderas, insignias, sangre, violencia gráfica ni marcas de agua.

| Archivo | Prompt final resumido |
| --- | --- |
| `menu-city.webp` | Ciudad ficticia de Nahr de noche, azoteas, edificios y río, luces cálidas, cielo azul profundo, espacio seguro para título y menú. |
| `apartment.webp` | Interior nocturno de un departamento modesto, balcón abierto y ciudad al fondo, resplandores distantes no gráficos que iluminan el cielo. |
| `television.webp` | Televisor antiguo en una habitación oscura mostrando una caravana ilustrada de pickups armadas completamente ficticias y sin marca. |
| `village.webp` | Casa rural cálida al anochecer, puerta abierta hacia un pueblo pequeño, sensación breve de refugio y urgencia próxima. |
| `journey.webp` | Sendero al amanecer, caminata de civiles durante dos días hacia un bosque, cansancio y esperanza contenida, sin violencia. |
| `forest.webp` | Habitación mínima en una aldea forestal nocturna, puerta y ventanas, luz fría, encuadre preparado para una irrupción no gráfica. |
| `camp.webp` | Campamento de refugiados al amanecer con carpas, familias y voluntariado a distancia, dignidad, cansancio y luz esperanzadora. |

## Personajes

### Protagonistas

Se generaron dos láminas, una masculina y otra femenina. Prompt final:

> Cinco versiones de la misma persona ficticia de Oriente Medio —Niñez, Adolescencia, Juventud,
> Adultez y Vejez— de cuerpo entero, separadas en columnas iguales, vestimenta civil contemporánea
> y modesta en teal, azul, ocre y arena, expresión seria y respetuosa, fondo gris cálido plano para
> recorte; sin armas, texto, logos, símbolos nacionales o religiosos ni marcas de agua.

Las láminas se segmentaron en diez PNG con alfa:

- `protagonist-man-{childhood,adolescence,youth,adulthood,oldAge}.png`
- `protagonist-woman-{childhood,adolescence,youth,adulthood,oldAge}.png`

Los mismos retratos sirven como representaciones visuales dinámicas de los cuatro familiares, de
acuerdo con parentesco y edad aproximada.

### Habitante del pueblo

`neighbor.png`:

> Habitante civil ficticia de una aldea, alrededor de 55 años, avisando con urgencia y compasión que
> hay que huir, cuerpo entero, vestimenta modesta gastada en óxido, arena, índigo y teal, anime
> semirrealista, situación no violenta; sin armas, uniforme, banderas, símbolos, texto ni marcas.

### Grupo armado ficticio

`armed-group.png`:

> Dos integrantes adultos de un grupo armado totalmente ficticio entrando en una habitación; uno
> señala las pertenencias y el otro lleva un arma genérica hacia abajo sin disparar, ropa sin marcas,
> rostros parcialmente cubiertos, tensión no gráfica; sin sangre, víctimas, banderas, insignias,
> símbolos, grupo real, texto ni marca de agua.

## Fuentes generadas

Los PNG originales de generación quedaron en el directorio local administrado por Codex y no son
dependencias del proyecto. Los archivos finales dentro de `public/assets/art/` son las únicas copias
que usa Vite.

## Referencias excluidas

- `docs/iu/Novela_Visual_Ejm.webp`: referencia local de composición de novela visual.
- `docs/iu/terrorist.png`: referencia local aportada por el usuario.
- `Toyota-Hilux.webp`: referencia externa aportada por el usuario; nunca se copió al proyecto.

Nada bajo `docs/iu/` se importa desde la aplicación ni se copia al build de producción.
