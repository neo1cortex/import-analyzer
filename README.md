# Import Analyzer

Extensión de navegador para centralizar el análisis de información de vehículos y ayudar durante la evaluación de una posible importación.

El proyecto combina extracción de datos de la página, coincidencia de motores y herramientas de análisis en una interfaz con popup y panel lateral.

## Qué incluye

- **Coincidencia de motores**: localiza y relaciona la información de motor disponible con los datos del proyecto.
- **Checklist de revisión**: reúne los puntos que conviene comprobar antes de tomar una decisión.
- **Indicadores de riesgo**: resalta señales de alerta durante el análisis.
- **Cálculo de matriculación**: incorpora una utilidad específica para este cálculo.
- **Exportación**: permite preparar los resultados mediante el módulo de exportación.
- **Interfaz de extensión**: incluye un popup y un panel lateral para consultar la información sin perder el contexto de la página.

> Los resultados son una ayuda para la revisión. Verifica siempre los datos del anuncio, el historial de mantenimiento y el estado real del vehículo antes de comprar.

## Uso

1. Instala o carga la extensión en tu navegador compatible.
2. Abre una página de un vehículo.
3. Abre el popup de Import Analyzer o el panel lateral.
4. Revisa los datos extraídos, la coincidencia de motor, el checklist y las señales de alerta.
5. Contrasta el resultado con la documentación del vehículo y, si procede, guarda o exporta el análisis.

## Instalación local

Este repositorio contiene el código fuente de la extensión. La configuración del manifiesto está en `public/manifest.json` y el proyecto se configura con Vite y TypeScript.

1. Clona el repositorio:
   ```bash
   git clone https://github.com/neo1cortex/import-analyzer.git
   cd import-analyzer
   ```
2. Consulta los scripts disponibles:
   ```bash
   pnpm run
   ```
3. Instala las dependencias y ejecuta el script de compilación definido en `package.json`.
4. En Chrome o Edge, abre la página de extensiones, activa el modo de desarrollador y carga la carpeta generada por la compilación, es decir, la que contenga `manifest.json`.

## Estructura

```text
src/
├── analysis/       # Matching de motor, checklist, alertas, cálculo y exportación
├── background/     # Lógica en segundo plano de la extensión
├── content/        # Extracción y selectores para las páginas analizadas
├── shared/         # Tipos, constantes y utilidades compartidas
└── ui/             # Popup, panel lateral y estilos

public/
└── manifest.json   # Manifiesto de la extensión

tests/              # Pruebas del proyecto
```

Los datos de referencia se mantienen en los archivos JSON de la raíz del repositorio, entre ellos `bbdd_german_cars.json`, `bbdd_german_cars_252_motores.json` y `problemas_revision_motores_252_documentado.json`.

## Desarrollo

- `src/content/extractor.ts` y `src/content/selectors.ts` contienen la extracción de datos de las páginas.
- `src/analysis/` agrupa la lógica de análisis: checklist, matching de motor, alertas, cálculo de matriculación y exportación.
- `src/ui/popup.tsx` y `src/ui/sidepanel.tsx` implementan las dos superficies principales de la interfaz.
- `tests/` contiene las pruebas del proyecto.

Antes de abrir un cambio, ejecuta los scripts de comprobación definidos en `package.json` y valida manualmente la extensión en el navegador.

## Contribuir

Las mejoras y correcciones son bienvenidas:

1. Crea una rama con un nombre descriptivo.
2. Mantén el cambio acotado y añade o actualiza pruebas cuando aplique.
3. Comprueba la compilación y el comportamiento de la extensión.
4. Abre un pull request explicando el problema, el cambio y cómo lo has validado.

## Licencia

Este proyecto se distribuye bajo la licencia [MIT](LICENSE).
