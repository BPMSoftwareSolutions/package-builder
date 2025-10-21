Title: Scaling Front-End Architecture Without Rewrites

A lot of teams think “scale” means migrating frameworks. Real scale comes from reducing blast radius while increasing parallel throughput.

This plugin + sequence + manifest model scales because it decomposes along three independent axes:
1. Surface Area: Slots stay constant while plugins add capability.
2. Behavior: Sequences evolve independently (add beats, swap implementations) without touching UI.
3. Vocabulary: Manifests + topics add new nouns/verbs without code spelunking.

Key Scaling Properties:
- Bounded Load Surface: The host mounts panels the exact same way no matter how many plugins you add.
- Declarative Wiring: New plugin? Append JSON—no conditional import spaghetti.
- Horizontal Team Parallelism: Each plugin repo can ship on its own cadence.
- Safe Evolution: Sequence beats are linear & named—profiling + refactors stay surgical.

Signals You’re Scaling Well:
- Adding a new domain = 1 new directory + manifest entry.
- Incident resolution uses structured sequence logs, not guesswork.
- “Can we A/B a different library panel?” → Data change, not architectural meeting.

Litmus Test: If you doubled feature scope next quarter, does the host shell change? If yes, you’re coupling growth to infrastructure.

Illustration idea (scale-layers.svg): Concentric rings: Host Core in center, around it Sequences, around that Plugins (many), outer ring Manifests/Contracts enabling growth arrows.
