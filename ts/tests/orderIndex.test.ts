const ganache = require("ganache-cli");
import { asciiToHex, dateDiff, padRight } from "../utils";
import { gasPrice, maxGas } from "../deploy";
import { advanceBlockAtTime, Contract, getTestContracts, timestampMinutes, web3 } from "./setup";
import { callContract, SendResult } from "./helper";
import { max256, mul1eN } from "ts/units";

let contracts: Record<string, Contract>;
beforeAll(async () => {
    contracts = await getTestContracts();
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
    const dest = "0x" + padRight(asciiToHex(testAccount), 20 * 2);
    const nonce = "0x" + asciiToHex("ABC123");
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


    {
        const result: SendResult = await SPEI.methods.createOrder(0, dest, getCoinIndex(), 20, 1000, nonce, 0, 60, "0xffff").send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });


        const index = Number.parseInt(result.events.OrderCreated.returnValues.index);
        expect(index).toBe(0);
    }

    {
        // index increase:
        const result: SendResult = await SPEI.methods.createOrder(0, dest, getCoinIndex(), 20, 1000, nonce, 0, 60, "0xffff").send({
            from: sellerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });


        const index = Number.parseInt(result.events.OrderCreated.returnValues.index);
        expect(index).toBe(1);
    }

});