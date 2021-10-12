const ganache = require("ganache-cli");
import { asciiToHex, dateDiff, hexToDec, padRight } from "../utils";
import { gasPrice, maxGas } from "../deploy";
import { advanceBlockAtTime, Contract, getTestContracts, timestampMinutes, web3 } from "./setup";
import { callContract, SendResult } from "./helper";
import { max256, mul1eN } from "ts/units";

let contracts: Record<string, Contract>;
beforeAll(async () => {
    contracts = await getTestContracts();
});


function getContractDate(x: Date): number {
    const origin = new Date(0);
    return Math.round(dateDiff(x, origin, "days"));
}

test("date", async () => {
    const testCases = [
        new Date(2021, 0, 26),
        new Date(2021, 2, 10),
        new Date(2021, 11, 10),
        new Date(2021, 12, 31),
        new Date(2040, 11, 10),
        new Date(2200, 1, 3),
        new Date(2300, 1, 3),
        new Date(2350, 1, 3),
    ];

    for (const date of testCases) {
        const actual = await contracts.ParserTest.methods.getUnixDate(date.getFullYear(), date.getMonth() + 1, date.getDate()).call();
        const expected = getContractDate(date);

        expect(Number.parseInt(actual)).toBe(expected);
    }
});

/** my account */
const getAddress = async (index: number) => (await web3.eth.getAccounts())[index];
const owner = async () => await getAddress(0);
const seller = async () => await getAddress(1);
const buyer = async () => await getAddress(2);
const buyer2 = async () => await getAddress(3);

const testAccount = "1234567890123456";
/**Gets the test token address */
const ratio = (num: number, den: number) => ["" + num, "" + den];

