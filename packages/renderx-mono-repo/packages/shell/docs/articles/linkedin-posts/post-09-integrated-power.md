Title: Composability: When Independent Plugins Create Emergent Power

The magic isn’t that plugins *exist*—it’s that they interoperate predictably through contracts.

Example Flow:
1. Library plugin emits drag.start with component metadata.
2. Canvas plugin listens (topic: component.intent) and previews placement.
3. Canvas-Component plugin runs create sequence (beats: allocateId → materialize → publishAdd).
4. Control Panel plugin receives component.add event and seeds editable state.

No plugin knows internal code of another; they only share stable nouns.

Emergent Advantages:
- Feature Fusion: Combine two existing domains to ship a "new" capability (drag-to-configure) with 0 shared code.
- Replaceability: Swap Canvas implementation—other plugins unaffected (they only care about events).
- Parallel Delivery: 4 teams can contribute to a single user journey without blocking.
- Predictable Debugging: Reconstruct user action via ordered sequence + topic log.

Design Enablers:
- Narrow event taxonomy (avoid synonyms: component.add vs component.created)
- Explicit sequence start triggers (play IDs logged)
- Versioned contract evolution (component.add.v2)

Ask: Can you diagram an end-to-end multi-plugin user flow using only event + sequence names (no file paths)? If yes, integration is intentional—not accidental.

Illustration idea (plugin-collaboration.svg): Chain of colored plugin boxes passing event envelopes along a bus line, culminating in a user-visible result icon.
