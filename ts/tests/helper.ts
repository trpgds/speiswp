import { fArray, formatNumber } from "../utils";
import { Contract, getTestContracts, web3 } from "./setup";

export interface ContractEvent {
    returnValues: any;
}
export interface SendResult {
    gasUsed: number;
    transactionHash: string;
    status: boolean;
    events: Record<string, ContractEvent>;
}
export const callContract = (contract: Contract) => async (method: string, ...args: any[]) => fArray(await JSON.parse(JSON.stringify(await contract.methods[method](...args).call())));

export interface CepParams {
    date: Date;
    origAccount: string;
    origRFC: string;
    destAccount: string;
    destRFC: string;
    nonce: string;
    amount: number;
}

export function createCep({ date, origAccount, destAccount, nonce, amount, origRFC, destRFC }: CepParams) {
    const dateStr = "" + formatNumber(date.getDate(), 2) + formatNumber(date.getMonth() + 1, 2) + date.getFullYear();
    const amountStr = formatNumber(amount, 1, 2, false);
    const rand = Array.from(Array(20), () => Math.floor(Math.random() * 10).toString(10)).join('').toUpperCase();
    return `||1|${dateStr}|${dateStr}|123456|40002|BANORTE|CRYPTO CRYPTO CRYPTO|40|${origAccount}|${origRFC}|BANAMEX|JUAN,JUAN/JUAN|3|${destAccount}|${destRFC}|${nonce}|0.00|${amountStr}|NA|NA|0|0|NA|0|0.00|${rand}||`;
}