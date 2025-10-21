export default {
  rules: {
    "no-hardcoded-play-ids": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Disallow hard-coded pluginId/sequenceId in conductor.play(); use resolveInteraction('<key>').",
          recommended: true,
        },
        schema: [],
        messages: {
          noHardcoded:
            "Do not hard-code pluginId/sequenceId in play(); use resolveInteraction('<key>') → { pluginId, sequenceId }.",
        },
      },
      create(context) {
        const stringConsts = new Set();
        const resolvedVars = new Set();

        const isLiteralString = (n) =>
          n &&
          ((n.type === "Literal" && typeof n.value === "string") ||
            (n.type === "TemplateLiteral" && n.expressions.length === 0));

        const isStringConstIdentifier = (id) =>
          id && id.type === "Identifier" && stringConsts.has(id.name);

        const isResolvedMember = (n, prop) =>
          n &&
          n.type === "MemberExpression" &&
          !n.computed &&
          n.property?.name === prop;

        const inlineResolved = (node, prop) =>
          node?.type === "MemberExpression" &&
          node.object?.type === "CallExpression" &&
          node.object.callee?.type === "Identifier" &&
          node.object.callee.name === "resolveInteraction" &&
          node.property?.name === prop;

        const isAllowedResolvedPattern = (a0, a1) => {
          // r.pluginId / r.sequenceId where r = resolveInteraction('key')
          if (
            isResolvedMember(a0, "pluginId") &&
            isResolvedMember(a1, "sequenceId")
          ) {
            const o0 = a0.object;
            const o1 = a1.object;
            if (
              o0?.type === "Identifier" &&
              o1?.type === "Identifier" &&
              o0.name === o1.name
            ) {
              return resolvedVars.has(o0.name);
            }
          }
          // Inline resolveInteraction('key').pluginId / .sequenceId
          return (
            inlineResolved(a0, "pluginId") && inlineResolved(a1, "sequenceId")
          );
        };

        return {
          VariableDeclarator(node) {
            if (node.id?.type === "Identifier" && isLiteralString(node.init)) {
              stringConsts.add(node.id.name);
            }
            if (
              node.id?.type === "Identifier" &&
              node.init?.type === "CallExpression" &&
              node.init.callee?.type === "Identifier" &&
              node.init.callee.name === "resolveInteraction"
            ) {
              resolvedVars.add(node.id.name);
            }
          },

          "CallExpression[callee.property.name='play']": (node) => {
            const args = node.arguments || [];
            if (args.length < 2) return;
            const [a0, a1] = args;

            if (isAllowedResolvedPattern(a0, a1)) return;

            const hard0 = isLiteralString(a0) || isStringConstIdentifier(a0);
            const hard1 = isLiteralString(a1) || isStringConstIdentifier(a1);
            if (hard0 || hard1) {
              context.report({ node, messageId: "noHardcoded" });
            }
          },
        };
      },
    },
  },
};
