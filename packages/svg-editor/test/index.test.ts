import { describe, it, expect, beforeEach } from 'vitest';
import { setAttrs, translate } from '../src/index';

describe('svg-editor', () => {
  let svg: SVGSVGElement, rect: SVGRectElement;

  beforeEach(() => {
    document.body.innerHTML = `<svg><rect id="r"/></svg>`;
    svg = document.querySelector("svg")!;
    rect = document.querySelector("#r")!;
  });

  it('sets attributes', () => {
    expect(setAttrs(rect, { fill: "red", width: 20 })).toBe(true);
    expect(rect.getAttribute("fill")).toBe("red");
    expect(rect.getAttribute("width")).toBe("20");
  });

  it('applies a translate', () => {
    expect(translate("#r", 5, 7)).toBe(true);
    expect(rect.getAttribute("transform")).toContain("translate(5, 7)");
  });

  it('returns false for non-existent elements', () => {
    expect(setAttrs("#nonexistent", { fill: "red" })).toBe(false);
    expect(translate("#nonexistent", 10, 10)).toBe(false);
  });

  it('handles multiple transforms', () => {
    expect(translate("#r", 5, 7)).toBe(true);
    expect(translate("#r", 10, 10)).toBe(true);
    const transform = rect.getAttribute("transform");
    expect(transform).toContain("translate(5, 7)");
    expect(transform).toContain("translate(10, 10)");
  });
});
