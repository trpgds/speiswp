import readline from 'readline';
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

export const question = async (q: string, def: string = "") => (await new Promise<string>(resolve => rl.question(`${q} [${def}]\n`, resolve))) || def;

export function hexToAscii(hex: string) {
    const start = hex.startsWith("0x") ? 2 : 0;

    var str = '';
    var firstNonZero = false;
    for (let i = start; i < hex.length; i += 2) {

        const x = parseInt(hex.substr(i, 2), 16);
        if (x != 0) {
            firstNonZero = true;
        }
        if (!firstNonZero) continue;

        const printable = x > 32 && x <= 126
        str += printable ? String.fromCharCode(x) : "?";
    }
    return str;
}

export function padRight(text: string, len: number, char: string = "0"): string {
    return text + char.repeat(Math.max(len - text.length, 0));
}

export function range(start: number, count: number, step?: number) {
    let ret: number[] = [];
    step = step || 1;
    const end = start + count * step;

    for (let i = start; i < end; i += step) {
        ret.push(i);
    }
    return ret;
}

export function trimLeft(str: string, patt: string) {
    while (str.startsWith(patt)) {
        str = str.substr(patt.length);
    }
    return str;
}

export function referenceEquals<T>(a: T, b: T) {
    return a === b;
}

export function any<T>(arr: readonly T[], pred?: (x: T) => boolean): boolean {
    if (pred) {
        for (const x of arr) {
            if (pred(x)) return true;
        }
        return false;
    } else {
        return arr.length > 0;
    }
}

export function contains<TA, TB>(arr: readonly TA[], value: TB, comparer?: (a: TA, b: TB) => boolean): boolean {
    const effectiveComparer = comparer || referenceEquals;
    return any(arr, x => effectiveComparer(x, value as any));
}


export function exclude<TA, TB>(a: readonly TA[], b: readonly TB[], comparer?: (a: TA, b: TB) => boolean) {
    const comparerEff = comparer && ((b: TB, a: TA) => comparer(a, b));
    return a.filter(aItem => !contains(b, aItem, comparerEff));
}

export function defaultComparer<T>(a: T, b: T): number {
    if (a === b) {
        return 0;
    } else if (a === null && b === undefined) {
        return 1;
    } else if (a === undefined && b === null) {
        return -1;
    } else
        return a > b ? 1 : a < b ? -1 : 0;
}

export type ComparerFunction<T> = (a: T, b: T) => number;

export function combineComparers<T>(...comparers: ((a: T, b: T) => number)[]): (a: T, b: T) => number {
    return (a: T, b: T) => {
        for (const comp of comparers) {
            const result = comp(a, b);
            if (result != 0) return result;
        }
        return 0;
    };
}

export function sort<T>(arr: readonly T[], ...comparers: (ComparerFunction<T>)[]) {
    comparers = comparers.length == 0 ? [defaultComparer] : comparers;
    type T2 = { value: T, index: number };
    const toEffComparer = (func: ComparerFunction<T>) => (a: T2, b: T2) => func(a.value, b.value);
    //Comparamos tambien por indice
    const effComparers: ComparerFunction<T2>[] = [
        ...comparers.map(toEffComparer),
        (a, b) => a.index - b.index
    ];
    const effectiveComparer = combineComparers(...effComparers);

    const copy = arr.map((x, i) => ({ value: x, index: i }));
    copy.sort(effectiveComparer);

    const ret = copy.map(x => x.value);
    return ret;
}

export function orderBy<T>(arr: readonly T[], ...keySelectors: ((x: T) => any)[]) {
    const comparers = keySelectors.map(selector => (a: T, b: T) => +defaultComparer(selector(a), selector(b)));
    return sort(arr, ...comparers);
}

export function asciiToHex(ascii: string): string {
    let ret = "";
    for (let i = 0; i < ascii.length; i++) {
        const code = ascii.charCodeAt(i).toString(16);
        if (code.length == 1) {
            ret += "0";
        }
        ret += code;
    }
    return ret;
}

export function padLeft(text: string, len: number, char: string = "0"): string {
    return char.repeat(Math.max(len - text.length, 0)) + text;
}

export function splitHex(hex: string): string[] {
    hex = trimLeft(hex, "0");

    const desiredLen = Math.ceil(hex.length / 64) * 64;
    hex = padLeft(hex, desiredLen, "0");

    return range(0, hex.length / 64).map(x => "0x" + hex.substr(x * 64, 64))
}

export function first<T>(arr: readonly T[], pred?: (item: T) => boolean): T | undefined {
    for (const a of arr) {
        if (!pred || pred(a))
            return a;
    }
    return undefined;
}

export type Grouping<TKey, TItem> = { key: TKey, items: TItem[] };

export function groupBy<T, TKey>(arr: readonly T[], keySelector: (item: T) => TKey, comparer: (a: TKey, b: TKey) => boolean): Grouping<TKey, T>[] {
    const ret: Grouping<TKey, T>[] = [];

    for (const x of arr) {
        const key = keySelector(x);
        const firstItem = first(ret, x => comparer(x.key, key));
        if (firstItem === undefined) {
            ret.push({ key: key, items: [x] });
        } else {
            firstItem.items.push(x);
        }
    }
    return ret;
}

export function unique<T>(arr: readonly T[], comparer?: (a: T, b: T) => boolean) {
    return groupBy<T, T>(arr, x => x, comparer ?? referenceEquals).map(x => x.key)
}
export type DateUnits = "milliseconds" | "seconds" | "minutes" | "hours" | "days" | "months" | "years";

