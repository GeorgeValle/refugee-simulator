# Simulador de Refugiado

Novela visual educativa 13+ sobre las pérdidas acumulativas del desplazamiento forzado. La
experiencia sucede en una ciudad ficticia inspirada respetuosamente en Oriente Medio, evita
representar países o grupos reales y funciona por completo en el navegador, sin backend, cuentas
ni telemetría.

> **Aviso de contenido:** la historia aborda guerra, huida, separación familiar y trauma. No
> contiene sangre ni violencia gráfica. Un aviso equivalente aparece antes de comenzar a jugar.

## Características

- Recorrido completo de novela visual con un desenlace reflexivo y pérdidas variables.
- Personaje configurable por género y franja de edad.
- Reglas familiares dependientes de la edad y cuatro familiares nombrados.
- Doce papelitos que representan familia, pertenencias, profesión, habilidad, ropa y sueños.
- Tres etapas de pérdida: manual, contrarreloj y aleatoria, sin repetir sorteos al recargar.
- Tres ranuras locales, con datos versionados y validados antes de leer o guardar.
- Interfaz `es-AR` con voseo y recursos i18next separados del código.
- Fondos y personajes originales de estilo anime semirrealista.
- Música y efectos sintetizados en el navegador mediante Web Audio, sin archivos ni servicios
  externos.
- Subtítulos sonoros, volúmenes independientes, silencio global y reducción de movimiento.
- Bloqueo visual y funcional en teléfonos verticales; el contador y el audio se pausan hasta volver
  a horizontal.
- Navegación por teclado, foco visible, objetivos táctiles de 44 px y HTML semántico.
- Datos educativos estáticos de ACNUR para conservar el funcionamiento sin red.

## Tecnologías

| Área | Tecnología |
| --- | --- |
| Runtime de desarrollo | Node.js 24.19.0 LTS (Krypton) |
| Gestor de paquetes | pnpm 10.33.0 |
| Aplicación | Vite 8.2 + React 19.2 + React Compiler |
| Lenguaje | TypeScript 7 en modo estricto |
| Motor visual | Phaser 3.90.0 |
| Localización | i18next + react-i18next |
| Formularios | React Hook Form + Zod 4 |
| Estilos | CSS propio + Tailwind CSS 4 disponible en la cadena de compilación |
| Calidad | Biome, Vitest, Testing Library, Playwright y axe-core |

## Requisitos

