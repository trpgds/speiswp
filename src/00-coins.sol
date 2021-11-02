// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.7.0 <0.9.0;

library Coins {
    function initCoins(mapping(uint16 => address) storage coins, uint16 c)
        external
        returns (uint16)
    {
        // native wrapped:

        // WBNB
        coins[c++] = address(0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c);

        // stables:

        // USDT
        coins[c++] = address(0x55d398326f99059fF775485246999027B3197955);

        // USDC
        coins[c++] = address(0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d);

        // BUSD
        coins[c++] = address(0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56);

        // DAI
        coins[c++] = address(0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3);

        // binance pegs:

        // BTC
        coins[c++] = address(0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c);

        // ETH
        coins[c++] = address(0x2170Ed0880ac9A755fd29B2688956BD959F933F8);

        // ADA
        coins[c++] = address(0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47);

        // XRP
        coins[c++] = address(0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE);

        // DOT
        coins[c++] = address(0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402);

        // LTC
        coins[c++] = address(0x4338665CBB7B2485A8855A139b75D5e34AB0DB94);

        return c;
    }
}
