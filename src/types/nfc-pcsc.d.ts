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
    on(event: 'reader', listener: (reader: Reader) => void): void;
    on(event: 'error', listener: (error: Error) => void): void;
    on(event: 'end', listener: () => void): void;
  }
}
