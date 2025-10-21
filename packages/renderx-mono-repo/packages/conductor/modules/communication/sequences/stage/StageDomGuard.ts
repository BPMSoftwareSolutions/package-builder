/**
 * StageDomGuard (dev-mode)
 * Warns when direct DOM writes occur outside StageCrew.
 * Provides a silence() helper to temporarily disable warnings during StageCrew apply.
 */

export class StageDomGuard {
  private static installed = false;
  private static originals: Partial<{
    setAttribute: any;
    removeAttribute: any;
    appendChild: any;
    removeChild: any;
    replaceChild: any;
    insertBefore: any;
    classListAdd: any;
    classListRemove: any;
    styleSetProperty: any;
    createElement: any;
  }> = {};
  private static silenced = 0;

  static install(): void {
    if (this.installed) return;
    if (typeof document === "undefined") return;

    try {
      // Element attribute methods
      this.originals.setAttribute = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function (
        this: Element,
        name: string,
        value: string
      ) {
        StageDomGuard.maybeWarn("setAttribute", this);
        return StageDomGuard.originals.setAttribute!.call(this, name, value);
      } as any;

      this.originals.removeAttribute = Element.prototype.removeAttribute;
      Element.prototype.removeAttribute = function (
        this: Element,
        name: string
      ) {
        StageDomGuard.maybeWarn("removeAttribute", this);
        return StageDomGuard.originals.removeAttribute!.call(this, name);
      } as any;

      // Node tree methods
      this.originals.appendChild = Node.prototype.appendChild;
      Node.prototype.appendChild = function <T extends Node>(
        this: Node,
        child: T
      ): T {
        StageDomGuard.maybeWarn("appendChild", this);
        return StageDomGuard.originals.appendChild!.call(this, child);
      } as any;

      this.originals.removeChild = Node.prototype.removeChild;
      Node.prototype.removeChild = function <T extends Node>(
        this: Node,
        child: T
      ): T {
        StageDomGuard.maybeWarn("removeChild", this);
        return StageDomGuard.originals.removeChild!.call(this, child);
      } as any;

      this.originals.replaceChild = Node.prototype.replaceChild;
      Node.prototype.replaceChild = function <T extends Node>(
        this: Node,
        newChild: Node,
        oldChild: T
      ): T {
        StageDomGuard.maybeWarn("replaceChild", this);
        return StageDomGuard.originals.replaceChild!.call(
          this,
          newChild,
          oldChild
        );
      } as any;

      this.originals.insertBefore = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function <T extends Node>(
        this: Node,
        newNode: Node,
        ref: T | null
      ): T {
        StageDomGuard.maybeWarn("insertBefore", this);
        return StageDomGuard.originals.insertBefore!.call(this, newNode, ref);
      } as any;

      // classList add/remove
      this.originals.classListAdd = (DOMTokenList.prototype as any).add;
      (DOMTokenList.prototype as any).add = function (
        this: DOMTokenList,
        ...tokens: string[]
      ) {
        StageDomGuard.maybeWarn("classList.add", (this as any).ownerElement);
        return StageDomGuard.originals.classListAdd!.apply(this, tokens);
      } as any;

      this.originals.classListRemove = (DOMTokenList.prototype as any).remove;
      (DOMTokenList.prototype as any).remove = function (
        this: DOMTokenList,
        ...tokens: string[]
      ) {
        StageDomGuard.maybeWarn("classList.remove", (this as any).ownerElement);
        return StageDomGuard.originals.classListRemove!.apply(this, tokens);
      } as any;

      // style.setProperty
      this.originals.styleSetProperty =
        CSSStyleDeclaration.prototype.setProperty;
      CSSStyleDeclaration.prototype.setProperty = function (
        this: CSSStyleDeclaration,
        prop: string,
        value: string | null,
        priority?: string
      ) {
        StageDomGuard.maybeWarn(
          "style.setProperty",
          (this as any).ownerElement
        );
        return StageDomGuard.originals.styleSetProperty!.call(
          this,
          prop,
          value,
          priority
        );
      } as any;

      // document.createElement (for visibility)
      this.originals.createElement = Document.prototype.createElement;
      Document.prototype.createElement = function (
        this: Document,
        tagName: string,
        options?: any
      ) {
        StageDomGuard.maybeWarn("document.createElement", this);
        return StageDomGuard.originals.createElement!.call(
          this,
          tagName,
          options
        );
      } as any;

      this.installed = true;
    } catch (e) {
      console.warn(
        "⚠️ StageDomGuard: install failed:",
        (e as any)?.message || e
      );
    }
  }

  static uninstall(): void {
    if (!this.installed) return;
    try {
      if (this.originals.setAttribute)
        Element.prototype.setAttribute = this.originals.setAttribute;
      if (this.originals.removeAttribute)
        Element.prototype.removeAttribute = this.originals.removeAttribute;
      if (this.originals.appendChild)
        Node.prototype.appendChild = this.originals.appendChild;
      if (this.originals.removeChild)
        Node.prototype.removeChild = this.originals.removeChild;
      if (this.originals.replaceChild)
        Node.prototype.replaceChild = this.originals.replaceChild;
      if (this.originals.insertBefore)
        Node.prototype.insertBefore = this.originals.insertBefore;
      if (this.originals.classListAdd)
        (DOMTokenList.prototype as any).add = this.originals.classListAdd;
      if (this.originals.classListRemove)
        (DOMTokenList.prototype as any).remove = this.originals.classListRemove;
      if (this.originals.styleSetProperty)
        CSSStyleDeclaration.prototype.setProperty =
          this.originals.styleSetProperty;
      if (this.originals.createElement)
        Document.prototype.createElement = this.originals.createElement;
    } catch {}
    this.installed = false;
  }

  static silence<T>(fn: () => T): T {
    this.silenced++;
    try {
      return fn();
    } finally {
      this.silenced--;
    }
  }

  private static maybeWarn(op: string, el: any): void {
    try {
      if (this.silenced > 0) return;
      // In tests/CI, keep output concise
      console.warn(
        `⚠️ StageDomGuard: Direct DOM write detected via ${op}. Use ctx.stageCrew instead.`
      );
    } catch {}
  }
}
