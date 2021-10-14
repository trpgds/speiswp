
import Web3 from "web3";
import { question } from "./utils";

// BNB testnet
// https://docs.binance.org/smart-chain/developer/BEP20.html
const web3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545');

//const web3 = new Web3('https://bsc-dataseed.binance.org/');

import util from "util";
import { getContracts } from "./tests/set";
import fs from "fs";

(async () => {
    const privateKey = await question("private key?", fs.readFileSync("privatekey.user").toString());

    const account = web3.eth.accounts.wallet.add(privateKey);
    const myAddress = account.address;
    console.log("my address", myAddress);


    const filter = /^((?!Test).)+$/;
    const contracts = await getContracts(web3, myAddress, undefined, filter);
    for (const name in contracts) {
        console.log(`name: ${name}, address: ${contracts[name].options.address}`);
    }
})().catch(reason => {
    console.log("deploy task failed", reason);
});

