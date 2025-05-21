
interface MercadoPagoInstance {
  checkout: (options: any) => void;
  createCardToken: (options: any) => void;
  getIdentificationTypes: () => void;
}

declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: any) => MercadoPagoInstance;
  }
}

export {};
