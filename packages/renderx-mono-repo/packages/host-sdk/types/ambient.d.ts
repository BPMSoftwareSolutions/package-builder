// Ambient module declarations to keep the SDK buildable without host/demo-only deps

declare module '@renderx-plugins/*' {
  const anyExport: any;
  export = anyExport;
  export default anyExport;
}

declare module '*?raw' {
  const content: string;
  export default content;
}

declare module '../../vendor/vendor-symphony-loader' {
  export function getVendorSymphonyLoader(spec: string): (() => Promise<any>) | undefined;
}

declare module '../../../data/feature-flags.json' {
  const flags: Record<string, any>;
  export default flags;
}

declare module 'ajv' {
  const Ajv: any;
  export = Ajv;
  export default Ajv;
}

