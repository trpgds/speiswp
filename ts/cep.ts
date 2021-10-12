
import { hexToBase64, question } from "./utils";
import { CepParams, createCep } from "./tests/helper";
import { sign } from "./tests/test-key";


(async () => {
    const destAccount = await question("destAccount?", "000123123123123123");
    const concepto = await question("concepto?", "ABC123");
    const amount = Number.parseFloat(await question("amount?", "100.00"));
    const date = new Date();

    const cep: CepParams = {
        amount: amount,
        nonce: concepto,
        destAccount: destAccount,
        date: date,
        destRFC: "ABCG395813AAA",
        origAccount: "000123123123123123",
        origRFC: "ABCG395813AAA"
    };

    const validCep = createCep(cep);
    const signature = hexToBase64(sign(validCep, 0));

    const cda = validCep + signature;
    console.log(cda);

})().catch(reason => {
    console.log(reason);
});

