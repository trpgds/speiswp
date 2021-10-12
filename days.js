function div(a, b) {
    return a / b | 0;
}

function getDays(y, m, d) {
    y -= m <= 2 ? 1 : 0;
    const yoe = y - 2000;      // [0, 399]
    const doy = div(153 * (m > 2 ? m - 3 : m + 9) + 2, 5) + d - 1;  // [0, 365]
    const doe = yoe * 365 + div(yoe, 4) - div(yoe, 100) + doy;         // [0, 146096]
    return doe + 11017;
}


//console.log(getDays(2021, 09, 17));


function asciiToHex(str) {
    var arr1 = [];
    for (var n = 0, l = str.length; n < l; n++) {
        var hex = Number(str.charCodeAt(n)).toString(16);
        arr1.push(hex);
    }
    return arr1.join("");
}

console.log(asciiToHex("5204164997727497"));
