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

const testAccount = "1234567890123456";
/**Gets the test token address */
const ERC20 = () => contracts.TestToken.options.address;
const ratio = (num: number, den: number) => ["" + num, "" + den];

test("init coins", async () => {

    const ownerAddress = await owner();
    const sellerAddress = await seller();
    const SPEI = contracts.SPEITest;


    const call = callContract(SPEI);
    // init:
    {
        expect(await call("getCoinCount")).toEqual("12");

        await expect((async () => {
            await SPEI.methods.addCoin("0x6aD300AF4763D1a1c50C086e4Ce77A399aE65DBa").send({
                from: sellerAddress,
                gas: maxGas,
                gasPrice: gasPrice
            });

        })()).rejects.toThrow(/owner only/);


        expect(await call("getCoinCount")).toEqual("12");

        expect(await call("getCoin", 0)).toEqual("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c");
        expect(await call("getCoin", 1)).toEqual("0x55d398326f99059fF775485246999027B3197955");
        expect(await call("getCoin", 3)).toEqual("0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56");
        expect(await call("getCoin", 4)).toEqual("0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3");

        await SPEI.methods.addCoin("0x6aD300AF4763D1a1c50C086e4Ce77A399aE65DBa").send({
            from: ownerAddress,
            gas: maxGas,
            gasPrice: gasPrice
        });

        expect(await call("getCoinCount")).toEqual("13");

        expect(await call("getCoin", 12)).toEqual("0x6aD300AF4763D1a1c50C086e4Ce77A399aE65DBa");

    }

});