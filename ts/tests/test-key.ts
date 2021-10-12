import NodeRSA from "node-rsa";
import { hexToDec, splitHex } from "../utils";
import { web3 } from "./setup";

const testPrivateKeys =
    [
        `
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAjleYRBRvHPdLTs7ENbUSF0UNnojnS78yK9JHpx09+rLQSukI
gHgnfPtS4GRfTJGtKtgdKy+rCeq8Hg/J3Sln+GlGlg7+eAi2SfWAMRIbsjYHQj74
SoZ/T5+qf96TtE1MecDQMRNyUeXHzHTpwdlyVjjaU+qsGz5dVJrhMrHt+OyDO8dg
pwY9YrqVG5EWk/7sIT/jlFJ/8yPZ39aSBjr8RBLBEzt5rlk1Xdlj0zBEKDAymPlW
FK3csLZNNgo77C7q0HNO6vajP/F/n1hqI20fouyrq/1cMbuIED7u/yAC3Dw5xDSf
+9usB/8vaaSVGg/ttghEx0v+jTH/LpH4wrcdEwIDAQABAoIBAFaBi6tMU97ht6XU
aVBOlAkKUWWYxCC3uPEC4cMBNYqno4jzKNSSsUT2pH504anyGrCgGNIHLUZgnyUR
6Vd8c5B3wost357phIdcKSUpYSWkSjMLe/Am3zZvzbnadh+snp6b/Krmq6J0KEHs
h6fk0+Tstlsrkp8X/raNTfF2Sy7s/Tu2kLuPDuMY0jbQ+Q52KQF37FoK83MRBuou
BSt02BMAUAjz8L9eJxaZfStldavwZp9fRgbWF/C5RGuek38GOxmidCRrw+hTHgrE
fFZY4esxgCCCO5NlDJdiOBqr8h99/pWLmVx8neEGBosogN+yjso01lwrmnKx4lHS
2JxV98kCgYEA0MXTp/+BJVgGqzik8uNE4BysdIueVxeikPcVYqYfBjaTBjffX/zz
iARx4gmTf03pFqnvjqNus20Y47ko/4UPR4U8D6pxVXvV4ULMLe242BgP8/akiv9P
Xa81HKUdgfiMUFZNBVBA66tdVGtXBiKE8wbw/j/8c4CMdayzJ/LMvD8CgYEAroq6
GJpblr0/RAi769of7qwiYCRJ3YBnwuuxQWoPEhV+A3dks8bihyikSwn+DGNOAI+B
3G8N3svqJhcK+07Ssz3CcSSWZhSjOSEl6LlvF6abXg0rcErS2dv4tWcnVZC9Y8eA
p+dpjZs65X6j3c4bzM5ekmYA9pk0/e4aAov8ei0CgYEAolij3ak3sWWBUhZrVqFa
xvglNz/3Mnyjox0w2RSbXYaE0DoUjx0x95yVPpP5ye45CrG9Iut+QzLcPwGWmxTK
q/A0o24EUdhJmrEJ+9E3g3s6tJkgnSIqgoyjvZG8n3w7CKIDpNUiluEcY3BRLOkc
/6tvLhdt5heZokxYyQDrKpsCgYA9meSYLlJI3z3m6xY35WIDwGjZebVAIcN9PeXv
alkrTr6MxqSZ9oWYojVp7nrlMF8lP4Dbpa5Fhb579wH/NBCVBiUL/Ze/K2V4EkTo
4BlfRYPsK8W6+g10qngave9Z+Z1+C7lSiQ/t1G1y9cEr1URmgidKkAmi/ut++3ve
jj1reQKBgQCP+D2WM3uJsXiYzYl8bNK7RE0nBFj3jZgoXtz6Aqm5ygcCjLg085Kg
JPEGK40qC2f9Hjyd//A4oawQygDNyo7VqwF+wgc8pm1qnf8QtWosbYb9uSuT0N2U
UzkBQtsPh7BCi/Z9FkApEgaLCZ1K3D2KO138ubCeu6aFFeJXQKPWvw==
-----END RSA PRIVATE KEY-----
`,
        `
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAh4kdYbfMF9usHRilko29GsTCB3utXAWwyGE9D4kjNtBCqSOa
FhOIJkbpxe8GEQghWZXbB3zsXApUgK5O5TvzWd24CgNdEYLBc+GSDkjBSCBAzpO3
x4QSCpc7tiQpvKF3n75tRvrnW7Tiu3LD34E/L6Hh+rkDZmxyXGj4GhgaYzbGNy12
tJYjj6eqlVjBq5h+am+o7LB5UbafdsLxZ1ivy56WKmyAM98qbpku6QR19buEbTXn
Hnfo7pv26j22dN9nN6EBQIanp2oiqb98EkA+mnJWOnrOd0W3MVTHwr1U88UXgAZx
FtB9qjS+kwrMu5dx2i2ocWVxU+uuRaGv9p8JFwIDAQABAoIBAFLg0nmtlXzFVGLa
bmzGhWt4A5nl0+VgiXCOnXMBjen3wbuBzLhRK0EUveDOP6xsh1ArparXhgTmQDQL
4qykUzORs/dThTau+TKuLczUSnSbXGW1yHyVUx7syZOgW3FAX1DsdhAgXxch7j9n
d0UV2Jh86h2RwvV/vRKrEYOLV59wucHwAccj+O69+Gqr+SboHXsQ91/wOBsCsgQc
83FpNb2+Z6xE8jw7wPyPtB/tQAfjtQAtXW1PgprNvV63HPotybhau2JQ2HTJQrcz
jAorZIbAzC1WCwQRyzlyyy1CklG180cJE2uBBg1gdU710lgyM0TEUui4oEiacWMR
mtPfKwECgYEA2CA2Flp5Xn8OLnO6/V/jqSC8BpsnfUfg9MSBOHEc9H7uYFpZMQm5
lIYt57XUMln3G54LLPnxd2iF1Ws556lhxoI/SIl8N95/swHXKur/T+HNwzNaltPV
uFHYES/Uk23+rLl8ypR72STQqyP2rsRXMzNiQNXt1VfoME7DmEJYppcCgYEAoIqQ
wtDn2DSGwrVeZhK62sYoHEXY/OL1WeiBB9hgv89PRpO5THyl8E8lljjfGSCRypqu
OiKaT4zeSsKG3Ctm6aB7zjXcV5bfsdbYUeIlL1Qrg+6dFO58NSaFmEz5iJjat+Ks
t78l7g0QGDdCW6YBLeB2OpjU+gPAVBTIX70ngYECgYEAlJ4B03k/gHWKQPMgIF+x
43k5Eqnai9HDpU0DNtbBfHdUYDmAn7H6RWHHa1CjrEQlIn6ZXMI7A0uCzHFBjkXx
kFm8PpscKib8VRHs7fxOuJWjspk7r//XNTpCg/8KBJ9cw1WBtKRKTdV9EFJYrXEi
LXkmFUOGmnAqoB1pbuggod0CgYAxy8krJHFFdsV2D5vAPX8H7P70BhZQGnXP9XZQ
YKVh2YPVeGy5dNBjwaj+95T7zkZqeaAhGCqVEjTBK6V5FV1OiiDczYgTAxFPsDxY
6bRvAcSdn53JqE+OjOxTWUztObxd3UmFlRzGwfaEDF/g3ZTwDfeeJVmqUw+NBQVB
7QIcAQKBgQDBBIY7h3QfIa4jjLinKgBVFUsLHznYlPaXxuVEDwbHd3SMNXywjyVl
STChh3KPzgAwin/EbCPOMv3n/CXEqfoK2helseJg+kM4Em2PB84UPiHa/VY8ht2c
6lCH4BX/guk9GNZC3nmWw0SIWYs3lSLYcjVp2mnT8YeVFYX75Bi/7A==
-----END RSA PRIVATE KEY-----
        `
    ];

