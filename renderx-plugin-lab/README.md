# RenderX Plugin Lab 🧪

**Experimental environment for RenderX plugins, Host SDK, and Thin Host architecture**

This repository serves as the **innovation lab** for RenderX's Conductor Integration Architecture (CIA) and Symphonic Plugin Architecture (SPA) systems.

---

## 🎯 Purpose

The RenderX Plugin Lab is a dedicated space for:

- **Creating** new RenderX plugins
- **Testing** plugin orchestration and communication
- **Validating** CIA and SPA compliance
- **Experimenting** with Thin Host implementations
- **Developing** AI-powered enhancements

---

## 🏗️ Architecture

### Thin Host
A minimal host implementation that provides:
- Plugin mounting points
- Lifecycle management
- Event coordination

### Conductor (CIA)
The orchestration layer that handles:
- Plugin communication
- Dependency management
- Event routing

### Plugins (SPA)
Standardized plugin system with:
- Type-safe interfaces
- Manifest validation
- Modular architecture

---

## 📁 Repository Structure

```
renderx-plugin-lab/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── host/
│   │   └── thin-host.tsx          # Thin Host implementation
│   ├── orchestration/
│   │   └── conductor-setup.ts     # Conductor configuration
│   └── validators/
│       └── spa-validator.ts       # SPA validation logic
├── plugins/
│   ├── library-panel/             # Library panel plugin
│   ├── control-panel/             # Control panel plugin
│   ├── canvas-ui/                 # Canvas UI plugin
│   └── example-ai-enhancement/    # AI enhancement example
├── docs/
│   ├── architecture-overview.md   # Architecture documentation
│   ├── canvas-files.md           # Canvas file format
│   ├── ai-enhancements.md        # AI enhancement guide
│   └── cia-spa-guide.md          # CIA/SPA reference
├── tests/
│   ├── unit/                     # Unit tests
│   └── e2e/                      # End-to-end tests
└── scripts/
    ├── simulateCanvas.js         # Canvas simulation
    └── showStats.js              # Repository statistics
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/BPMSoftwareSolutions/renderx-plugin-lab.git
cd renderx-plugin-lab

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run CIA tests
npm run test:cia

# Run SPA tests
npm run test:spa

# Simulate canvas operations
npm run simulate:canvas

# Show repository statistics
npm run stats
```

---

## 🧩 Creating a Plugin

### 1. Create Plugin Directory

```bash
mkdir -p plugins/my-plugin
```

### 2. Create Manifest

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "type": "panel",
  "exports": ["MyPanel"]
}
```

### 3. Implement Plugin

```typescript
export const MyPanel = () => {
  return <div>My Plugin Panel</div>;
};
```

### 4. Register with Conductor

```typescript
import { createConductor } from './src/orchestration/conductor-setup';

const conductor = createConductor({
  plugins: ['my-plugin'],
  mode: 'development'
});

await conductor.play();
```

---

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### CIA Validation

```bash
npm run test:cia
```

### SPA Validation

```bash
npm run test:spa
```

---

## 📚 Documentation

- [Architecture Overview](docs/architecture-overview.md)
- [Canvas Files](docs/canvas-files.md)
- [AI Enhancements](docs/ai-enhancements.md)
- [CIA & SPA Guide](docs/cia-spa-guide.md)

---

## 🎭 Plugin Types

### Panel Plugins
UI panels that provide specific functionality:
- Library Panel: Asset management
- Control Panel: Settings and controls

### Canvas Plugins
Direct canvas manipulation:
- Canvas UI: Drawing and editing tools

### Enhancement Plugins
AI-powered features:
- Auto-layout
- Style suggestions
- Content generation

---

## 🔧 Configuration

### Vite Configuration

The lab uses Vite for fast development and building. Configuration can be customized in `vite.config.ts`.

### TypeScript Configuration

TypeScript settings are in `tsconfig.json`. The configuration is optimized for React and modern JavaScript features.

---

## 🤝 Contributing

This is an experimental lab. Feel free to:
- Create new plugins
- Improve existing implementations
- Add tests and documentation
- Experiment with new architectures

---

## 📝 License

MIT

---

## 🔗 Related Projects

- [package-builder](https://github.com/BPMSoftwareSolutions/package-builder) - AI-assisted package builder
- [RenderX](https://github.com/BPMSoftwareSolutions/renderx) - Main RenderX platform

---

## 📞 Support

For questions and support, please open an issue in this repository.

---

**Built with ❤️ by BPM Software Solutions**
