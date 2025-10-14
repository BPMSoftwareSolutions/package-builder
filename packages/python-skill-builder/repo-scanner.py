# scan_repos.py
import ast, json, sys, re
from pathlib import Path
import yaml

def load_manifest(path="skills.yaml"):
    return yaml.safe_load(Path(path).read_text())

def py_files(root: Path):
    return [p for p in root.rglob("*.py") if "venv" not in p.parts and ".tox" not in p.parts and "__pycache__" not in p.parts]

def has_imports(tree, modules):
    found = set()
    for n in ast.walk(tree):
        if isinstance(n, ast.Import):
            for alias in n.names:
                found.add(alias.name.split('.')[0])
        elif isinstance(n, ast.ImportFrom):
            mod = (n.module or '').split('.')[0]
            if mod: found.add(mod)
    return any(m in found for m in modules)

def detect(tree, det):
    kind = det.get("kind")
    if kind == "ast":
        node_types = tuple(getattr(ast, t) for t in det.get("node_types", []))
        return any(isinstance(n, node_types) for n in ast.walk(tree))
    if kind == "import":
        return has_imports(tree, det.get("modules", []))
    if kind == "ast-query":
        # minimal example: look for property/classmethod decorators
        for n in ast.walk(tree):
            if isinstance(n, ast.FunctionDef):
                names = [getattr(d, 'id', getattr(getattr(d,'attr', None),'id', None)) for d in n.decorator_list]
                if any(x in ('property','classmethod','staticmethod') for x in names if x):
                    return True
        return False
    if kind == "ast-search":
        node_types = tuple(getattr(ast, t) for t in det.get("node_types", []))
        return any(isinstance(n, node_types) for n in ast.walk(tree))
    return False

def scan_repo(repo_root: Path, manifest):
    results = {s['id']: {'present': False, 'hits': []} for s in manifest['skills']}
    for f in py_files(repo_root):
        try:
            tree = ast.parse(f.read_text(encoding='utf-8'), filename=str(f))
        except Exception:
            continue
        for skill in manifest['skills']:
            if any(detect(tree, d) for d in skill['detectors']):
                results[skill['id']]['present'] = True
                results[skill['id']]['hits'].append(str(f))
    return results

def main():
    manifest = load_manifest()
    root = Path(sys.argv[1]) if len(sys.argv)>1 else Path(".")
    report = scan_repo(root, manifest)
    out = root / "learning_playground" / "skill_report.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2))
    print(f"[ok] wrote {out}")

if __name__ == "__main__":
    main()
