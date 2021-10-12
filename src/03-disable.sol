// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.7.0 <0.9.0;
import {Types} from "./01-types.sol";
import {Utils} from "./02-utils.sol";

library Disable {
    function enableOrder(
        mapping(uint256 => Types.OrderVariables) storage orderVars,
        uint256 orderIndex
    ) internal {
        Types.OrderVariables memory order = orderVars[orderIndex];
        orderVars[orderIndex] = Types.OrderVariables({
            // copy:
            funds: order.funds,
            locked: order.locked,
            expire: order.expire,
            lockTime: order.lockTime,
            lockRatio10000: order.lockRatio10000,
            coinIndex: order.coinIndex,

            // update:
            disabled: false
        });
    }

    function disableOrder(
        mapping(uint256 => Types.OrderVariables) storage orderVars,
        uint256 orderIndex
    ) internal {
        Types.OrderVariables memory order = orderVars[orderIndex];
        orderVars[orderIndex] = Types.OrderVariables({
            // copy:
            funds: order.funds,
            locked: order.locked,
            expire: order.expire,
            lockTime: order.lockTime,
            lockRatio10000: order.lockRatio10000,
            coinIndex: order.coinIndex,

            // update
            disabled: true
        });
    }
}
