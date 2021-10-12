const ganache = require("ganache-cli");
import Web3 from "web3";
import { execSync } from "child_process";
import * as fs from "fs";
import { deploy } from "../deploy";
import { exclude, orderBy, unique } from "../utils";
import { Contract, getContracts } from "./set";
export type { Contract };

export const provider = ganache.provider()
export const web3 = new Web3(provider);

export async function getTestContracts(filter?: RegExp, nameFilter?: RegExp): Promise<Record<string, Contract>> {

    const myAddress = (await web3.eth.getAccounts())[0]
    return getContracts(web3, myAddress, filter, nameFilter);
}
export const timestampSeconds = async () => Number.parseInt("" + await (await web3.eth.getBlock("latest")).timestamp);
export const timestampMinutes = async () => Math.floor(await timestampSeconds() / 60);


export const advanceBlockAtTime = (minutes: number) => {
    return new Promise((resolve, reject) => {
        (web3.currentProvider as any).send(
            {
                jsonrpc: "2.0",
                method: "evm_mine",
                params: [minutes * 60],
                id: new Date().getTime(),
            },
            async (err, _) => {
                if (err) {
                    return reject(err);
                }
                const newBlockHash = (await web3.eth.getBlock("latest")).hash;

                return resolve(newBlockHash);
            },
        );
    });
};