# Estrategia de traducciones

## Estado actual

La aplicación publica una sola localización: `es-AR`, con voseo consistente. La lista tipada de
idiomas está en `src/game/locales.ts` y el recurso activo en
`src/locales/es-AR/translation.json`. Ningún componente ni escena debe incorporar texto visible
directamente.

## Añadir un idioma

1. Añadir el código BCP 47 a `SUPPORTED_LOCALES`.
2. Crear `src/locales/<código>/translation.json` con la misma estructura de claves.
3. Registrar el recurso en `src/i18n.ts`.
4. Traducir también validaciones, botones, títulos, subtítulos, estadísticas y textos accesibles.
5. Ejecutar `pnpm typecheck`, `pnpm test:run` y el recorrido E2E del idioma.

La lógica narrativa debe usar valores neutrales como `childhood`, `firstDeparture` y `camp`; nunca
debe comparar frases traducidas ni depender del orden de palabras.

## Convenciones

- Mantener namespaces por área (`common`, `menu`, `story`, `forms`, `accessibility`, `audio`).
- Preferir claves estables y descriptivas antes que claves basadas en texto.
- Usar interpolación para nombres, cantidades y tiempos; no concatenar frases desde React.
- Mantener género, número, formalidad y longitud adecuados al idioma destino.
- Traducir siempre `aria-label`, `aria-describedby`, subtítulos y mensajes de error.

## Revisión y fallback

Cada idioma debe ser revisado por una persona competente en la variante regional. Las claves faltantes
deben caer de forma segura al idioma base y registrarse en pruebas; nunca se debe mostrar una clave
interna al público. Una traducción incompleta no se habilita como idioma seleccionable.

Las traducciones no cambian las reglas de edad, parentesco, pérdidas ni validación. Los cambios de
copy que alteren el sentido educativo deben documentarse en `CHANGELOG.md` y revisarse junto con
`docs/NARRATIVE_DESIGN.md`.