test("createOrder", async () => {
    const sellerAddress = await seller();
    const buyerAddress = await buyer();
    const buyer2Address = await buyer2();
    const dest = hexToDec(padRight(asciiToHex(testAccount), 20 * 2));
    const nonce = hexToDec(asciiToHex("ABC123"));
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

    // order creation:

    {
        const result: SendResult = await SPEI.methods.createOrder(0, 0, dest, getCoinIndex(), 20, 1000, nonce, 0, 60, "0xffff").send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        const index = Number.parseInt(result.events.OrderCreated.returnValues.index);

        expect(index).toEqual(0);
        expect(await call("orderSeller", index)).toEqual(await seller());
        expect(await call("orderDefinition", index)).toEqual([
            dest,
            nonce,
            "20",
            "1000",
            "65535"
        ]);
        expect(await call("orderVariables", index)).toEqual([
            "0",
            "0",
            "0",
            false,
            "0",
            "60",
            "" + getCoinIndex()
        ]);

    }

    {
        // index increase:
        const result: SendResult = await SPEI.methods.createOrder(1, 0, dest, getCoinIndex(), 20, 1000, nonce, 0, 60, "0xffff").send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        const index = Number.parseInt(result.events.OrderCreated.returnValues.index);
        expect(index).toBe(1);
    }

    {
        // unfunded:    
        await expect((async () => {
            await SPEI.methods.createOrder(2, mul1eN("100", 15), dest, getCoinIndex(), 20, 1000, nonce, 0, 60, "0xffff").send({
                from: sellerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow(/not enough funds/);
    }

    {
        // add balance:
        await contracts.TestToken.methods.showMeTheMoney(await seller(), mul1eN("150", 18)).send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect(await callERC20("balanceOf", sellerAddress)).toEqual(mul1eN("150", 18));
    }
    {
        //funded but not approved:

        await expect((async () => {
            await SPEI.methods.createOrder(2, mul1eN("100", 15), dest, getCoinIndex(), 20, 1000, nonce, 0, 60, "0xffff").send({
                from: sellerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow(/not enough funds/);
    }

    {
        // approve:
        await contracts.TestToken.methods.approve(SPEI.options.address, max256).send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });


    }

    {
        // funded:
        const result = await SPEI.methods.createOrder(2, mul1eN("100", 15), dest, getCoinIndex(), 20, 1000, nonce, 1000, 60, "0xffff").send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect(await callERC20("balanceOf", sellerAddress)).toEqual(mul1eN("50", 18));


        const index = Number.parseInt(result.events.OrderCreated.returnValues.index);
        expect(index).toBe(2);

        expect(await call("orderVariables", index)).toEqual([
            mul1eN("100", 15),
            "0",
            "0",
            false,
            "1000",
            "60",
            "" + getCoinIndex()
        ]);
    }

    // funding:

    {
        // fund 0 or more than balance
        await expect((async () => {
            await SPEI.methods.fundOrder(2, 0).send({
                from: sellerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow(/amount is 0/);

        await expect((async () => {
            await SPEI.methods.fundOrder(2, mul1eN("60", 15)).send({
                from: sellerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow(/not enough funds/);

    }

    {
        const index = 2;
        await SPEI.methods.fundOrder(index, mul1eN("40", 15)).send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });
        expect(await callERC20("balanceOf", sellerAddress)).toEqual(mul1eN("10", 18));

        expect(await call("orderVariables", index)).toEqual([
            mul1eN("140", 15),
            "0",
            "0",
            false,
            "1000",
            "60",
            "" + getCoinIndex()
        ]);
    }

    {
        expect(await callERC20("balanceOf", SPEI.options.address)).toEqual(mul1eN("140", 18));

        // Add more ERC20 to contract:
        await contracts.TestToken.methods.showMeTheMoney(SPEI.options.address, mul1eN("1000", 18)).send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect(await callERC20("balanceOf", SPEI.options.address)).toEqual(mul1eN("1140", 18));

    }

    // defunding:

    {
        const index = 2;

        await SPEI.methods.defundOrder(index, mul1eN("40", 15)).send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect(await callERC20("balanceOf", sellerAddress)).toEqual(mul1eN("50", 18));

        expect(await call("orderVariables", index)).toEqual([
            mul1eN("100", 15),
            "0",
            "0",
            false,
            "1000",
            "60",
            "" + getCoinIndex()
        ]);

        await SPEI.methods.defundOrder(index, mul1eN("100", 15)).send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect(await callERC20("balanceOf", sellerAddress)).toEqual(mul1eN("150", 18));

        expect(await call("orderVariables", index)).toEqual([
            "0",
            "0",
            "0",
            false,
            "1000",
            "60",
            "" + getCoinIndex()
        ]);
    }

    // locking:
    {
        //Order is unfunded:

        const index = 2;
        await expect((async () => {
            await SPEI.methods.lockOrder(index, mul1eN("50", 15)).send({
                from: buyerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow(/not enough order funds/);

        await SPEI.methods.fundOrder(index, mul1eN("100", 15)).send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect(await call("orderVariables", index)).toEqual([
            mul1eN("100", 15),
            "0",
            "0",
            false,
            "1000",
            "60",
            "" + getCoinIndex()
        ]);

        // Buyer has no balance:
        await expect((async () => {
            await SPEI.methods.lockOrder(index, mul1eN("50", 15)).send({
                from: buyerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow(/not enough funds/);


        await contracts.TestToken.methods.showMeTheMoney(buyerAddress, mul1eN("8", 18)).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect(await callERC20("balanceOf", buyerAddress)).toEqual(mul1eN("8", 18));


        await contracts.TestToken.methods.approve(SPEI.options.address, max256).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        // Buyer locks 50, pays 1 / 10 (5 units)
        await SPEI.methods.lockOrder(index, mul1eN("50", 15)).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect(await callERC20("balanceOf", buyerAddress)).toEqual(mul1eN("3", 18));

        expect(await call("orderVariables", index)).toEqual([
            mul1eN("105", 15),
            mul1eN("55", 15),
            "" + ((await timestampMinutes()) + 60),
            false,
            "1000",
            "60",
            "" + getCoinIndex()
        ]);

        expect((await call("buyerLock", buyerAddress, index))[0]).toEqual(mul1eN("55", 15));

    }

    // defund more than free
    {
        await expect((async () => {
            const index = 2;
            await SPEI.methods.defundOrder(index, mul1eN("100", 15)).send({
                from: sellerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow();
    }

    // defund all free|
    {
        const index = 2;
        await SPEI.methods.defundOrder(index, mul1eN("40", 15)).send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect((await call("orderVariables", index)).slice(0, 2)).toEqual([mul1eN("65", 15), mul1eN("55", 15)]);

        await SPEI.methods.defundOrder(index, mul1eN("10", 15)).send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect((await call("orderVariables", index)).slice(0, 2)).toEqual([mul1eN("55", 15), mul1eN("55", 15)]);


        // funds == locked
        await expect((async () => {
            const index = 2;
            await SPEI.methods.defundOrder(index, mul1eN("1", 15)).send({
                from: sellerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow();

        const expireTime = Number.parseInt((await call("orderVariables", index))[2]);

        // Balance in contract:
        expect(await callERC20("balanceOf", SPEI.options.address)).toEqual(mul1eN("1055", 18));

        // Order still locked
        expect(await timestampMinutes()).toBeLessThan(expireTime);

        //wait until lock finishes
        await advanceBlockAtTime(expireTime + 70);

        // Order unlocked
        expect(await timestampMinutes()).toBeGreaterThan(expireTime);

        await SPEI.methods.defundOrder(index, mul1eN("55", 15)).send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect((await call("orderVariables", index)).slice(0, 2)).toEqual(["0", "0"]);
    }

    // fund again:
    {
        const index = 2;
        await SPEI.methods.fundOrder(index, mul1eN("100", 15)).send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect((await call("orderVariables", index)).slice(0, 2)).toEqual([mul1eN("100", 15), "0"]);
    }

    // two buyers lock:
    {
        await contracts.TestToken.methods.showMeTheMoney(buyerAddress, mul1eN("1", 18)).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });
        expect(await callERC20("balanceOf", buyerAddress)).toEqual(mul1eN("4", 18));


        await contracts.TestToken.methods.showMeTheMoney(buyer2Address, mul1eN("6", 18)).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });
        expect(await callERC20("balanceOf", buyer2Address)).toEqual(mul1eN("6", 18));

        await contracts.TestToken.methods.approve(SPEI.options.address, max256).send({
            from: buyer2Address,
            gas: maxGas,
            gasPrice: gasPrice
        });


        const index = 2;
        await SPEI.methods.lockOrder(index, mul1eN("40", 15)).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });
        expect((await call("orderVariables", index)).slice(0, 2)).toEqual([mul1eN("104", 15), mul1eN("44", 15)]);
        expect((await call("buyerLock", buyerAddress, index))[0]).toEqual(mul1eN("44", 15));

        await SPEI.methods.lockOrder(index, mul1eN("30", 15)).send({
            from: buyer2Address,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect((await call("orderVariables", index)).slice(0, 2)).toEqual([mul1eN("107", 15), mul1eN("77", 15)]);

        expect((await call("buyerLock", buyer2Address, index))[0]).toEqual(mul1eN("33", 15));

        await SPEI.methods.lockOrder(index, mul1eN("30", 15)).send({
            from: buyer2Address,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect((await call("orderVariables", index)).slice(0, 2)).toEqual([mul1eN("110", 15), mul1eN("110", 15)]);

        expect((await call("buyerLock", buyerAddress, index))[0]).toEqual(mul1eN("44", 15));
        expect((await call("buyerLock", buyer2Address, index))[0]).toEqual(mul1eN("66", 15));
    }

});