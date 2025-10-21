Title: AI Coder Ergonomics: Design for Machines Too

If you want AI pair programming to deliver 10x value, make the repo legible to non-humans:

Design Moves:
- Narrow side-effect surfaces (one orchestration layer)
- Stable identifiers (manifest IDs, sequence names)
- Deterministic logs (prefix + correlation IDs)
- Declarative contracts (JSON + schemas)
- Avoid clever runtime reflection (LLMs hallucinate around it)

Anti-Patterns:
- Inlined business rules inside JSX
- Random string channels ("bus.publish('foo42')")
- Multiple ad-hoc loading spinners scattered everywhere

Question to ask in PR review: “Could an AI safely regenerate this file from the contract + test?” If not, reduce hidden state.

Illustration idea (ai-ergonomics.svg): Robot + human reviewing a structured repo tree with highlighted manifest + sequences.
