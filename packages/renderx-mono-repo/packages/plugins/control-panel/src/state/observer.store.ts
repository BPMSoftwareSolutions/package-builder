// Simple observer registry for Control Panel UI callbacks
// Keeps UI thin by allowing symphonies to notify registered observers
// Robust against multiple module graphs/bundles by anchoring in globalThis

type SelectionObserver = (selectionModel: any) => void;
type ClassesObserver = (classData: any) => void;
type CssRegistryObserver = (cssData: any) => void;

type Store = {
  selectionObserver: SelectionObserver | null;
  classesObserver: ClassesObserver | null;
  cssRegistryObserver: CssRegistryObserver | null;
};

const GLOBAL_KEY = "__RX_CP_OBSERVERS__";

function getStore(): Store {
  const g = globalThis as any;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      selectionObserver: null,
      classesObserver: null,
      cssRegistryObserver: null,
    } as Store;
  }
  return g[GLOBAL_KEY] as Store;
}

export function setSelectionObserver(observer: SelectionObserver | null) {
  const store = getStore();
  if (observer === store.selectionObserver) return; // idempotent
  store.selectionObserver = observer;
}

export function getSelectionObserver(): SelectionObserver | null {
  return getStore().selectionObserver;
}

export function setClassesObserver(observer: ClassesObserver | null) {
  const store = getStore();
  if (observer === store.classesObserver) return; // idempotent
  store.classesObserver = observer;
}

export function getClassesObserver(): ClassesObserver | null {
  return getStore().classesObserver;
}

export function setCssRegistryObserver(observer: CssRegistryObserver | null) {
  const store = getStore();
  if (observer === store.cssRegistryObserver) return; // idempotent
  store.cssRegistryObserver = observer;
}

export function getCssRegistryObserver(): CssRegistryObserver | null {
  return getStore().cssRegistryObserver;
}

// Utilities for cleanup/testing
export function clearAllObservers() {
  const store = getStore();
  store.selectionObserver = null;
  store.classesObserver = null;
  store.cssRegistryObserver = null;
}
