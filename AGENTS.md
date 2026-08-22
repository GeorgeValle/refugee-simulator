# Guía del proyecto para agentes y colaboradores

## Mapa de documentación

- `README.md`: instalación, comandos, arquitectura resumida y estado funcional.
- `project-requirements.md`: requisitos de producto y restricciones técnicas vigentes.
- `CHANGELOG.md`: cambios agrupados por versión o Pull Request.
- `docs/NARRATIVE_DESIGN.md`: recorrido narrativo, reglas de representación y contenido.
- `docs/TRANSLATIONS.md`: estrategia para futuras traducciones y mantenimiento de i18next.
- `docs/ROADMAP.md`: mejoras futuras priorizadas.
- `docs/ART_ASSETS.md`: arte distribuible, procedencia y referencias excluidas.
- `docs/iu/`: referencias privadas locales; nunca se versionan ni se importan desde la aplicación.

## Reglas de cambios

- Mantener el alcance de cada cambio acotado a su objetivo; no mezclar refactors oportunistas.
- No añadir backend, cuentas, telemetría ni dependencias de red sin una decisión documentada.
- Todo texto visible nuevo debe pasar por i18next. Las transiciones narrativas permanecen en el
  reducer; las invariantes de dominio se definen en helpers reutilizables del modelo, la interfaz
  puede anticipar errores y el esquema valida datos externos o persistidos. Estos niveles deben
  mantenerse alineados mediante pruebas.
- Las referencias privadas, secretos, builds, caches y configuraciones de la computadora deben quedar fuera del commit según `.gitignore`.

## Ramas y commits

- Crear ramas con el formato `codex/<tipo>/<slug>`, por ejemplo `codex/docs/project-documentation`.
- Usar sujetos de commit con la convención personal del proyecto: `(<tipo>): <descripción imperativa>`.
- Ejemplos válidos: `(docs): add AGENTS.md` y `(feat): add new button - New Game in home`.
- Tipos permitidos: `feat`, `fix`, `docs`, `refactor`, `test` y `chore`.
- Un commit debe describir un cambio coherente y no incluir archivos generados ni cambios ajenos.
- Una PR puede recibir varios commits de corrección en su misma rama hasta que las revisiones y checks estén satisfechos.

## Revisiones y merge

- No se hace merge sin autorización explícita del usuario.
- Antes del merge deben pasar los checks requeridos y las pruebas correspondientes.
- Un P2 no bloqueante solo puede quedar pendiente si el usuario lo acepta explícitamente como riesgo asumido; la aceptación no oculta el hilo ni reemplaza los checks técnicos.
- No fusionar, cerrar PRs ni resolver conversaciones automáticamente.
- Tras mergear, preparar el siguiente trabajo únicamente desde `main` actualizado:

  ```bash
  git switch main
  git pull --ff-only origin main
  git switch -c codex/<tipo>/<nuevo-slug>
  ```

- No reutilizar una rama de una PR ya mergeada ni arrastrar commits históricos a la siguiente PR.

## Validación mínima

Antes de solicitar revisión o merge, ejecutar según el alcance:

```bash
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
git diff --check
```

Los cambios de interfaz o narrativa también deben verificar el recorrido E2E y accesibilidad con `pnpm test:e2e` cuando corresponda.
