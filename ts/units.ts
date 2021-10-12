export const gwei = 10e8;
export const wei = gwei * gwei;

export const z18 = "000000000000000000";
export const z15 = "000000000000000";
export const max256 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

/** Multiple x times 1eN */
export function mul1eN(x: string, n: number) {
    const decimals = x.split(".")[1]?.length ?? 0;
    return x.replace(".", "") + ("0").repeat(n - decimals);
}