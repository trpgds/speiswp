const ganache = require("ganache-cli");
import { gasPrice, maxGas } from "../deploy";
import { advanceBlockAtTime, Contract, getTestContracts, timestampMinutes, web3 } from "./setup";

let contracts: Record<string, Contract>;
beforeAll(async () => {
    contracts = await getTestContracts();
});

/** my account */
const getAddress = async (index: number) => (await web3.eth.getAccounts())[index];
const owner = async () => await getAddress(0);
const seller = async () => await getAddress(1);

test("timelocks", async () => {
    const ownerAddress = await owner();
    const sellerAddress = await seller();
    const SPEI = contracts.SPEI;

    {
        await expect((async () => {
            await SPEI.methods.requestTimelockChange().send({
                from: sellerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow();

        await expect((async () => {
            await SPEI.methods.changeTimelock(60).send({
                from: ownerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow();

        // owner requests a time lock (duration 3 hours)
        await SPEI.methods.requestTimelockChange().send({
            from: ownerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        await advanceBlockAtTime(await timestampMinutes() + 60 * 4);

        // timelock expired:
        await expect((async () => {
            await SPEI.methods.changeTimelock(60).send({
                from: ownerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow();

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

        // expire timelock:
        await advanceBlockAtTime(await timestampMinutes() + 60 * 4);

        await expect((async () => {
            await SPEI.methods.changeTimelock(60).send({
                from: ownerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow();

        // now we have to wait for 60 more minutes:
        await SPEI.methods.requestTimelockChange().send({
            from: ownerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        await expect((async () => {
            await SPEI.methods.changeTimelock(0).send({
                from: ownerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow();

        await advanceBlockAtTime(await timestampMinutes() + 90);

        // time lock changed :)
        await SPEI.methods.changeTimelock(0).send({
            from: ownerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        // expire timelock again:
        await advanceBlockAtTime(await timestampMinutes() + 60 * 4);

        // timelock resetted to 0
        await SPEI.methods.requestTimelockChange().send({
            from: ownerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        await expect((async () => {
            await SPEI.methods.changeTimelock(10).send({
                from: sellerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow();

        // only owner can change owner:
        await expect((async () => {
            await SPEI.methods.changeOwner(sellerAddress).send({
                from: sellerAddress,
                gas: maxGas,
                gasPrice: gasPrice,
            })
        })()).rejects.toThrow();

        // now seller is owner
        await SPEI.methods.changeOwner(sellerAddress).send({
            from: ownerAddress,
            gas: maxGas,
            gasPrice: gasPrice,
        })

        // wrong owner:
        await expect((async () => {
            await SPEI.methods.changeTimelock(10).send({
                from: ownerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow();

        // ok
        await SPEI.methods.changeTimelock(10).send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });
    }
});