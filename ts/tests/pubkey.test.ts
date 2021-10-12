const ganache = require("ganache-cli");
import { gasPrice, maxGas } from "../deploy";
import { callContract } from "./helper";
import { advanceBlockAtTime, Contract, getTestContracts, timestampMinutes, timestampSeconds, web3 } from "./setup";
import { getKey } from "./test-key";

let contracts: Record<string, Contract>;
beforeAll(async () => {
    contracts = await getTestContracts();
});

/** my account */
const getAddress = async (index: number) => (await web3.eth.getAccounts())[index];
const owner = async () => await getAddress(0);
const seller = async () => await getAddress(1);

const testAccount = "1234567890123456";
/**Gets the test token address */
const ERC20 = () => contracts.TestToken.options.address;
const ratio = (num: number, den: number) => ["" + num, "" + den];

test("buyOrder", async () => {
    const ownerAddress = await owner();
    const sellerAddress = await seller();
    const SPEI = contracts.SPEI;
    const call = callContract(SPEI);

    // add public key::
    const pubKey = getKey();
    {
        await SPEI.methods.requestTimelockChange().send({
            from: ownerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        await SPEI.methods.changeTimelock(60).send({
            from: ownerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        await expect((async () => {
            // only owner can add public keys:
            await SPEI.methods.addPublicKey(pubKey.exp, pubKey.modulus).send({
                from: sellerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow();

        // this key has a 60 minutes timelock:
        expect(await call("getPublicKeyCount")).toEqual("0");

        let now = await timestampMinutes();
        await SPEI.methods.addPublicKey(pubKey.exp, pubKey.modulus).send({
            from: ownerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect(await call("getPublicKeyCount")).toEqual("1");
        expect(await call("getPublicKey", 0)).toEqual([
            pubKey.expD,
            pubKey.modulusD,
            (now + 60).toString(),
            (Math.pow(2, 32) - 1).toString()
        ]);

        await expect((async () => {
            // public key is not valid yet
            await call("getValidPublicKey", 0)
        })()).rejects.toThrow();

        await advanceBlockAtTime(now + 70);

        expect(await call("getValidPublicKey", 0)).toEqual([
            pubKey.expD,
            pubKey.modulusD
        ]);

        // Add a second public key:
        await SPEI.methods.addPublicKey(getKey(1).exp, getKey(1).modulus).send({
            from: ownerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect(await call("getPublicKeyCount")).toEqual("2");

        // disable the first key:

        await expect((async () => {
            // only owner can disable public keys
            await SPEI.methods.disablePublicKey(0).send({
                from: sellerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow();

        await SPEI.methods.disablePublicKey(0).send({
            from: ownerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        // public key 0 is still valid until timelock
        expect(await call("getValidPublicKey", 0)).toEqual([
            pubKey.expD,
            pubKey.modulusD
        ]);

        await expect((async () => {
            // public key 1 is not valid yet
            await call("getValidPublicKey", 1)
        })()).rejects.toThrow();

        now = await timestampMinutes();

        await advanceBlockAtTime(now + 70);

        expect(await call("getValidPublicKey", 1)).toEqual([
            getKey(1).expD,
            getKey(1).modulusD
        ]);


        await expect((async () => {
            // public key 0 is not disabled
            await call("getValidPublicKey", 0)
        })()).rejects.toThrow();
    }


});