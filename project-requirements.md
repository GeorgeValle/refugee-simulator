# Project Requirements

## Product

`Simulador de Refugiado` es una novela visual educativa para mayores de 13 años. Busca comunicar,
sin violencia gráfica, las pérdidas acumulativas que puede experimentar una persona que huye varias
veces de una guerra o persecución. La ciudad y los grupos son ficticios y no representan países,
marcas, religiones ni organizaciones reales.

La experiencia funciona completamente en el navegador, sin backend, cuentas, telemetría ni
dependencias de red durante la partida. Los textos escritos por la persona jugadora permanecen en
su dispositivo.

## Stack

- Node.js 24.19.0 y pnpm 10.33.0.
- Vite 8, React 19 con Compiler y TypeScript estricto.
- Phaser 3.90 para fondos, personajes, efectos, transiciones y audio procedural.
- i18next/react-i18next para localización; la primera variante es `es-AR` con voseo.
- React Hook Form + Zod 4 para formularios y validación.
- Biome, Vitest, Testing Library, Playwright y axe-core para calidad.

## Architecture

React controla menús, formularios, diálogos, foco, ajustes y papelitos. El reducer tipado controla
las transiciones narrativas, los eventos y los cambios de estado. Las constantes y helpers de
dominio en `model.ts` definen reglas reutilizables como elegibilidad y repetibilidad de parentescos;
React las usa para anticipar errores en el formulario y `schema.ts` las vuelve a validar al cargar o
guardar datos. Las pruebas cubren esos niveles para evitar divergencias. Phaser es una capa visual
y recibe comandos por `GameBridge`; no contiene texto narrativo visible. El director de audio
procedural es la única fuente de sonido.

Las sesiones se validan con Zod, tienen `schemaVersion: 1` y ocupan hasta tres ranuras de
`localStorage`. Si el navegador bloquea una escritura, el repositorio conserva un snapshot en
memoria, muestra un aviso accesible y continúa; esos cambios son volátiles hasta recuperar la
persistencia.

## Narrative requirements

1. Aviso de contenido, menú y tres ranuras.
2. Género y franja de edad: Niñez, Adolescencia, Juventud, Adultez o Vejez.
3. Departamento nocturno, amenaza cercana y televisión con caravana ficticia.
4. Selección y nombre de cuatro familiares, con restricciones por edad y unicidad.
5. Doce papelitos: familia, objetos, profesión, habilidad, ropa favorita y sueño.
6. Dos pérdidas manuales, dos pérdidas contrarreloj y dos pérdidas aleatorias.
7. Llegada al campamento y resumen de pérdidas.

Una separación familiar siempre se describe como destino desconocido, nunca como fallecimiento.
Los sorteos son deterministas en pruebas y no se repiten al recargar una decisión ya confirmada.

## Accessibility and mobile

- Teléfonos de menos de 768 px en orientación vertical muestran un bloqueo localizado y pausan
  Phaser, audio y contador.
- En horizontal se usa un marco 16:9 con letterboxing; tabletas y escritorios verticales no están
  obligados a rotar.
- Navegación por teclado, foco visible, nombres accesibles, subtítulos sonoros y objetivos táctiles
  principales de al menos 44 × 44 px.
- La reducción de movimiento combina la preferencia del sistema y el ajuste manual.

## Quality gates

Los cambios deben conservar las pruebas del reducer, formularios, almacenamiento corrupto o
bloqueado, orientación, temporizador, accesibilidad y recorrido completo. Antes de mergear se deben
pasar lint, TypeScript, Vitest, build y las pruebas E2E afectadas, además de la autorización del
responsable del proyecto.
