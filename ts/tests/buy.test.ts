const ganache = require("ganache-cli");
import { asciiToHex, padRight } from "../utils";
import { gasPrice, maxGas } from "../deploy";
import { Contract, getTestContracts, web3 } from "./setup";
import { callContract, SendResult } from "./helper";
import { max256, z15, z18 } from "ts/units";

let contracts: Record<string, Contract>;
beforeAll(async () => {
    contracts = await getTestContracts();
});

export interface ContractEvent {
    returnValues: any;
}

/** my account */
const getAddress = async (index: number) => (await web3.eth.getAccounts())[index];
const owner = async () => await getAddress(0);
const seller = async () => await getAddress(1);
const buyer = async () => await getAddress(2);
const buyer2 = async () => await getAddress(3);

const testAccount = "1234567890123456";
/**Gets the test token address */
const ratio = (num: number, den: number) => ["" + num, "" + den];

test("buyOrder", async () => {
    const sellerAddress = await seller();
    const buyerAddress = await buyer();
    const dest = "0x" + padRight(asciiToHex(testAccount), 20 * 2);
    const nonce = "0x" + asciiToHex("ABC123");
    const SPEI = contracts.SPEITest;
    const call = callContract(SPEI);
    const callERC20 = callContract(contracts.TestToken);

    let testTokenIndex: number;
    const getCoinIndex = () => testTokenIndex

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
        // add balance:
        await contracts.TestToken.methods.showMeTheMoney(await seller(), "150" + z18).send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect(await callERC20("balanceOf", sellerAddress)).toEqual("150" + z18);

        // approve:
        await contracts.TestToken.methods.approve(SPEI.options.address, max256).send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        const result: SendResult = await SPEI.methods.createOrder("100" + z15, dest, getCoinIndex(), 20, 1000, nonce, 1000, 60, "0xffff").send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });


        expect(await callERC20("balanceOf", sellerAddress)).toEqual("50" + z18);

        const index = Number.parseInt(result.events.OrderCreated.returnValues.index);

        expect(index).toEqual(0);
    }

    {
        // Buy without lock:
        await expect((async () => {
            await SPEI.methods.executeBuyTest(0, 1500 * 100).send({
                from: buyerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });
        })()).rejects.toThrow();

        // lock:
        await contracts.TestToken.methods.showMeTheMoney(await buyerAddress, "10" + z18).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        await contracts.TestToken.methods.approve(SPEI.options.address, max256).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        await SPEI.methods.lockOrder(0, "50" + z15).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect(await callERC20("balanceOf", SPEI.options.address)).toEqual("105" + z18);
        expect(await callERC20("balanceOf", buyerAddress)).toEqual("5" + z18);

        expect((await call("orderVariables", 0)).slice(0, 2)).toEqual([
            "105" + z15,
            "55" + z15,
        ]);

        // buy, lock == 50, equals to 1000 MXN
        await SPEI.methods.executeBuyTest(0, 1500 * 100).send({
            from: buyerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect(await callERC20("balanceOf", SPEI.options.address)).toEqual("50" + z18);
        expect(await callERC20("balanceOf", buyerAddress)).toEqual("60" + z18);

        expect((await call("orderVariables", 0)).slice(0, 2)).toEqual([
            "50" + z15,
            "0",
        ]);

    }
});