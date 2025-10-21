# Container Child Interaction Issues

## Summary

When child components are placed inside container components, DOM event bubbling causes interaction issues:

1. **Selection Issue**: Clicking a child component selects the container instead of the child
2. **Drag Issue**: Dragging a child component moves the container instead of the child  
3. **Overlay Issue**: Selection overlay appears over the container instead of the child

## Root Cause

In `plugins/canvas-component/symphonies/create/create.interactions.stage-crew.ts`, both selection and drag event listeners are attached to every component:

```typescript
// Line 30: Selection handler
(el as any).addEventListener?.("click", () => onSelected?.({ id }));

// Line 45: Drag handler  
(el as any).addEventListener?.("mousedown", (e: MouseEvent) => { ... });
```

When a child component is inside a container:
- Both child and container have these event listeners
- DOM event bubbling causes both handlers to fire
- Container's handler runs last, overriding child's behavior

## Evidence: Failing Tests

Created comprehensive failing tests that reproduce the issues:

### Test Results
```
❯ __tests__/canvas-component/container-child-selection.spec.ts (2 failed)
  × FAILS: clicking child component should select child, not container
  × FAILS: dragging child component should drag child, not container

❯ __tests__/canvas-component/container-child-overlay.spec.ts (2 failed)  
  × FAILS: selection overlay should position over child, not container
  × FAILS: overlay should track child element during drag, not container
```

### Specific Failures
- **Selection**: Both `childSelectedSpy` and `containerSelectedSpy` are called
- **Drag**: Both `childDragStartSpy` and `containerDragStartSpy` are called
- **Overlay**: Positioned at `50px` (container) instead of `75px` (child absolute position)

## Expected Behavior

1. **Child Selection**: Clicking child should select only the child, show child overlay
2. **Child Drag**: Dragging child should move only the child, not the container
3. **Event Isolation**: Child interactions should not bubble up to container

## Proposed Solutions

### Option A: Event Stopping (Recommended)
Add `e.stopPropagation()` in child event handlers to prevent bubbling:

```typescript
// In attachSelection and attachDrag functions
(el as any).addEventListener?.("click", (e: Event) => {
  e.stopPropagation(); // Prevent bubbling to parent container
  onSelected?.({ id });
});

(el as any).addEventListener?.("mousedown", (e: MouseEvent) => {
  e.stopPropagation(); // Prevent bubbling to parent container
  // ... rest of drag logic
});
```

### Option B: Event Delegation
Use a single event listener on the canvas that determines the correct target based on event.target.

### Option C: Z-Index/Layering
Use CSS pointer-events or z-index to control which element receives events.

## Files to Modify

- `plugins/canvas-component/symphonies/create/create.interactions.stage-crew.ts`
  - `attachSelection()` function
  - `attachDrag()` function

## Test Coverage

- `__tests__/canvas-component/container-child-selection.spec.ts` - Selection and drag bubbling
- `__tests__/canvas-component/container-child-overlay.spec.ts` - Overlay positioning

## Priority

**High** - This breaks the fundamental interaction model for nested components, making containers unusable for their intended purpose.

## Acceptance Criteria

- [ ] Clicking child component selects only the child
- [ ] Dragging child component moves only the child  
- [ ] Selection overlay appears over the child, not container
- [ ] All failing tests pass
- [ ] Container functionality still works for direct interactions
- [ ] No regression in existing component interactions
