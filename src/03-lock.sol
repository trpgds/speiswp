// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.7.0 <0.9.0;
import "./00-IERC20.sol";
import {Types} from "./01-types.sol";
import {Utils} from "./02-utils.sol";

library Lock {
     /** Lock "amount" for the given order. Caller will pay amount * lockRatio  */
    function lockOrder(
        mapping(uint256 => Types.OrderVariables) storage orderVars,
        mapping(uint16 => address) storage coins,
        mapping(address => mapping(uint256 => Types.BuyerLock)) storage buyerLocks,
        uint256 orderIndex, 
        uint80 amount) internal {
        Types.OrderVariables memory order = orderVars[orderIndex];
        require(order.lockTime > 0, "order doesn't exists");
        require(!order.disabled, "order disabled");
        require(amount > 0, "amount is zero");

        address coin = coins[order.coinIndex];
        uint32 unixMinutes = uint32(block.timestamp / 60);
        uint80 lock =  Utils.getLockedAmount(order.locked, order.expire, unixMinutes);
        uint80 free = order.funds - lock;

        require(amount <= free, "not enough order funds");

        // Buyer pays amount * lockRatio
        uint80 fundsDelta = Utils.mulRatio(amount, order.lockRatio10000, 10000);
        if(fundsDelta > 0) {
            if(!IERC20(coin).transferFrom(msg.sender, address(this), uint256(fundsDelta) * 1000)) {
                revert("not enough funds");
            }
        }

        // Increment order funds and lock:

        uint32 expire = unixMinutes + order.lockTime;
        orderVars[orderIndex] = Types.OrderVariables({
            // copy:
            lockRatio10000: order.lockRatio10000,
            lockTime: order.lockTime,
            coinIndex: order.coinIndex,
            disabled: false,

            // update:
            funds: order.funds + fundsDelta,
            locked: lock + fundsDelta + amount,
            expire: expire
        });

        // Increment buyer lock:
        Types.BuyerLock memory buyerLock = buyerLocks[msg.sender][orderIndex];
        uint80 bLock =  Utils.getLockedAmount(buyerLock.amount, buyerLock.expire, unixMinutes);
        buyerLocks[msg.sender][orderIndex] = Types.BuyerLock({
            amount: bLock + fundsDelta + amount,
            expire: expire,
            publicKeyDateRef: unixMinutes
        });
    }
    
 
}
