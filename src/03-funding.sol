// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.7.0 <0.9.0;
import "./00-IERC20.sol";
import {Types} from "./01-types.sol";
import {Utils} from "./02-utils.sol";

library Funding {
      /** Add funds to a sell order */
    function fundOrder(
            mapping(uint256 => Types.OrderVariables) storage orderVars,
            mapping(uint16 => address) storage coins,
            uint256 orderIndex, 
            uint80 amount) internal {
        require(amount  > 0, "amount is 0");
        // No need to verify that seller == msg.sender, anyone can fund an order
        Types.OrderVariables memory order = orderVars[orderIndex];
        
        address coin = coins[order.coinIndex];
        if(!IERC20(coin).transferFrom(msg.sender, address(this), uint256(amount) * 1000)) {
            revert("not enough funds");
        }

        orderVars[orderIndex] = Types.OrderVariables({
            // copy:
            locked: order.locked,
            expire: order.expire,
            disabled: order.disabled,
            lockRatio10000: order.lockRatio10000,
            lockTime: order.lockTime,
            coinIndex: order.coinIndex,

            // update:
            funds: order.funds + amount

        });
    }

    function defundOrder(
            mapping(uint256 => Types.OrderVariables) storage orderVars,
            mapping(uint16 => address) storage coins,
            uint256 orderIndex, 
            uint80 amount
            ) internal {
        require(amount > 0, "amount is zero");
        
        Types.OrderVariables memory order = orderVars[orderIndex];
        uint80 locked = Utils.getLockedAmount(order.locked, order.expire, uint32(block.timestamp / 60));
        uint80 free = order.funds - locked;

        require(amount <= free, "amount more than free funds");

        address coin = coins[order.coinIndex];
        if(!IERC20(coin).transfer(msg.sender, uint256(amount) * 1000)) {
            // unreachable
            revert("not enough balance in contract");
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
            locked: locked
        });
    }
}
