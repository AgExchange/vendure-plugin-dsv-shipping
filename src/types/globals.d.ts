/**
 * Global type declarations
 * Provides minimal typings for global objects when peer dependencies are not installed
 */

// Console declaration
declare const console: {
    log(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    debug(...args: any[]): void;
};

// URLSearchParams (for OAuth)
declare class URLSearchParams {
    constructor(init?: string | Record<string, string>);
    append(name: string, value: string): void;
    toString(): string;
}