/*
key 1:

exp = 10001
mod = 8e579844146f1cf74b4ecec435b51217450d9e88e74bbf322bd247a71d3dfab2d04ae9088078277cfb52e0645f4c91ad2ad81d2b2fab09eabc1e0fc9dd2967f86946960efe7808b649f58031121bb23607423ef84a867f4f9faa7fde93b44d4c79c0d031137251e5c7cc74e9c1d9725638da53eaac1b3e5d549ae132b1edf8ec833bc760a7063d62ba951b911693feec213fe394527ff323d9dfd692063afc4412c1133b79ae59355dd963d3304428303298f95614addcb0b64d360a3bec2eead0734eeaf6a33ff17f9f586a236d1fa2ecababfd5c31bb88103eeeff2002dc3c39c4349ffbdbac07ff2f69a4951a0fedb60844c74bfe8d31ff2e91f8c2b71d13

key 2:

exp = 10001
mod = 87891d61b7cc17dbac1d18a5928dbd1ac4c2077bad5c05b0c8613d0f892336d042a9239a1613882646e9c5ef061108215995db077cec5c0a5480ae4ee53bf359ddb80a035d1182c173e1920e48c1482040ce93b7c784120a973bb62429bca1779fbe6d46fae75bb4e2bb72c3df813f2fa1e1fab903666c725c68f81a181a6336c6372d76b496238fa7aa9558c1ab987e6a6fa8ecb07951b69f76c2f16758afcb9e962a6c8033df2a6e992ee90475f5bb846d35e71e77e8ee9bf6ea3db674df6737a1014086a7a76a22a9bf7c12403e9a72563a7ace7745b73154c7c2bd54f3c51780067116d07daa34be930accbb9771da2da871657153ebae45a1aff69f0917
*/

function generateKey() {
    const key = new NodeRSA({ b: 2048 });
    key.setOptions({
        signingScheme: "pkcs1-sha256"
    });
    return key;
}

export function getKey(index: number = 0) {
    const testPrivateKey = testPrivateKeys[index];
    const key = new NodeRSA().importKey(testPrivateKey, "pkcs1-private-pem");

    key.setOptions({
        signingScheme: "pkcs1-sha256"
    });
    const keyComps = key.exportKey("components");

    key.exportKey()

    /** key public exponent */
    const exp = "0x" + web3.utils.leftPad((keyComps.e as Number).toString(16), 64);
    /** key public modulus */
    const modulus = splitHex(keyComps.n.toString("hex"));

    //console.log("pem", key.exportKey("pkcs1-private-pem"))
    //console.log("exp", exp)
    //console.log("mod", keyComps.n.toString("hex"));

    return ({
        key,
        exp,
        modulus,
        expD: hexToDec(exp),
        modulusD: modulus.map(hexToDec),
    });
}


/*** Signs an ascii message with the test key */
export function sign(message: string, keyIndex: number = 0) {
    return getKey(keyIndex).key.sign(message, "hex").toString()
}

export function verifySignature(message: string, signature: string, keyIndex: number = 0) {
    return getKey(keyIndex).key.verify(Buffer.from(message, "ascii"), signature, undefined, "hex");
}


