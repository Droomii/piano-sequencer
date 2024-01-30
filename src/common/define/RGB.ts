function uByteRange(val: number) {
    return Math.floor(Math.min(Math.max(0, val), 255));
}

export class RGB {

    private _r: number = 0;
    private _g: number = 0;
    private _b: number = 0;

    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    toString(): string{
        return `rgb(${this._r}, ${this._g}, ${this._b})`
    }

    set r(val: number) {
        this._r = uByteRange(val);
    }

    set g(val: number) {
        this._g = uByteRange(val);
    }

    set b(val: number) {
        this._b = uByteRange(val);
    }
}

export namespace RGB {
    export function rgb(r: number, g: number, b: number) {
        return new RGB(r, g, b);
    }
}