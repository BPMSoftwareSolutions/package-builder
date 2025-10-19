# RenderX Plugins Demo - Architecture Quick Reference

## 🎯 One-Page Architecture Overview

### Project Type
**Thin-Client Plugin Host Application** with manifest-driven plugin loading orchestrated via MusicalConductor

### Repository
- **URL**: https://github.com/BPMSoftwareSolutions/renderx-plugins-demo
- **Organization**: BPMSoftwareSolutions
- **License**: Apache-2.0
- **Status**: Active

---

## 🏗️ 6-Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RenderX Host Application                 │
│              (React 19 + TypeScript + Vite)                 │
│                    Health: 0.85 | Cov: 78%                  │
└─────────────────────────────────────────────────────────────┘
         ↓ depends_on    ↓ depends_on    ↓ loads    ↓ uses
    ┌─────────┐    ┌──────────────┐  ┌──────────┐  ┌────────┐
    │ Plugin  │    │MusicalCond. │  │ Example  │  │   UI   │
    │ System  │    │   Engine     │  │ Plugins  │  │ Layer  │
    │ 0.88    │    │   0.90       │  │  0.82    │  │ 0.84   │
    └─────────┘    └──────────────┘  └──────────┘  └────────┘
         ↑                                    ↓
         └────────────────────────────────────┘
                  implements & uses
                        ↓
                  ┌──────────────┐
                  │ Artifact     │
                  │ System       │
                  │ 0.86         │
                  └──────────────┘
```

---

## 📦 Container Details

| Container | Type | Tech | Health | Coverage | Key Packages |
|-----------|------|------|--------|----------|--------------|
| **Host App** | Web App | React 19 | 0.85 | 78% | renderx-plugins-demo |
| **Plugin System** | Library | TS/Node | 0.88 | 82% | @renderx-plugins/host-sdk |
| **MusicalConductor** | Library | TS/Node | 0.90 | 85% | musical-conductor 1.4.5 |
| **Example Plugins** | Library | React | 0.82 | 75% | @renderx-plugins/* |
| **UI Layer** | Components | React | 0.84 | 80% | 5-layer architecture |
| **Artifact System** | Build | Node.js | 0.86 | 79% | Manifest generation |

---

## 🎨 5-Layer Architecture

```
┌─────────────────────────────────────────┐
│  Presentation Layer (UI Components)     │
│  src/ui - React components & pages      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Domain Layer (Business Logic)          │
│  src/domain - Domain models & rules     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Core Layer (Utilities)                 │
│  src/core - Helpers & common functions  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Infrastructure Layer (External Svcs)   │
│  src/infrastructure - API integrations  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Vendor Layer (Third-Party)             │
│  src/vendor - External libraries        │
└─────────────────────────────────────────┘
```

---

## 🔗 Component Relationships

```
Host App
├─ depends_on → Plugin System (SDK & interfaces)
├─ depends_on → MusicalConductor (orchestration)
├─ loads → Example Plugins (manifest-driven)
└─ uses → UI Layer (React components)

Example Plugins
├─ implements → Plugin System interfaces
└─ uses → MusicalConductor for coordination

Artifact System
└─ generates → Plugin manifests & integrity hashes
```

---

## 📊 Key Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Overall Health Score | 0.85 | ✅ Good |
| Average Test Coverage | 80% | ✅ Good |
| Build Status | Success | ✅ Passing |
| Containers | 6 | ✅ Complete |
| Active Features | 7 | ✅ Production |
| Dependencies | 12 | ✅ Managed |

---

## 🎯 7 Active Features

| # | Feature | Status | Phase |
|---|---------|--------|-------|
| 1 | Manifest-Driven Loading | ✅ | Production |
| 2 | Plugin Orchestration | ✅ | Production |
| 3 | UI Slot System | ✅ | Production |
| 4 | Artifact Integrity | ✅ | Beta |
| 5 | External Plugin Mode | ✅ | Beta |
| 6 | Diagnostics Panel | ✅ | Production |
| 7 | Host SDK | ✅ | Release Candidate |

---

## 📦 Key Dependencies

### Runtime (5)
- React 19.1.1
- MusicalConductor 1.4.5
- TypeScript 5.9.2
- Lucide React 0.544.0
- @renderx-plugins/host-sdk 1.0.4-rc.0

### Development (7)
- Vite 7.1.3
- Vitest 3.2.4
- Cypress 15.2.0
- ESLint 9.33.0
- TypeScript 5.9.2
- React 19.1.1
- React DOM 19.1.1

---

## 🛠️ Build & Test Commands

```bash
# Development
npm run dev                    # Start dev server
npm run pre:manifests         # Generate manifests

