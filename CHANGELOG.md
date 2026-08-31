# Changelog

## Próxima PR — Ajustes de edad, familia y papelitos

- Reemplazado el papelito de profesión por deporte para Niñez y Adolescencia, incluido su recorrido
  desbloqueable exclusivo.
- Ajustados parentescos disponibles y repetibles por franja de edad, con sobrino/sobrina en Vejez.
- Actualizados los retratos familiares para expresar edades relativas y añadida la tarjeta de la
  persona protagonista al cierre del campamento.

## PR #5 — Resumen final agrupado

- Separado el recuento final en pertenencias o aspectos personales y familiares.
- Añadidos retratos grises para familiares separados y retratos a color para quienes llegaron al
  campamento, con nombre, parentesco y estado accesible.
- Conservadas la causa de cada separación y la aclaración de destino desconocido, incluido un
  mensaje específico cuando ningún familiar llega.
- Añadida cobertura para resultados familiares completos, vacíos y mixtos sin modificar el formato
  de las partidas guardadas.

## PR #4 — Llegada a Rihal

- Aclarado que la caravana tomó la ciudad vecina y que la familia huye desde Nahr hacia la frontera.
- Añadida una escena de llegada y descanso en Rihal entre las primeras pérdidas y la advertencia
  urgente.
- Separada la llegada sin personajes de la aparición posterior de la habitante que anuncia la
  cercanía de las fuerzas enemigas.
- Conservada la compatibilidad con las partidas existentes y añadido el nuevo capítulo a las
  validaciones y pruebas narrativas.

## PR #3 — Recorridos desbloqueables

- Añadidos nueve recorridos desbloqueables globales con condiciones narrativas accesibles.
- Añadida persistencia versionada independiente de las partidas, con validación, unión entre
  pestañas, respaldo en memoria y recuperación desde partidas completadas existentes.
- Añadida una pantalla de cartas bloqueadas o desbloqueadas desde el menú principal.
- Añadidas reflexiones finales por franja de edad y un mensaje adicional cuando toda la familia
  llega al campamento.
- Añadidas pruebas unitarias, de integración, E2E y accesibilidad para el nuevo recorrido.

## PR #2 — Documentación y políticas

- Añadida la guía raíz `AGENTS.md` con el mapa documental y las reglas de ramas, commits, reviews y merge.
- Documentados requisitos y arquitectura en `project-requirements.md`.
- Añadidos el diseño narrativo, la hoja de ruta y la estrategia futura de traducciones.
- Añadida documentación separada para una futura política de detección de dispositivos y orientación.
- Registrada esta etapa documental en el changelog.

## PR #1 — Implementación inicial

- Implementada la novela visual educativa completa con React, Phaser e i18next.
- Añadidas creación de personaje, familiares, papelitos, pérdidas manuales, contrarreloj y aleatorias.
- Añadidas tres ranuras locales, validación, recuperación en memoria y protección ante datos corruptos.
- Añadidos audio procedural, subtítulos, pausa por orientación, reducción de movimiento y accesibilidad.
- Añadidos arte original distribuible y referencias privadas excluidas del repositorio.
