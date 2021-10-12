const ganache = require("ganache-cli");
import { max256, mul1eN, z15, z18 } from "ts/units";
import { gasPrice, maxGas } from "../deploy";
import { asciiToHex, hexToAscii, padLeft, padRight, splitHex } from "../utils";
import { callContract, createCep } from "./helper";
import { advanceBlockAtTime, Contract, getTestContracts, timestampMinutes, timestampSeconds, web3 } from "./setup";
import { getKey, sign } from "./test-key";

let contracts: Record<string, Contract>;
beforeAll(async () => {
    contracts = await getTestContracts(undefined, /^(.(?!Test$))+$/);
});

/** my account */
const getAddress = async (index: number) => (await web3.eth.getAccounts())[index];
const owner = async () => await getAddress(0);
const seller = async () => await getAddress(1);
const buyer = async () => await getAddress(2);

const testAccount = "1234567890123456";
/**Gets the test token address */
const ratio = (num: number, den: number) => ["" + num, "" + den];

test("buyOrder", async () => {
    const ownerAddress = await owner();
    const sellerAddress = await seller();
    const buyerAddress = await buyer();
    const SPEI = contracts.SPEI;
    const call = callContract(SPEI);
    const callERC20 = callContract(contracts.TestToken);

    let testTokenIndex: number;
    const getCoinIndex = () => testTokenIndex;

    // init:
    {
        await SPEI.methods.addCoin(contracts.TestToken.options.address).send({
            from: await owner(),
            gas: maxGas,
            gasPrice: gasPrice
        });

        testTokenIndex = Number.parseInt(await call("getCoinCount")) - 1;
    }

    const pubKey = getKey();

    {
        // pre approve buyer and seller:
        await contracts.TestToken.methods.approve(SPEI.options.address, max256).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        await contracts.TestToken.methods.approve(SPEI.options.address, max256).send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });
    }
    {
        // add public key::
        await SPEI.methods.requestTimelockChange().send({
            from: ownerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        await SPEI.methods.addPublicKey(pubKey.exp, pubKey.modulus).send({
            from: ownerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        // set 15% fee:
        await SPEI.methods.changeFee(150).send({
            from: ownerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });
    }


    const encode = (x: string, byteLen: number = 0) => "0x" + padLeft(asciiToHex(x), byteLen * 2);
    const encodeDest = (x: string) => encode(x, 20);
    const encodeSig = (x: string) => splitHex(x);

    const destAccount = "1402135017723850";
    const speiNonce = "TEST12";
    {
        // create an sell order:
        await contracts.TestToken.methods.showMeTheMoney(await seller(), "100" + z18).send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        await SPEI.methods.createOrder(0, "100" + z15, encodeDest(destAccount), getCoinIndex(), 20, 1000, encode(speiNonce), 1000, 60, 0).send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });
        expect(await callERC20("balanceOf", sellerAddress)).toEqual("0");

    }

    const validCep = createCep({
        amount: 1500,
        date: new Date(),
        destAccount: destAccount,
        destRFC: "123456",
        nonce: speiNonce,
        origAccount: "123456789012",
        origRFC: "20482820"
    });

    const validSignature = sign(validCep, 0);

    // validate signature:

    await expect((async () => {

        // Should revert because of no buyer lock;
        await SPEI.methods.buy(0, 0, encodeSig(validSignature), validCep).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });
    })()).rejects.toThrow();

    {
        // buyer locks half the order:
        await contracts.TestToken.methods.showMeTheMoney(buyerAddress, "5" + z18).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        await SPEI.methods.lockOrder(0, "50" + z15).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect(await callERC20("balanceOf", buyerAddress)).toEqual("0");
        expect(await callERC20("balanceOf", SPEI.options.address)).toEqual("105" + z18);
    }
    await expect((async () => {
        // too old
        const date = new Date();
        date.setDate(date.getDate() - 8);

        const cep = createCep({
            amount: 1500,
            date: date,
            destAccount: destAccount,
            destRFC: "123456",
            nonce: speiNonce,
            origAccount: "123456789012",
            origRFC: "20482820"
        });

        const signature = sign(cep, 0);

        await SPEI.methods.buy(0, 0, encodeSig(signature), cep).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });
    })()).rejects.toThrow();

    await expect((async () => {
        const alteredCep = createCep({
            amount: 2000,
            date: new Date(),
            destAccount: destAccount,
            destRFC: "123456",
            nonce: speiNonce,
            origAccount: "123456789012",
            origRFC: "20482820"
        });


        // invalid signature:
        await SPEI.methods.buy(0, 0, encodeSig(validSignature), alteredCep).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });
    })()).rejects.toThrow();

    await expect((async () => {
        // Incorrect nonce or dest
        const cep = createCep({
            amount: 1500,
            date: new Date(),
            destAccount: destAccount,
            destRFC: "123456",
            nonce: "ABC321",
            origAccount: "123456789012",
            origRFC: "20482820"
        });

        const signature = sign(cep, 0);

        await SPEI.methods.buy(0, 0, encodeSig(signature), cep).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });
    })()).rejects.toThrow();


    await expect((async () => {
        await SPEI.methods.buy(0, 1, encodeSig(validSignature), validCep).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });
    })()).rejects.toThrow();

    expect((await call("orderVariables", 0)).slice(0, 2)).toEqual([
        "105" + z15,
        "55" + z15,
    ]);

    expect(await callERC20("balanceOf", buyerAddress)).toEqual("0");

    await SPEI.methods.buy(0, 0, encodeSig(validSignature), validCep).send({
        from: buyerAddress,
        gas: maxGas,
        gasPrice: gasPrice
    });

    expect((await call("orderVariables", 0)).slice(0, 2)).toEqual([
        "50" + z15,
        "0",
    ]);

    expect(await callERC20("balanceOf", buyerAddress)).toEqual(mul1eN("46.75", 18));
    expect(await callERC20("balanceOf", SPEI.options.address)).toEqual(mul1eN("58.25", 18));
    expect(await call("getOwnerFees", contracts.TestToken.options.address)).toEqual(mul1eN("8.25", 15));


    {
        // buyer locks half the order:
        await contracts.TestToken.methods.showMeTheMoney(buyerAddress, 5 + z18).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        await SPEI.methods.lockOrder(0, "50" + z15).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        await expect((async () => {
            // try to send the same CEP twice
            await SPEI.methods.buy(0, 0, encodeSig(validSignature), validCep).send({
                from: buyerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow(/already spent/);

        // disable public key after buyer lock, buyer should be still able to validate receipt
        await SPEI.methods.disablePublicKey(0).send({
            from: ownerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        })

        expect(await SPEI.methods.timeLock().call()).toEqual("0");

        {
            /*
            curr balance = 46.75
            price = 20
            amount = 100 MXN
            tokens = 5 
     
            lock = 10%
            fee = 15%
            total = (5 + 10%) - 15% =  (5 * 1.1) * (1 - 0.15) = 4.675
            total = 4.675
            next balance = 46.75 + 4.675 = 51.425

            */
            const validCep2 = createCep({
                amount: 100,
                date: new Date(),
                destAccount: destAccount,
                destRFC: "123456",
                nonce: speiNonce,
                origAccount: "123456789012",
                origRFC: "20482820"
            });

            const validSignature2 = sign(validCep2, 0);
            expect(await callERC20("balanceOf", buyerAddress)).toEqual(mul1eN("46.75", 18));

            await SPEI.methods.buy(0, 0, encodeSig(validSignature2), validCep2).send({
                from: buyerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });

            expect(await callERC20("balanceOf", buyerAddress)).toEqual(mul1eN("51.425", 18));


        }
        // increase time, still in lock:
        {
            await advanceBlockAtTime((await timestampMinutes()) + 20);

            const validCep2 = createCep({
                amount: 100,
                date: new Date(),
                destAccount: destAccount,
                destRFC: "123456",
                nonce: speiNonce,
                origAccount: "123456789012",
                origRFC: "20482820"
            });

            const validSignature2 = sign(validCep2, 0);

            // still passes:
            await SPEI.methods.buy(0, 0, encodeSig(validSignature2), validCep2).send({
                from: buyerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });

            expect(await callERC20("balanceOf", buyerAddress)).toEqual(mul1eN("56.1", 18));

            expect((await call("orderVariables", 0)).slice(0, 2)).toEqual([
                mul1eN("44", 15),
                mul1eN("44", 15),
            ]);
        }

        // invalidate lock:
        await advanceBlockAtTime((await timestampMinutes()) + 60);
        {
            // lock again:
            await SPEI.methods.lockOrder(0, "20" + z15).send({
                from: buyerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });

            //public key is not invalid:
            const validCep2 = createCep({
                amount: 100,
                date: new Date(),
                destAccount: destAccount,
                destRFC: "123456",
                nonce: speiNonce,
                origAccount: "123456789012",
                origRFC: "20482820"
            });

            const validSignature2 = sign(validCep2, 0);

            await expect((async () => {
                await SPEI.methods.buy(0, 0, encodeSig(validSignature2), validCep2).send({
                    from: buyerAddress,
                    gas: maxGas,
                    gasPrice: gasPrice
                });
            })()).rejects.toThrow(/public key disabled/);

        }
    }



});