# Production
npm run build                 # Build for production
npm run preview               # Preview production build

# Testing
npm run test                  # Run unit tests
npm run test:watch            # Watch mode
npm run e2e                   # Run E2E tests

# Code Quality
npm run lint                  # Run ESLint
```

---

## 📋 Artifact System

### Generated Manifests
- `interaction-manifest.json` - Interaction definitions
- `topics-manifest.json` - Topic catalog
- `layout-manifest.json` - UI layout config
- `plugin-manifest.json` - Plugin metadata
- `artifacts.integrity.json` - SHA-256 hashes

### Catalogs
- `json-layout/` - Layout definitions
- `json-plugins/` - Plugin definitions

---

## 🌍 Environment Variables

```bash
# Pre-built artifacts directory
HOST_ARTIFACTS_DIR=./artifacts

# Skip validation summary
RENDERX_DISABLE_STARTUP_VALIDATION=0

# Skip integrity verification
RENDERX_DISABLE_INTEGRITY=0

# Escalate warnings to errors
RENDERX_VALIDATION_STRICT=0
```

---

## 🔄 Active Refactoring

**Diagnostics Module (Issue #297)**
- Current Phase: 4 ✅ (Component extraction)
- Target Phase: 6
- Completed:
  - Phase 1: Type system centralization
  - Phase 2: Business logic extraction
  - Phase 3: Custom hooks extraction
  - Phase 4: Component extraction
- Pending:
  - Phase 5: Tree explorer modularization
  - Phase 6: Testing & documentation

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `renderx-plugins-demo-adf.json` | Machine-readable ADF |
| `RENDERX_PLUGINS_DEMO_ADF_DOCUMENTATION.md` | Detailed docs |
| `ADF_SUMMARY.md` | Quick reference |
| `ADF_INTEGRATION_GUIDE.md` | Integration steps |
| `README_ADF_CREATION.md` | Project overview |
| `ARCHITECTURE_QUICK_REFERENCE.md` | This file |

---

## 🚀 Quick Start

1. **Understand Architecture**
   - Read this quick reference
   - Review ADF_SUMMARY.md
   - Check renderx-plugins-demo-adf.json

2. **Explore Code**
   - src/ui - UI components
   - src/domain - Business logic
   - src/core - Utilities
   - src/infrastructure - External services
   - src/vendor - Third-party code

3. **Run Locally**
   ```bash
   npm install
   npm run dev
   ```

4. **Build & Test**
   ```bash
   npm run build
   npm run test
   npm run e2e
   ```

---

## 🔗 Related Repositories

- **MusicalConductor**: https://github.com/BPMSoftwareSolutions/MusicalConductor
- **RenderX Plugins**: https://github.com/BPMSoftwareSolutions/renderx-plugins

---

## 💡 Key Concepts

### Manifest-Driven Loading
Plugins are discovered and loaded via JSON manifests instead of hardcoded imports.

### MusicalConductor Orchestration
Plugins coordinate through symphonies, movements, and beats for complex workflows.

### Thin-Client Architecture
Host application is minimal; plugins provide most functionality.

### Artifact Integrity
Pre-built artifacts are verified using SHA-256 hashing.

### External Plugin Mode
Host can run without plugin source code present.

---

## ✅ Health Indicators

- ✅ **0.85** - Overall health score (Good)
- ✅ **80%** - Average test coverage (Good)
- ✅ **Success** - Build status (Passing)
- ✅ **7** - Active features (Complete)
- ✅ **6** - Containers (Well-defined)

---

## 📞 Need Help?

- **Architecture Questions**: See RENDERX_PLUGINS_DEMO_ADF_DOCUMENTATION.md
- **Integration Help**: See ADF_INTEGRATION_GUIDE.md
- **Quick Overview**: See ADF_SUMMARY.md
- **Full Specification**: See renderx-plugins-demo-adf.json

---

**Last Updated**: 2025-10-19  
**Version**: 1.0.0  
**Status**: Active

