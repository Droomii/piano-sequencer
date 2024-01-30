export namespace Util {
    export function isBlackKey(n: number): boolean {
        const mod12 = n % 12;
        const isEven = mod12 % 2 === 0
        const isGreaterThan4 = mod12 > 4;
        return isGreaterThan4 ? isEven : !isEven;
    }

    export function relu(val: number): number {
        return Math.max(0, val);
    }
}