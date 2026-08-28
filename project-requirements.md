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

Los recorridos desbloqueables se guardan en un repositorio global, versionado e independiente de
las ranuras. Su progreso es monotónico, combina cambios entre pestañas y conserva únicamente el ID
y la primera fecha de desbloqueo. Borrar o sobrescribir una partida no elimina ese progreso. Las
partidas existentes que ya llegaron al campamento se evalúan al cargarse para recuperar sus
recorridos.

## Narrative requirements

1. Aviso de contenido, menú y tres ranuras.
2. Género y franja de edad: Niñez, Adolescencia, Juventud, Adultez o Vejez.
3. Departamento nocturno, amenaza cercana y televisión que explica que una caravana ficticia tomó
   la ciudad vecina y obliga a la familia a huir hacia la frontera.
4. Selección y nombre de cuatro familiares, con restricciones por edad y unicidad.
5. Doce papelitos: familia, objetos, profesión, habilidad, ropa favorita y sueño.
6. Dos pérdidas manuales antes de salir de Nahr.
7. Llegada y descanso en Rihal, un pueblo ficticio camino a la frontera, antes de una advertencia
   que inicia una nueva huida.
8. Dos pérdidas contrarreloj en Rihal y dos pérdidas aleatorias durante el encuentro armado.
9. Llegada al campamento, resumen de pérdidas y reflexiones personalizadas por edad y familia.
10. Evaluación de nueve recorridos desbloqueables relacionados con la familia, la edad y los
   aspectos de identidad o futuro que permanecieron.

Una separación familiar siempre se describe como destino desconocido, nunca como fallecimiento.
Los sorteos son deterministas en pruebas y no se repiten al recargar una decisión ya confirmada.
Los desbloqueables no puntúan ni comparan el sufrimiento: funcionan como perspectivas narrativas
que invitan a recorrer distintas variantes de la historia. Sus cartas bloqueadas muestran la
condición necesaria sin ocultar información a la persona jugadora.

## Accessibility and mobile

- Cualquier viewport de hasta 767 px de ancho en orientación vertical muestra un bloqueo localizado
  y pausa Phaser, audio y contador. El criterio actual usa únicamente orientación y ancho, por lo
  que también puede aplicarse a tabletas pequeñas o ventanas de escritorio estrechas; no detecta de
  forma fiable el tipo de dispositivo.
- En horizontal se usa un marco 16:9 con letterboxing. Los viewports verticales de más de 767 px
  continúan con el diseño responsivo sin bloqueo obligatorio.
- Navegación por teclado, foco visible, nombres accesibles, subtítulos sonoros y objetivos táctiles
  principales de al menos 44 × 44 px.
- La reducción de movimiento combina la preferencia del sistema y el ajuste manual.

## Quality gates

Los cambios deben conservar las pruebas del reducer, formularios, almacenamiento corrupto o
bloqueado, orientación, temporizador, accesibilidad y recorrido completo. Antes de mergear se deben
pasar lint, TypeScript, Vitest, build y las pruebas E2E afectadas, además de la autorización del
responsable del proyecto.
