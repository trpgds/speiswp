const ganache = require("ganache-cli");
import { padLeft, range, trimLeft } from "../utils";
import { Contract, getTestContracts } from "./setup";

import { getKey, sign, verifySignature } from "./test-key";

let contracts: Record<string, Contract>;
beforeAll(async () => {
    contracts = await getTestContracts(/rsa/);
});

/**Splits a large hex in 256 bits chunks */
function splitHex(hex: string): string[] {
    hex = trimLeft(hex, "0");

    const desiredLen = Math.ceil(hex.length / 64) * 64;
    hex = padLeft(hex, desiredLen, "0");

    return range(0, hex.length / 64).map(x => "0x" + hex.substr(x * 64, 64))
}

test("rsa", async () => {

    const message = "hello there"
    const signature = splitHex(sign(message));
    const { exp, modulus } = getKey();

    const hash = "0x12998c017066eb0d2a70b94e6ed3192985855ce390f321bbdb832022888bd251";
    const padded = "1ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff003031300d06096086480165030402010500042012998c017066eb0d2a70b94e6ed3192985855ce390f321bbdb832022888bd251";
    expect(modulus.length).toEqual(8);

    expect(verifySignature(message, sign(message))).toBeTruthy();

    expect(await contracts.RSATest.methods.hash(message).call()).toEqual(hash);
    expect(trimLeft((await contracts.RSATest.methods.pad(message).call()).map(x => x.substr(2)).join(""), "0")).toEqual(padded);
    expect(await contracts.RSATest.methods.verifySig2048SHA256(message, signature, exp, modulus).call()).toBeTruthy();

    expect(await contracts.RSATest.methods.verifySig2048SHA256("bad message", signature, exp, modulus).call()).toBeFalsy();
    signature.reverse();
    expect(await contracts.RSATest.methods.verifySig2048SHA256(message, signature, exp, modulus).call()).toBeFalsy();

    signature.reverse();
    modulus.reverse();
    expect(await contracts.RSATest.methods.verifySig2048SHA256(message, signature, exp, modulus).call()).toBeFalsy();

});


