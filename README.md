# Import Analyzer 🔍

> Extensió·¡´n de navegador para analizar importaciones de coches desde Alemania y detectar problemas conocidos de motores.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Chrome](https://img.shields.io/badge/Chrome-Extension-green)](https://chrome.google.com/webstore)

**Import Analyzer** es una extensió·¡´n de Chrome/Edge que te ayuda a identificar problemas conocidos de motores al importar vehí·¡culos desde Alemania. Analiza automá·¡ticamente las páginas de coches y te alerta sobre posibles problemas de fiabilidad basados en una base de datos de más de 252 motores documentados.

---

## 📋 Tabla de contenidos

- [Caracterí·¡sticas](#-caracterí·¡sticas)
- [Instalació·¡´n](#-instalació·¡´n)
- [Có·¡·mo usar](#-có·¡·mo-usar)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Desarrollo local](#-desarrollo-local)
- [Datos](#-datos)
- [Tecnologí·¡as](#-tecnologí·¡as)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Caracterí·¡sticas

- **Aná·¡lisis automá·¡tico**: Detecta coches en páginas web y analiza el motor
- **Base de datos extensa**: +252 motores alemanes documentados con problemas conocidos
- **Alertas visuales**: Indicadores claros de fiabilidad (verde/amarillo/rojo)
- **Panel lateral**: Informació·¡´n detallada sin abandonar la página
- **Multi-pagina**: Funciona en los principales portales de coches alemanes
- **Base de datos local**: Sin necesidad de conexió·¡´n a servidores externos

---

## 🚀 Instalació·¡´n

### Opció·¡´n 1: Chrome Web Store (Recomendada)

> ⚠️ **Pró·¡·ximamente** - La extensió·¡´n está en desarrollo.

### Opció·¡´n 2: Modo desarrollador (Local)

1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/neo1cortex/import-analyzer.git
   cd import-analyzer
   ```

2. **Instala dependencias**:
   ```bash
   pnpm install
   # o
   npm install
   ```

3. **Construye la extensió·¡´n**:
   ```bash
   pnpm build
   # o
   npm run build
   ```

4. **Carga en Chrome**:
   - Abre Chrome y ve a `chrome://extensions/`
   - Activa el "Modo de desarrollador" (esquina superior derecha)
   - Haz clic en "Cargar descomprimida"
   - Selecciona la carpeta `dist` o `build` del proyecto

---

## 📖 Có 如何 usar

1. **Navega a un portal de coches** (mobile.de, autoscout24.de, etc.)
2. **Abre una ficha de vehí·¡culo** - La extensió·¡´n detectará·¡ el motor automá·¡ticamente
3. **Haz clic en el icono de la extensió·¡´n** o abre el panel lateral
4. **Revisa el aná·¡lisis**:
   - 🟢 **Verde**: Motor sin problemas conocidos
   - 🟡 **Amarillo**: Problemas menores o mantenimiento recomendado
   - 🔴 **Rojo**: Problemas graves documentados

### Ejemplo de uso

Cuando visites una página como esta:
```
mobile.de/vehiculo/bmw-320d-2015
```

La extensió·¡´n extraerá·¡:
- Marca: BMW
- Modelo: 320d
- Motor: 2.0 Diesel (B47)
- Año: 2015

Y mostrará·¡ si ese motor tiene problemas conocidos como:
- Cadena de distribució·¡´n
- Válvula EGR
- Filtro de partí·¡culas (DPF)

---

## 📁 Estructura del proyecto

```
import-analyzer/
├── src/
│   ├── analysis/        # Ló·¡·gica de aná·¡lisis de motores
│   ├── background/      # Service worker y eventos en segundo plano
│   ├── content/         # Scripts que se inyectan en las páginas
│   ├── shared/          # Utilidades y tipos compartidos
│   └── ui/              # Componentes de interfaz (popup, sidepanel)
├── public/              # Assets estáticos (iconos, etc.)
├── docs/                # Documentació·¡´n adicional
├── tests/               # Tests unitarios y de integració·¡´n
├── .opencode/           # Configuració·¡´n de OpenCode
├── bbdd_german_cars.json              # Base de datos de coches
├── bbdd_german_cars_252_motores.json  # Base de datos de 252 motores
├── problemas_revision_motores_252_documentado.json  # Problemas documentados
├── package.json         # Dependencias y scripts
├── vite.config.ts       # Configuració·¡´n de Vite
├── tsconfig.json        # Configuració·¡´n de TypeScript
└── tailwind.config.ts   # Configuració·¡´n de Tailwind CSS
```

### Descripció·¡´n de carpetas

| Carpeta | Descripció·¡´n |
|---------|----------------|
| `src/analysis` | Algoritmos de detecció·¡´n y matching de motores |
| `src/background` | Service worker, listeners de eventos, gestió·¡´n de mensajes |
| `src/content` | Scripts que se ejecutan en las páginas de los portales |
| `src/shared` | Tipos TypeScript, utilidades, constantes |
| `src/ui` | Componentes React/Vue para popup y panel lateral |

---

## 🛠 Desarrollo local

### Requisitos previos

- Node.js 18+ 
- pnpm 8+ (recomendado) o npm
- Chrome/Edge para testing

### Comandos disponibles

```bash
# Instalar dependencias
pnpm install

# Desarrollo con hot-reload
pnpm dev

# Construir para producció·¡´n
pnpm build

# Ejecutar tests
pnpm test

# Linting
pnpm lint
```

### Debugging

1. Abre `chrome://extensions/`
2. Encuentra tu extensió·¡´n y haz clic en "service worker"
3. Abre las DevTools del panel lateral o popup (F12)

---

## 📊 Datos

La extensió·¡´n incluye tres bases de datos JSON:

| Archivo | Descripció·¡´n | Tamaño |
|---------|----------------|--------|
| `bbdd_german_cars.json` | Lista de coches alemanes por marca/modelo | ~14 KB |
| `bbdd_german_cars_252_motores.json` | 252 motores con especificaciones | ~645 KB |
| `problemas_revision_motores_252_documentado.json` | Problemas documentados por motor | ~290 KB |

### Formato de datos

Los motores siguen esta estructura:
```json
{
  "codigo_motor": "B47D20",
  "marca": "BMW",
  "modelo": "Serie 3",
  "cilindrada": "2.0L",
  "combustible": "Diesel",
  "potencia_cv": 190,
  "problemas_conocidos": [
    {
      "componente": "Cadena de distribució·¡´n",
      "gravedad": "alta",
      "descripcion": "Tensió·¡´n insuficiente, puede romperse antes de 100k km"
    }
  ]
}
```

---

## 🧰 Tecnologí·¡as

- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Estilos utilitarios
- **Chrome Extensions API (Manifest V3)** - API de extensiones
- **ESLint + Prettier** - Calidad de có 如何 go
- **Vitest** - Framework de testing

---

## 🤝 Contribuir

Las contribuciones son bienvenidas! Si quieres ayudar:

1. Haz un fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

### Reportar bugs

Usa la secció·¡´n de [Issues](https://github.com/neo1cortex/import-analyzer/issues) para reportar bugs o sugerir mejoras.

Para más detalles, consulta la guí·¡a de [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 📞 Contacto

- **Autor**: neo1cortex
- **Repositorio**: [github.com/neo1cortex/import-analyzer](https://github.com/neo1cortex/import-analyzer)

---

<div align="center">

**Hecho con ❤️ para importar coches desde Alemania con confianza**

</div>
