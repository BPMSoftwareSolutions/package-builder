# ADF Integration Guide - RenderX Plugins Demo

## Overview

This guide explains how to integrate the Architecture Definition File (ADF) into the RenderX Plugins Demo repository.

---

## 📁 File Organization

### Option 1: Root Directory (Recommended for Small Projects)
```
renderx-plugins-demo/
├── renderx-plugins-demo-adf.json
├── README.md
├── package.json
└── ...
```

### Option 2: Dedicated Architecture Directory (Recommended for Large Projects)
```
renderx-plugins-demo/
├── docs/
│   ├── architecture/
│   │   ├── renderx-plugins-demo-adf.json
│   │   ├── ARCHITECTURE.md
│   │   └── C4_MODEL.md
│   └── ...
├── README.md
├── package.json
└── ...
```

### Option 3: Monorepo Structure
```
renderx-plugins-demo/
├── adf/
│   ├── renderx-plugins-demo-adf.json
│   ├── ARCHITECTURE.md
│   └── LAYERS.md
├── docs/
├── src/
└── ...
```

---

## 🚀 Integration Steps

### Step 1: Choose Location
Decide where to store the ADF files based on your project structure.

### Step 2: Copy Files
Copy the generated files to your chosen location:

```bash
# Option 1: Root directory
cp renderx-plugins-demo-adf.json .
cp RENDERX_PLUGINS_DEMO_ADF_DOCUMENTATION.md docs/

# Option 2: Architecture directory
mkdir -p docs/architecture
cp renderx-plugins-demo-adf.json docs/architecture/
cp RENDERX_PLUGINS_DEMO_ADF_DOCUMENTATION.md docs/architecture/ARCHITECTURE.md
```

### Step 3: Update README
Add a link to the ADF in your main README.md:

```markdown
## Architecture

For a detailed architecture overview, see the [Architecture Definition File](docs/architecture/renderx-plugins-demo-adf.json).

### Quick Overview
- **Type**: Thin-client plugin host application
- **Framework**: React 19 + TypeScript
- **Orchestration**: MusicalConductor
- **Plugin System**: Manifest-driven loading
- **Health Score**: 0.85 | Test Coverage: 80%

[View Full Architecture Documentation](RENDERX_PLUGINS_DEMO_ADF_DOCUMENTATION.md)
```

### Step 4: Create Architecture Documentation Index
Create `docs/ARCHITECTURE.md`:

```markdown
# Architecture Documentation

## Quick Links
- [Architecture Definition File (ADF)](architecture/renderx-plugins-demo-adf.json)
- [Architecture Overview](architecture/ARCHITECTURE.md)
- [C4 Model](architecture/C4_MODEL.md)
- [Layered Architecture](architecture/LAYERS.md)

## Key Concepts
- Manifest-driven plugin loading
- MusicalConductor orchestration
- Layered architecture (5 layers)
- Artifact integrity verification
- External plugin mode

## Components
1. Host Application
2. Plugin System
3. Orchestration Engine
4. Example Plugins
5. UI Layer
6. Artifact System

See the ADF for detailed specifications.
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow
Create `.github/workflows/validate-adf.yml`:

```yaml
name: Validate ADF

on:
  push:
    paths:
      - 'docs/architecture/renderx-plugins-demo-adf.json'
      - '.github/workflows/validate-adf.yml'
  pull_request:
    paths:
      - 'docs/architecture/renderx-plugins-demo-adf.json'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Validate JSON
        run: |
          python3 -m json.tool docs/architecture/renderx-plugins-demo-adf.json > /dev/null
          echo "✅ ADF JSON is valid"
      
      - name: Check Required Fields
        run: |
          python3 << 'EOF'
          import json
          with open('docs/architecture/renderx-plugins-demo-adf.json') as f:
              adf = json.load(f)
          required = ['version', 'name', 'c4Model', 'dependencies']
          for field in required:
              assert field in adf, f"Missing required field: {field}"
          print("✅ All required fields present")
          EOF
```

### Validation Script
Create `scripts/validate-adf.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const adfPath = process.argv[2] || 'docs/architecture/renderx-plugins-demo-adf.json';

