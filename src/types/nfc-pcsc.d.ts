declare module 'nfc-pcsc' {
  export interface CardData {
    type?: string;
    standard?: string;
    uid?: string;
    data?: Buffer;
    atr?: Buffer;
  }

  export interface Reader {
    name: string;
    aid?: string;
    transmit(command: Buffer, maxLength: number): Promise<Buffer>;
  }

  export class NFC {
    constructor();
    on(event: 'reader' | 'error' | 'end', listener: ((reader: Reader) => void) | ((error: Error) => void) | (() => void)): void;
  }
}
