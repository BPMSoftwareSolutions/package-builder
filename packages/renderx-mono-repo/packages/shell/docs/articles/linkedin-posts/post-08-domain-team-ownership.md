Title: Domain Ownership Without the Monolith Food Fight

Team scaling fails when boundaries are soft. This model enforces *structural autonomy*:
- Each plugin = domain vertical (UI + orchestration beats + local assets)
- Shared contracts (topics / sequences / component schemas) = collaboration membrane
- Host shell stays neutral—never becomes a dumping ground for cross-team hacks

Ownership Playbook:
RACI Lite
- Responsible: Plugin team implements beats + UI
- Accountable: Domain architect curates manifest vocabulary
- Consulted: Adjacent plugin owners when extending topics
- Informed: All teams via contract change log

Guardrails:
- No cross-plugin imports (force event/topic mediation)
- Sequence names follow domain prefix: library.load, canvas.component.add
- Shared utilities live in versioned packages, not copied helpers
- Manifest PRs require schema + human-readable rationale

Outcomes:
- Fewer merge conflicts (teams touch their lane)
- Faster onboarding (read contracts + one directory)
- Cleaner blame surfaces (incident maps to plugin + sequence)

Heuristic: If a PR touches >2 plugin directories routinely, boundary design needs work.

Illustration idea (ownership-boundaries.svg): Grid of plugin boxes each with a padlock & small contract icon linking to a shared bus in the center.
