// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.7.0 <0.9.0;
import {Types} from "./01-types.sol";
import {Utils} from "./02-utils.sol";
import "./00-IERC20.sol";

library Buy {
    /** Returns how much a buyer will get if a buy with the given MXN amount is executed
        considering buyer locks
     */
    function calcBuyAmount(
        uint80 bLock,
        uint80 amountMXN,
        uint16 priceMXNNum,
        uint16 priceMXNDen,
        uint16 lockRatio10000
    ) internal pure returns (uint80) {
        return Utils.min(
            Utils.addRatio(
                Utils.MxnCentsTo1000Wei(amountMXN, priceMXNNum, priceMXNDen),
                lockRatio10000, 
                10000
            )
            , bLock);
    }

    /** 
        Executes an already verified buy, returns the buy amount and fee in token units.
        Considers buyer lock amount
    */
    function executeBuy(
        mapping(uint256 => Types.OrderVariables) storage orderVars,
        mapping(address => uint256) storage ownerFees,
        mapping(uint16 => address) storage coins,
        mapping(address => mapping(uint256 => Types.BuyerLock)) storage buyerLocks,
        Types.BuyerLock memory buyerLock,
        uint256 orderIndex,
        uint80 amountMXN,
        uint16 priceMXNNum,
        uint16 priceMXNDen,
        uint8 ownerFeeRatio
    ) internal returns (uint80) {
        require(amountMXN > 0, "amount is 0");

        uint80 bLock;
        {
            bLock = Utils.getLockedAmount(
                buyerLock.amount,
                buyerLock.expire,
                uint32(block.timestamp / 60)
            );
        }

        require(bLock > 0, "no buyer lock");

        Types.OrderVariables memory order = orderVars[orderIndex];

        uint80 amount = calcBuyAmount(
            bLock,
            amountMXN,
            priceMXNNum,
            priceMXNDen,
            order.lockRatio10000
        );

        if (amount == 0) return 0;
        {
            address coin = coins[order.coinIndex];
            uint80 fee = amount * ownerFeeRatio / 1000;
            if(fee > 0) {
                ownerFees[coin] += fee;
            }
            if (!IERC20(coin).transfer(msg.sender, uint256(amount - fee) * 1000)) {
                // unreachable
                revert("not enough balance in contract");
            }
        }

        orderVars[orderIndex] = Types.OrderVariables({
            // copy
            expire: order.expire,
            lockTime: order.lockTime,
            lockRatio10000: order.lockRatio10000,
            disabled: order.disabled,
            coinIndex: order.coinIndex,

            // update
            funds: order.funds - amount,
            locked: order.locked - amount
        });

         buyerLocks[msg.sender][orderIndex] = Types.BuyerLock({
            // copy:
            expire: buyerLock.expire,
            publicKeyDateRef: buyerLock.publicKeyDateRef,

            // update:
            amount: bLock - amount
        });

        return amount;
    }
}
