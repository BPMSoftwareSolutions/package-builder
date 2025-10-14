# write a quick MD (optional)
def write_md(repo_root, report, manifest):
    lines = ["# Python Skill Coverage", ""]
    for s in manifest["skills"]:
        r = report.get(s["id"], {})
        status = "✅" if r.get("present") else "❌"
        lines.append(f"- {status} **{s['title']}** — hits: {len(r.get('hits',[]))}")
    (repo_root/"LEARNING_REPORT.md").write_text("\n".join(lines))
