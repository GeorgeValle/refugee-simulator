# Estrategia de traducciones

## Estado actual

La aplicación publica una sola localización: `es-AR`, con voseo consistente. La lista tipada de
idiomas está en `src/game/locales.ts` y el recurso activo en
`src/locales/es-AR/translation.json`. Ningún componente ni escena debe incorporar texto visible
directamente.

La versión actual no ofrece un selector de idioma: `i18n.ts` inicia siempre en `DEFAULT_LOCALE` y
Ajustes solo informa el idioma activo. Registrar un recurso no lo vuelve seleccionable por sí solo.

## Añadir un idioma

1. Añadir el código BCP 47 a `SUPPORTED_LOCALES`.
2. Crear `src/locales/<código>/translation.json` con la misma estructura de claves.
3. Registrar el recurso en `src/i18n.ts`.
4. Añadir un selector de idioma en Ajustes y conectarlo con `i18n.changeLanguage`.
5. Persistir la preferencia elegida, restaurarla antes del primer render y mantener sincronizado
   `GameSession.locale` al crear o cargar una partida.
6. Incluir `app.title` y `app.description` en cada recurso y sincronizar, antes de que la interfaz
   quede disponible, `document.documentElement.lang`, `document.title` y la etiqueta
   `<meta name="description">` durante la restauración inicial y cada evento
   `i18n.languageChanged`.
7. Traducir también validaciones, botones, títulos, subtítulos, estadísticas y textos accesibles.
8. Ejecutar `pnpm typecheck`, `pnpm test:run` y el recorrido E2E del idioma.

La lógica narrativa debe usar valores neutrales como `childhood`, `firstDeparture` y `camp`; nunca
debe comparar frases traducidas ni depender del orden de palabras.

## Convenciones

- Mantener grupos de claves descriptivos dentro del único namespace i18next actual, `translation`.
  Entre los grupos existentes están `common`, `menu`, `settings`, `profile`, `family`, `slips`,
  `story` y `accessibility`. La preparación usa claves anidadas bajo `story.packing`; no existe
  un grupo raíz `packing` ni deben asumirse grupos `forms` o `audio` que aún no existen.
- Preferir claves estables y descriptivas antes que claves basadas en texto.
- Usar interpolación para nombres, cantidades y tiempos; no concatenar frases desde React.
- Mantener género, número, formalidad y longitud adecuados al idioma destino.
- Traducir siempre `aria-label`, `aria-describedby`, subtítulos y mensajes de error.

Si en el futuro se separan namespaces, habrá que registrar cada recurso adicional en i18next y
actualizar las llamadas `t(...)` y sus pruebas; no basta con reorganizar las carpetas.

## Revisión y fallback

Cada idioma debe ser revisado por una persona competente en la variante regional. Las claves faltantes
deben caer de forma segura al idioma base y registrarse en pruebas; nunca se debe mostrar una clave
interna al público. Una traducción incompleta no se habilita como idioma seleccionable.

Las traducciones no cambian las reglas de edad, parentesco, pérdidas ni validación. Los cambios de
copy que alteren el sentido educativo deben documentarse en `CHANGELOG.md` y revisarse junto con
`docs/NARRATIVE_DESIGN.md`.

## Metadatos de la página

La implementación futura debe centralizar la sincronización de metadatos en una única función,
registrar una sola suscripción a `languageChanged` y limpiarla al desmontar. Las pruebas deben cubrir
la carga inicial en `es-AR`, el cambio a un segundo idioma, la restauración tras recargar, la ausencia
de listeners duplicados y la verificación del idioma del documento, el título y la descripción con
un lector de pantalla o una auditoría automática. Esta versión documental no modifica todavía el
runtime.
