import Web3 from "web3";
import { execSync } from "child_process";
import * as fs from "fs";
import { deploy } from "../deploy";
import { orderBy } from "../utils";
import { keyBy, mapValues } from "lodash";
export type Contract = ReturnType<typeof createContract>;
export let getContractsResult: Record<string, Contract> | undefined;

export function createContract(web3: Web3, address: string, abi: any) {
    return new web3.eth.Contract(abi as any, address);
}

function areWeTestingWithJest() {
    return process.env.JEST_WORKER_ID !== undefined;
}

const getCompilerInput = (sources: any, libraries: any, src: string = "*", contractName: string = "*") => {
    return ({
        language: "Solidity",
        sources: sources,
        settings:
        {

            "optimizer": {
                "enabled": true,
                "runs": 200,
            },
            evmVersion: "byzantium",
            libraries: libraries,
            outputSelection: {
                [src]: {
                    [contractName]: [
                        "evm.bytecode.object",
                        "evm.bytecode.linkReferences",
                        "abi"
                    ],
                }
            },
        }
    });
};

export async function getContracts(web3: Web3, myAddress: string, filter?: RegExp, nameFilter?: RegExp): Promise<Record<string, Contract>> {
    if (getContractsResult != null) {
        console.log("contracts already deployed :)");
        return getContractsResult;
    }

    const srcNames =
        orderBy(fs.readdirSync("./src").map(x => x), x => x)
            .filter(x => filter == null || filter.test(x))
        ;

    execSync("rm -rf bin");
    execSync("mkdir bin");

    execSync("rm -rf tmp");
    execSync("mkdir tmp");

    let ret: Record<string, Contract> = {};

    const getBalance = async () => Number.parseFloat(Web3.utils.fromWei(await web3.eth.getBalance(myAddress)));
    const initialBalance = await getBalance();

    let libraries: any = {};

    const compile = (src: string) => {
        const sources = {
            [src]:
            {
                urls: [
                    "./" + src
                ]
            }
        };

        const input = JSON.stringify(getCompilerInput(sources, libraries));

        const outputJson = execSync(`solc --allow-paths . --base-path ./src --standard-json`, {
            input: input
        }).toString();


        return JSON.parse(outputJson);
    }



    const needsLinking = (contract: any) => Object.keys(contract.evm.bytecode.linkReferences).length > 0;
    const hasError = (contract: any) => contract.errors != null;
    let libSolC = "";
    for (const src of srcNames) {
        while (true) {
            let compilerOutput = compile(src);
            if (compilerOutput.errors != null) {
                console.error(compilerOutput.errors);
                throw new Error("Compiler error");
            }

            let loop = false;
            for (const contractName in compilerOutput.contracts[src]) {

                if (ret[contractName] != null) continue; // already deployed
                if (nameFilter != null && !nameFilter.test(contractName)) {
                    continue;
                }

                let contract = compilerOutput.contracts[src][contractName];

                const object: string = contract.evm.bytecode.object;
                if (hasError(contract)) {
                    throw new Error(contract.errors);
                }

                if (object == "") {
                    // empty contract
                    continue;
                }

                if (needsLinking(contract)) {
                    loop = true;
                    continue;
                }

                const contractSize = object.length / 2;
                if (contractSize >= 0x6000) {
                    const msg = `Contract ${src}/${contractName} size > 24K (${contractSize})`;
                    console.error(msg);
                    throw new Error(msg);
                }

                if (!areWeTestingWithJest()) {
                    console.log("deploying " + contractName)
                }
                const address = await deploy(web3, myAddress, contract.abi, object);

                if (!areWeTestingWithJest()) {
                    console.log(contractName, address);
                }
                libraries[src] = libraries[src] ?? {};
                libraries[src][contractName] = address;
                libSolC += `src/${src}:${contractName}=${address} `;

                const contractInstance = await createContract(web3, address, contract.abi);
                ret[contractName] = contractInstance;
            }
            if (!loop) break;
        }
    }
    const finalBalance = await getBalance();
    const cost = finalBalance - initialBalance;
    //if (!areWeTestingWithJest()) {
    console.log("Deployment cost (ETH)", cost);
    //}

    getContractsResult = ret;
    return ret;
};
