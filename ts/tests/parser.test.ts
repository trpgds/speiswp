const ganache = require("ganache-cli");
import { after } from "lodash";
import { dateDiff, dec2Ascii, dec2hex, formatNumber, hexToAscii } from "../utils";
import { CepParams, createCep } from "./helper";
import { Contract, getTestContracts, provider } from "./setup";

let contracts: Record<string, Contract>;
beforeAll(async () => {
    contracts = await getTestContracts(/parser/);
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

test("cep", async () => {
    const testCases: CepParams[] = [
        {
            date: new Date(2021, 9 - 1, 15),
            origAccount: "072580004482043958",
            destAccount: "1402135017723850",
            nonce: "TEST12",
            amount: 1234.56,
            origRFC: "RCCT033354AB0",
            destRFC: "ABCG395813AAA",
            long: true,
        },
        {
            date: new Date(2023, 1 - 1, 1),
            origAccount: "072580004482043958",
            destAccount: "1402135017723850",
            nonce: "TEST12",
            amount: 0.01,
            origRFC: "RCCT033354AB0",
            destRFC: "ABCG395813AAA",
            long: false,
        },
        {
            date: new Date(2021, 12 - 1, 31),
            origAccount: "072580004482",
            destAccount: "140213501772385032",
            nonce: "Abc2zd",
            amount: 12345678.99,
            origRFC: "RCCT033354AB0",
            destRFC: "ABCG395813AAA",
            long: true,
        },
        {
            date: new Date(2022, 12 - 1, 31),
            origAccount: "072580004482",
            destAccount: "140213501772385032",
            nonce: "Abc2zd",
            amount: 12345678.99,
            origRFC: "RCCT033354AB0",
            destRFC: "ABCG395813AAA",
            long: false,
        },
        {
            date: new Date(2022, 12 - 1, 31),
            origAccount: "072580004482",
            destAccount: "140213501772385032",
            nonce: "Abc2zd",
            amount: 12345678.99,
            origRFC: "RCCT033354AB",
            destRFC: "ABCG395813AAA",
            long: true,
        },
        {
            date: new Date(2022, 12 - 1, 31),
            origAccount: "072580004482",
            destAccount: "140213501772385032",
            nonce: "Abc2zd",
            amount: 12345678.99,
            origRFC: "RCCT033354AB24859C",
            destRFC: "ABCG395813AA",
            long: false,
        },
        {
            date: new Date(2022, 12 - 1, 31),
            origAccount: "072580004482",
            destAccount: "140213501772385032",
            nonce: "Abc2zd",
            amount: 12345678.99,
            origRFC: "",
            destRFC: "ABCG395813AA",
            long: true,
        }, {
            date: new Date(2022, 12 - 1, 31),
            origAccount: "072580004482",
            destAccount: "1402135017231",
            nonce: "Abc2zd",
            amount: 12345678.99,
            origRFC: "ND",
            destRFC: "ABCG395813AA",
            long: false,
        }
        ,
        {
            date: new Date(2022, 12 - 1, 31),
            origAccount: "072580004482",
            destAccount: "140213507721",
            nonce: "Abc2zd",
            amount: 12345678.99,
            origRFC: "ND",
            destRFC: "",
            long: true,
        },
    ];

    for (const cep of testCases) {
        const message = createCep(cep);
        const ret: {
            date: string,
            nonce: string,
            dest: string,
            amount: string
        } = await contracts.ParserTest.methods.parseMessage(message).call();

        expect(dec2Ascii(ret.dest)).toEqual(cep.destAccount);

        expect(Number.parseInt(ret.date)).toEqual(getContractDate(cep.date));
        expect(Number.parseFloat(ret.amount)).toEqual(cep.amount * 100);
        expect(dec2Ascii(ret.nonce)).toEqual(cep.nonce);
    }
});