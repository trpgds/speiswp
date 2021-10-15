
import Web3 from "web3";

// BNB testnet
// https://docs.binance.org/smart-chain/developer/BEP20.html
//const web3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545');

const web3 = new Web3('https://bsc-dataseed.binance.org/');


import readline from 'readline';
import { maxGas } from "./deploy";
import { gwei } from "./units";
import fs from "fs";
import { base64ToHex, hexToBase64, question, splitHex } from "./utils";


const speiAbi: any =
    [{ "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint80", "name": "amount", "type": "uint80" }], "name": "BuyExecuted", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "seller", "type": "address" }], "name": "OrderCreated", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" }, { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" }], "name": "OrderLocked", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "coin", "type": "address" }], "name": "addCoin", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "exp", "type": "uint256" }, { "internalType": "uint256[8]", "name": "modulus", "type": "uint256[8]" }], "name": "addPublicKey", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "orderIndex", "type": "uint256" }, { "internalType": "uint16", "name": "publicKeyIndex", "type": "uint16" }, { "internalType": "uint256[8]", "name": "sig", "type": "uint256[8]" }, { "internalType": "string", "name": "message", "type": "string" }], "name": "buy", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "buyer", "type": "address" }, { "internalType": "uint256", "name": "order", "type": "uint256" }], "name": "buyerLock", "outputs": [{ "components": [{ "internalType": "uint80", "name": "amount", "type": "uint80" }, { "internalType": "uint32", "name": "expire", "type": "uint32" }], "internalType": "struct Types.BuyerLock", "name": "", "type": "tuple" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint8", "name": "newFee", "type": "uint8" }], "name": "changeFee", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "next", "type": "address" }], "name": "changeOwner", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint16", "name": "newTimelock", "type": "uint16" }], "name": "changeTimelock", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "coin", "type": "address" }], "name": "collectFees", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }, { "internalType": "uint80", "name": "funds", "type": "uint80" }, { "internalType": "uint160", "name": "dest", "type": "uint160" }, { "internalType": "uint16", "name": "coinIndex", "type": "uint16" }, { "internalType": "uint16", "name": "priceMXNNum", "type": "uint16" }, { "internalType": "uint16", "name": "priceMXNDen", "type": "uint16" }, { "internalType": "uint48", "name": "nonce", "type": "uint48" }, { "internalType": "uint16", "name": "lockRatio10000", "type": "uint16" }, { "internalType": "uint16", "name": "lockTime", "type": "uint16" }, { "internalType": "uint16", "name": "maxPubKeyIndex", "type": "uint16" }], "name": "createOrder", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "orderIndex", "type": "uint256" }, { "internalType": "uint80", "name": "amount", "type": "uint80" }], "name": "defundOrder", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "orderIndex", "type": "uint256" }], "name": "disableOrder", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint16", "name": "index", "type": "uint16" }], "name": "disablePublicKey", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "orderIndex", "type": "uint256" }], "name": "enableOrder", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "fixTimelock", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "fixedTimeLock", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "orderIndex", "type": "uint256" }, { "internalType": "uint80", "name": "amount", "type": "uint80" }], "name": "fundOrder", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint16", "name": "index", "type": "uint16" }], "name": "getCoin", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getCoinCount", "outputs": [{ "internalType": "uint16", "name": "", "type": "uint16" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "coin", "type": "address" }], "name": "getOwnerFees", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint16", "name": "index", "type": "uint16" }], "name": "getPublicKey", "outputs": [{ "components": [{ "internalType": "uint256", "name": "exp", "type": "uint256" }, { "internalType": "uint256[8]", "name": "modulus", "type": "uint256[8]" }, { "internalType": "uint32", "name": "enableTime", "type": "uint32" }, { "internalType": "uint32", "name": "disableTime", "type": "uint32" }], "internalType": "struct Types.PublicKey", "name": "", "type": "tuple" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getPublicKeyCount", "outputs": [{ "internalType": "uint16", "name": "", "type": "uint16" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint16", "name": "index", "type": "uint16" }], "name": "getValidPublicKey", "outputs": [{ "internalType": "uint256", "name": "exp", "type": "uint256" }, { "internalType": "uint256[8]", "name": "modulus", "type": "uint256[8]" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "orderIndex", "type": "uint256" }, { "internalType": "uint80", "name": "amount", "type": "uint80" }], "name": "lockOrder", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }], "name": "orderDefinition", "outputs": [{ "components": [{ "internalType": "uint160", "name": "dest", "type": "uint160" }, { "internalType": "uint48", "name": "nonce", "type": "uint48" }, { "internalType": "uint16", "name": "priceMXN1000Num", "type": "uint16" }, { "internalType": "uint16", "name": "priceMXN1000Den", "type": "uint16" }, { "internalType": "uint16", "name": "maxPubKeyIndex", "type": "uint16" }], "internalType": "struct Types.Order", "name": "", "type": "tuple" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }], "name": "orderSeller", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }], "name": "orderVariables", "outputs": [{ "components": [{ "internalType": "uint80", "name": "funds", "type": "uint80" }, { "internalType": "uint80", "name": "locked", "type": "uint80" }, { "internalType": "uint32", "name": "expire", "type": "uint32" }, { "internalType": "bool", "name": "disabled", "type": "bool" }, { "internalType": "uint16", "name": "lockRatio10000", "type": "uint16" }, { "internalType": "uint16", "name": "lockTime", "type": "uint16" }, { "internalType": "uint16", "name": "coinIndex", "type": "uint16" }], "internalType": "struct Types.OrderVariables", "name": "", "type": "tuple" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "ownerFeeRatio", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "ownerFees", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "requestTimelockChange", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "timeLock", "outputs": [{ "internalType": "uint16", "name": "", "type": "uint16" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "timeLockChangeEnabledAt", "outputs": [{ "internalType": "uint32", "name": "", "type": "uint32" }], "stateMutability": "view", "type": "function" }];
function createContract(web3: Web3, address: string, abi: any) {
    return new web3.eth.Contract(abi as any, address);
}

export const gasPrice = "" + (10 * gwei);

(async () => {
    const privateKey = await question("private key?", fs.readFileSync("privatekey.user").toString());
    const contract = await question("contract?", "0x187C57ECAF44ea4112eA88Df774584bA084391d4");
    const account = web3.eth.accounts.wallet.add(privateKey);
    const myAddress = account.address;
    console.log("my address", myAddress);

    const SPEI = createContract(web3, contract, speiAbi);

    const options = ["addcoin", "coincount", "addpk", "fee", "reqTime", "time"] as const;

    while (true) {
        const option: typeof options[number] = await question("option? " + options.join(", ")) as any;

        if (options.indexOf(option) == -1) {
            console.log("wrong option");
            break;
        }

        switch (option) {
            case "addcoin": {
                const coin = await question("coin?");
                const receipt = await SPEI.methods.addCoin(coin).send({
                    from: myAddress,
                    gas: maxGas,
                    gasPrice: gasPrice,
                });

                console.log(receipt);
                break;
            }
            case "coincount": {
                console.log(await SPEI.methods.getCoinCount().call())
                break;
            }
            case "addpk": {
                const exp = base64ToHex(await question("exp (b64)?"));
                const mod = base64ToHex(await question("mod (b64)?"));

                /** key public exponent */
                const expFormatted = "0x" + web3.utils.leftPad(exp, 64);
                /** key public modulus */
                const modulusFormatted = splitHex(mod);

                const receipt = await SPEI.methods.addPublicKey(expFormatted, modulusFormatted).send({
                    from: myAddress,
                    gas: 300000,
                    gasPrice: gasPrice,
                });

                console.log(receipt);
                break;
            }
            case "fee": {
                const fee = Number.parseFloat(await question("fee (percentage 0-100)?"));
                const feeVal = Math.round(fee * 10);

                const receipt = await SPEI.methods.changeFee(feeVal).send({
                    from: myAddress,
                    gas: 300000,
                    gasPrice: gasPrice,
                });

                console.log(receipt);
                break;
            }
            case "reqTime": {
                const receipt = await SPEI.methods.requestTimelockChange().send({
                    from: myAddress,
                    gas: 300000,
                    gasPrice: gasPrice,
                });

                console.log(receipt);
                break;
            }
            case "time": {
                const timelock = Number.parseFloat(await question("timelock (minutes)?"));
                const receipt = await SPEI.methods.changeTimelock(timelock).send({
                    from: myAddress,
                    gas: 300000,
                    gasPrice: gasPrice,
                });

                console.log(receipt);
                break;
            }

        }
    }
})().catch(reason => {
    console.log(reason);
});