export function dateDiff(a: Date, b: Date, units: Extract<DateUnits, "milliseconds" | "seconds" | "minutes" | "hours" | "days">): number {
    let x = a.valueOf() - b.valueOf();
    if (units == "milliseconds") return x;

    x /= 1000;
    if (units == "seconds") return x;

    x /= 60;
    if (units == "minutes") return x;

    x /= 60;
    if (units == "hours") return x;

    x /= 24;
    if (units == "days") return x;

    throw new Error();
}


/**A una cadena que representa un numero entero, aplica el separador de miles */
function aplicarSepMiles(intpart: string, sep: string = ","): string {
    if (intpart.length < 4)
        return intpart;

    const start = intpart.length % 3;
    let ret = intpart.substr(0, start);
    for (var i = start; i < intpart.length; i += 3) {
        const subpart = intpart.substr(i, 3);
        ret += i == 0 ? subpart : (sep + subpart);
    }
    return ret;
}


/**
 * Formatea un número
 * @param number El numero
 * @param integer Cantidad de zeros a la izquierda en la parte entera
 * @param decimals Cantidad de zeros a la derecha en la parte desimal
 * @param thousep Usar separador de miles. Por default es false
 * @param prefix Prefijo del numero, ejemplo $ o %. Por default es ""
 * @param sign True para mostrar signo + si el valor > 0, si no, sólo se muestra si valor < 0
 */
export function formatNumber(
    number: number | null | undefined | string,
    integer: number = 0,
    decimals: number = 0,
    thousep: boolean = false,
    prefix: string = "",
    sign: boolean = false,
) {

    if (number == null) return "";

    number = Number(number);
    if (Number.isNaN(number) || !Number.isFinite(number)) {
        return number.toString();
    }

    const zeroes = "00000000000000000000";
    const numSign =
        number < 0 ? "-" :
            (number > 0 && sign) ? "+" : "";
    const absX = Math.abs(number);
    const decInt = Math.pow(10, decimals);

    const int = Math.trunc(Math.round(absX * decInt * 1000) / decInt / 1000);

    const intText = "" + int;
    const intZeroStr = zeroes + intText;

    const intPartSinSep = intZeroStr.substr(intZeroStr.length - Math.max(integer, intText.length));
    const intPart = thousep ? aplicarSepMiles(intPartSinSep) : intPartSinSep;

    if (decimals == 0)
        return numSign + prefix + intPart;

    const frac = absX - int;
    const fracText = "" + Math.trunc(Math.round(frac * 1000 * Math.pow(10, decimals)) / 1000);
    const leftFracZeroes = zeroes.substr(0, decimals - fracText.length);
    const fracZeroStr = leftFracZeroes + fracText + zeroes;
    const fracPart = fracZeroStr.substring(0, decimals);

    return numSign + prefix + intPart + "." + fracPart;
}

export const dec2Ascii = (str: string) => {
    let hex = dec2hex(str);
    if (hex.length % 2 == 1) {
        hex = "0" + hex;
    }
    return hexToAscii(hex);
}

export function dec2hex(str) { // .toString(16) only works up to 2^53
    var dec = str.toString().split(''), sum: number[] = [], hex: string[] = [], i, s
    while (dec.length) {
        s = 1 * dec.shift()
        for (i = 0; s || i < sum.length; i++) {
            s += (sum[i] || 0) * 10
            sum[i] = s % 16
            s = (s - sum[i]) / 16
        }
    }
    while (sum.length) {
        hex.push(sum.pop()!.toString(16))
    }
    return hex.join('')
}

export function hexToDec(s: string): string {
    if (s.startsWith("0x")) {
        s = s.substr(2);
    }
    function add(x, y) {
        var c = 0, r = [];
        var x = x.split('').map(Number);
        var y = y.split('').map(Number);
        while (x.length || y.length) {
            var s = (x.pop() || 0) + (y.pop() || 0) + c;
            (r as any).unshift(s < 10 ? s : s - 10);
            c = s < 10 ? 0 : 1;
        }
        if (c) (r as any).unshift(c);
        return r.join('');
    }

    var dec = '0';
    s.split('').forEach(function (chr) {
        var n = parseInt(chr, 16);
        for (var t = 8; t; t >>= 1) {
            dec = add(dec, dec);
            if (n & t) dec = add(dec, '1');
        }
    });
    return dec;
}

export function fArray(x: any): any {
    if (typeof x != "object") return x;
    const e = orderBy(Object.keys(x).map(x => Number.parseInt(x)).filter(x => !Number.isNaN(x)));
    let ret: any[] = [];
    for (const index of e) {
        ret.push(x[index]);
    }
    return ret;
}

export function isInteger(a: string) {
    return /^\d+$/.test(a);
}

function normalizeInt(x: string) {
    if (!isInteger(x)) throw new Error("Only integers");

    return trimLeft(x, "0") || "0";
}

/** Multiple x times 1eN */
function mul1eN(x: string, n: number) {
    const decimals = x.split(".")[1]?.length ?? 0;

    if (decimals > n) throw new Error(`Too much decimals in '${x}'`);

    return trimLeft(x.replace(".", "") + ("0").repeat(n - decimals), "0") || "0";
}

export const toGWei = (x: string) => mul1eN(x, 9);
export const toWei = (x: string) => mul1eN(x, 18);
export const toTokenAmount = (x: string) => mul1eN(x, 15);
export const toMxnAmount = (x: string) => mul1eN(x, 2);

export function hexToBase64(hexstring: string) {
    if (hexstring.startsWith("0x")) {
        hexstring = hexstring.substr(2);
    }
    if (hexstring.length % 2 == 1) {
        hexstring = "0" + hexstring;
    }
    return Buffer.from(hexstring, 'hex').toString('base64')
}

export function base64ToHex(base64: string): string {
    return Buffer.from(base64, "base64").toString("hex");
}