import * as fs from "fs";
import { default as Web3 } from "web3"
import { gwei } from "./units";


export const maxGas = 5e6;
export const gasPrice = "" + (10 * gwei);
export async function deploy(web3: Web3, myAddress: string, abi: any, objectCode: string): Promise<string> {
    let contract = new web3.eth.Contract(abi);

    contract.options.data = objectCode;

    const contractAddress = await contract.deploy({
        arguments: []
    } as any).send({
        from: myAddress,
        gas: maxGas,
        gasPrice: gasPrice,
    })
        .then(instance => instance.options.address)
        .catch(err => console.error("deploy error", err))
        ;

    return contractAddress!;
}
