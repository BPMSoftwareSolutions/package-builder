export default {
  rules: {
    "panelslot-inside-slotcontainer": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Require that <PanelSlot> is used only inside <SlotContainer> wrappers",
        },
        schema: [],
        messages: {
          wrapped:
            "<PanelSlot> must be nested inside <SlotContainer> (issue #70).",
        },
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            const name = node && node.name && node.name.name;
            if (name !== "PanelSlot") return;

            // Walk up ancestors to see if any JSXElement is <SlotContainer>
            let p = node.parent; // starts at JSXElement
            let ok = false;
            while (p) {
              if (p.type === "JSXElement") {
                const opening = p.openingElement;
                const parentName = opening && opening.name && opening.name.name;
                if (parentName === "SlotContainer") {
                  ok = true;
                  break;
                }
              }
              p = p.parent;
            }

            if (!ok) {
              context.report({ node, messageId: "wrapped" });
            }
          },
        };
      },
    },
  },
};