try {
  const adf = JSON.parse(fs.readFileSync(adfPath, 'utf8'));
  
  // Validate structure
  const required = ['version', 'name', 'c4Model', 'dependencies'];
  for (const field of required) {
    if (!adf[field]) throw new Error(`Missing required field: ${field}`);
  }
  
  // Validate C4 model
  if (!adf.c4Model.containers || adf.c4Model.containers.length === 0) {
    throw new Error('C4 model must have at least one container');
  }
  
  console.log('✅ ADF validation passed');
  console.log(`   Version: ${adf.version}`);
  console.log(`   Containers: ${adf.c4Model.containers.length}`);
  console.log(`   Dependencies: ${adf.dependencies.runtime.length + adf.dependencies.devDependencies.length}`);
  
} catch (error) {
  console.error('❌ ADF validation failed:', error.message);
  process.exit(1);
}
```

Add to `package.json`:
```json
{
  "scripts": {
    "validate:adf": "node scripts/validate-adf.js"
  }
}
```

---

## 📊 Monitoring & Updates

### When to Update the ADF

1. **Dependency Changes**
   - New packages added
   - Version updates
   - Removed dependencies

2. **Architecture Changes**
   - New containers/components
   - Relationship changes
   - Layer modifications

3. **Feature Changes**
   - New features added
   - Features deprecated
   - Phase transitions

4. **Metrics Changes**
   - Health score updates
   - Test coverage changes
   - Build status changes

### Update Process

1. **Identify Changes**
   - Review recent commits
   - Check package.json updates
   - Review architecture decisions

2. **Update ADF**
   - Modify `renderx-plugins-demo-adf.json`
   - Update documentation
   - Validate changes

3. **Commit & Review**
   - Create PR with ADF changes
   - Include rationale in commit message
   - Link to related issues

4. **Merge & Deploy**
   - Merge to main branch
   - Update documentation site
   - Notify team

---

## 🔗 Documentation Links

### In README.md
```markdown
## Architecture

- [Architecture Definition File](docs/architecture/renderx-plugins-demo-adf.json)
- [Architecture Documentation](RENDERX_PLUGINS_DEMO_ADF_DOCUMENTATION.md)
- [C4 Model Diagram](docs/architecture/C4_MODEL.md)
```

### In Contributing Guide
```markdown
## Architecture

Before making architectural changes, review the [ADF](docs/architecture/renderx-plugins-demo-adf.json).

Key architectural principles:
- Manifest-driven plugin loading
- Layered architecture
- Artifact integrity verification
```

### In Onboarding Guide
```markdown
## Understanding the Architecture

1. Read the [Architecture Overview](RENDERX_PLUGINS_DEMO_ADF_DOCUMENTATION.md)
2. Review the [C4 Model](docs/architecture/C4_MODEL.md)
3. Explore the [Layered Architecture](docs/architecture/LAYERS.md)
4. Check the [ADF JSON](docs/architecture/renderx-plugins-demo-adf.json)
```

---

## 🎯 Best Practices

1. **Keep ADF Updated**
   - Update when architecture changes
   - Review quarterly
   - Link to issues/PRs

2. **Version Control**
   - Commit ADF changes with code changes
   - Use meaningful commit messages
   - Reference issues in commits

3. **Documentation**
   - Keep documentation in sync
   - Link from README
   - Include in onboarding

4. **Validation**
   - Validate JSON syntax
   - Check required fields
   - Verify relationships

5. **Team Communication**
   - Share ADF with team
   - Use in architecture reviews
   - Reference in discussions

---

## 📞 Support

For questions about the ADF:
- Review `RENDERX_PLUGINS_DEMO_ADF_DOCUMENTATION.md`
- Check `ADF_SUMMARY.md`
- Refer to the JSON schema in `renderx-plugins-demo-adf.json`

---

## ✅ Checklist

- [ ] Choose storage location
- [ ] Copy ADF files to repository
- [ ] Update README with ADF link
- [ ] Create architecture documentation index
- [ ] Set up CI/CD validation
- [ ] Create validation script
- [ ] Update contributing guide
- [ ] Update onboarding guide
- [ ] Commit and push changes
- [ ] Create PR for review
- [ ] Merge to main branch

