// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.7.0 <0.9.0;
import {Types} from "./01-types.sol";

library Utils {
    function mulRatio(
        uint80 amount,
        uint16 ratioNum,
        uint16 ratioDen
    ) internal pure returns (uint80) {
        return uint80((uint256(amount) * ratioNum) / ratioDen);
    }

    /** 
        Converts from MXN cents to 1000 wei units
        Price is in 
     */
    function MxnCentsTo1000Wei(
        uint80 amountMXN,
        uint16 priceMXN1000Num,
        uint16 priceMXN1000Den
    ) internal pure returns (uint80) {
        return
            uint80(
                (uint256(amountMXN) * priceMXN1000Den * 10000000000) /
                    priceMXN1000Num
            );
    }

    function addRatio(
        uint80 amount,
        uint16 ratioNum,
        uint16 ratioDen
    ) internal pure returns (uint80) {
        return uint80(amount + ((uint256(amount) * ratioNum) / ratioDen));
    }

    /** Returns an order locked funds or 0 if the lock is expired */
    function getLockedAmount(
        uint80 locked,
        uint32 lockExpire,
        uint32 nowMinutes
    ) internal pure returns (uint80 ret) {
        assembly {
            ret := mul(locked, lt(nowMinutes, lockExpire))
        }
    }

    function min(uint80 a, uint80 b) internal pure returns (uint80) {
        return a < b ? a : b;
    }

    function min(uint32 a, uint32 b) internal pure returns (uint32) {
        return a < b ? a : b;
    }
}

contract UtilsTest {
    function MxnCentsTo1000Wei(
        uint80 amountMXN,
        uint16 priceMXN1000Num,
        uint16 priceMXN1000Den
    ) external pure returns (uint80) {
        return
            Utils.MxnCentsTo1000Wei(
                amountMXN,
                priceMXN1000Num,
                priceMXN1000Den
            );
    }
}
