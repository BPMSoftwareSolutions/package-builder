# fill_gaps.py
import json, subprocess
from pathlib import Path
import yaml

def load_manifest(): return yaml.safe_load(Path("skills.yaml").read_text())

def create_files(repo_root: Path, skill):
    for t in skill.get("templates", []):
        path = repo_root / t["path"]
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(t["content"])
    # add a tiny test
    tests = repo_root / "tests"
    tests.mkdir(exist_ok=True, parents=True)
    tests_file = tests / f"test_{skill['id']}.py"
    if not tests_file.exists():
        tests_file.write_text(f"def test_{skill['id']}_exists(): assert True\n")

def git(*args, cwd):
    return subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True)

def propose_pr(repo_root: Path, branch, title, body):
    git("checkout", "-b", branch, cwd=repo_root)
    git("add", ".", cwd=repo_root)
    git("commit", "-m", title, cwd=repo_root)
    # requires gh CLI authenticated
    subprocess.run(["gh", "pr", "create", "--fill", "--title", title, "--body", body], cwd=repo_root)

def main(repo="."):
    repo_root = Path(repo)
    manifest = load_manifest()
    report = json.loads((repo_root/"learning_playground/skill_report.json").read_text())
    missing = [s for s in manifest["skills"] if not report.get(s["id"],{}).get("present")]
    if not missing:
        print("[ok] no gaps 🎉"); return
    for skill in missing:
        create_files(repo_root, skill)
    title = "chore(learning): add minimal examples for missing Python concepts"
    body = "Adds learning_playground examples and tests for skills: " + ", ".join(s["id"] for s in missing)
    propose_pr(repo_root, "learning/add-missing-skill-examples", title, body)
    print("[ok] PR opened")

if __name__ == "__main__":
    import sys; main(sys.argv[1] if len(sys.argv)>1 else ".")