- [nvm](https://github.com/nvm-sh/nvm) o un gestor equivalente de Node.js.
- Node.js **24.19.0**. El proyecto rechaza versiones fuera de `>=24.19.0 <25`.
- Corepack, incluido en Node.js, para activar pnpm.

No se necesitan variables de entorno, base de datos, claves ni servicios externos.

## Puesta en marcha

```bash
# Desde la raíz del repositorio
nvm install
nvm use

corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
pnpm dev
```

Abrí la URL que imprime Vite, normalmente <http://localhost:5173>.

### Compilación de producción

```bash
pnpm build
pnpm preview
```

El contenido de `dist/` es estático. Puede publicarse en cualquier alojamiento que sirva archivos
HTML, JavaScript e imágenes. No se incluye una configuración de despliegue porque la primera
versión no requiere publicación ni sincronización en la nube.

## Comandos

| Comando | Propósito |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo de Vite |
| `pnpm build` | TypeScript estricto y build optimizado |
| `pnpm preview` | Vista previa local de `dist/` |
| `pnpm typecheck` | Comprobación estática sin emitir archivos |
| `pnpm lint` | Formato y reglas de Biome |
| `pnpm lint:fix` | Aplica arreglos seguros de Biome |
| `pnpm test:run` | Suite unitaria y de componentes |
| `pnpm test:coverage` | Cobertura V8 |
| `pnpm test:e2e` | Recorrido completo y accesibilidad con Playwright |

La primera ejecución E2E puede requerir instalar Chromium:

```bash
pnpm exec playwright install chromium
```

## Arquitectura

React y Phaser tienen responsabilidades deliberadamente separadas:

```text
Acción del jugador
      │
      ▼
React (formularios, diálogo, accesibilidad)
      │ evento tipado
      ▼
gameReducer ─────► localStorage validado con Zod
      │
      ▼
GameBridge
      │
      ├────► Phaser (fondos, personajes, destellos, transiciones)
      └────► Web Audio (música y efectos procedurales)
```

- **React** controla menús, modales, formularios, papelitos, resumen, foco y lectores de pantalla.
- **El reducer** es la única fuente de verdad narrativa. Los eventos temporales aceptan hora y
  generador aleatorio inyectables para poder probarlos de forma determinista.
- **Phaser** recibe comandos visuales tipados y no contiene texto narrativo visible.
- **Zod** descarta ranuras corruptas o incompatibles antes de que alcancen la interfaz.
- **i18next** resuelve todo el texto visible desde `src/locales/<idioma>/translation.json`.

### Estructura principal

```text
public/assets/art/       Arte original optimizado que sí entra en el build
src/
├── components/          Diálogo, modal, papelitos, ajustes y aviso de rotación
├── game/
│   ├── audio.ts         Paisajes sonoros procedurales con Web Audio
│   ├── bridge.ts        Puente de eventos React ↔ Phaser
│   ├── model.ts         Constantes y tipos derivados del dominio
│   ├── reducer.ts       Máquina narrativa y reglas de pérdida
│   ├── schema.ts        Esquemas de validación Zod
│   ├── storage.ts       Tres ranuras y preferencias locales
│   └── NarrativeScene.ts Escena visual de Phaser
├── hooks/               Orientación y preferencia de movimiento del sistema
├── locales/es-AR/       Recursos de la primera localización
└── screens/             Pantallas de cada etapa de la historia
tests/e2e/               Recorrido de escritorio/móvil y axe-core
docs/                    Documentación y referencias no incluidas en el build
```

## Flujo narrativo y reglas

1. Se acepta el aviso de contenido y se elige una de tres partidas.
2. Se define hombre/mujer y una de cinco franjas de edad.
3. El departamento presenta las explosiones lejanas de forma no gráfica.
4. La televisión anuncia una caravana ficticia y sin marcas.
5. Se nombran cuatro familiares.
6. Se crean cuatro papelitos familiares, cuatro de objetos y cuatro de identidad/futuro.
7. Se dejan dos papelitos manualmente.
8. En el pueblo se dejan otros dos en diez segundos; el sistema completa al azar cero, una o dos
   elecciones faltantes.
9. Un grupo armado ficticio quita dos papelitos activos al azar.
10. El campamento resume seis pérdidas y los seis papelitos que permanecen.

Una pérdida familiar siempre significa **separación forzada y destino desconocido**, nunca muerte.
Hijas, hijos, hermanas y hermanos pueden repetirse; los otros parentescos son únicos. Parejas e
hijos aparecen desde Juventud, y los abuelos no aparecen en Vejez.

## Guardado y privacidad

Las claves usadas son:

- `refugee-simulator:saves:v1`: arreglo con hasta tres sesiones.
- `refugee-simulator:preferences:v1`: volumen, subtítulos y movimiento.
- `refugee-simulator:warning-accepted`: aceptación del aviso durante la pestaña actual.

Los textos escritos por la persona jugadora permanecen exclusivamente en su navegador. No hay
peticiones de red en el juego de producción. Borrar los datos del sitio elimina las partidas.
Si el navegador rechaza una escritura, la partida y las preferencias continúan disponibles en la
memoria de la pestaña y aparece un aviso accesible. Esos cambios temporales se pierden al recargar o
cerrar la pestaña; una escritura posterior exitosa vuelve automáticamente al modo persistente.

El plazo del contador se guarda como marca temporal absoluta. Al entrar en modo vertical se
convierte en milisegundos restantes; al regresar a horizontal se reconstruye el plazo. Los reducers
ignoran confirmaciones duplicadas después de abandonar una etapa, lo que evita pérdidas extra y
nuevos sorteos.

## Localización

La lista tipada de idiomas está en `src/game/locales.ts`. Para agregar un idioma:

1. Añadir el código a `SUPPORTED_LOCALES`.
2. Crear `src/locales/<código>/translation.json` con la misma estructura de claves.
3. Importar el recurso y registrarlo en `src/i18n.ts`.
4. Ejecutar `pnpm typecheck` y `pnpm test:run`.

La lógica narrativa usa valores neutrales (`childhood`, `firstDeparture`, etc.); nunca depende de la
redacción en español.

## Teléfonos y accesibilidad

El bloqueo de orientación usa la consulta:

```css
(orientation: portrait) and (max-width: 767px)
```

Por eso solo obliga a girar teléfonos; tabletas y escritorios continúan de forma responsiva. Una web
normal no puede garantizar el bloqueo físico del dispositivo, por lo que se aplica un bloqueo visual,
de interacción, audio y temporizador.

La preferencia `prefers-reduced-motion: reduce` se combina con el ajuste manual. Los destellos de
Phaser se desactivan y el texto deja de escribirse progresivamente. Las descripciones de sonido se
pueden ocultar sin silenciar el audio, y cada canal tiene control independiente.

## Pruebas

```bash
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
pnpm test:e2e
```

La suite cubre reglas familiares, formularios, guardado corrupto, las tres ranuras, selección
manual, vencimiento total y parcial, aleatoriedad inyectada, ausencia de rerolls, pausa exacta al
rotar, recorrido completo en escritorio y teléfono horizontal, teclado, reducción de movimiento y
axe-core.

## Arte, audio y referencias

El arte distribuido en `public/assets/art/` fue generado específicamente para este proyecto y luego
optimizado localmente. La procedencia y los prompts finales están en
[`docs/ART_ASSETS.md`](docs/ART_ASSETS.md).

Las imágenes que el usuario aportó como referencia permanecen fuera de `public/`; Vite no las copia
a `dist/` y el juego no depende de ellas. No se incluyen marcas de vehículos, banderas, insignias ni
grupos reales.

El audio es síntesis original en tiempo real. No se descargan grabaciones ni se incluyen voces
inteligibles: el encuentro armado usa una textura vocal abstracta y subtitulada.

## Datos educativos

El cierre incluye una instantánea fechada de ACNUR correspondiente al final de 2025: 117,8 millones
de personas desplazadas forzosamente, 38% menores, 68% acogidas en países de ingresos bajos o
medios y 65% en países vecinos al de origen. La interfaz enlaza a
[ACNUR Refugee Data Finder](https://www.unhcr.org/refugee-statistics).

Los datos están incluidos de forma estática para que el juego no dependa de red. Antes de publicar
una edición futura conviene revisar la fecha, cifras y fuente.

## Licencia

El repositorio incluye la licencia [CC0 1.0 Universal](LICENSE). Revisá por separado las condiciones
aplicables a cualquier recurso que incorpores en el futuro.
