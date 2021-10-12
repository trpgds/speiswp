// SPDX-License-Identifier: MIT
/**
 *Submitted for verification at Etherscan.io on 2017-02-10
 */

pragma solidity >=0.7.0 <0.9.0;
import "./00-IERC20.sol";

/**
 * Standard ERC-20 token
 */
contract StandardTestToken is IERC20 {
    uint256 public override totalSupply;
    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowed;

    function balanceOf(address _owner)
        external
        view
        override
        returns (uint256 balance)
    {
        return balances[_owner];
    }

    function transfer(address _to, uint256 _value)
        external
        override
        returns (bool success)
    {
        if (balances[msg.sender] >= _value && _value > 0) {
            balances[msg.sender] -= _value;
            balances[_to] += _value;
            emit Transfer(msg.sender, _to, _value);
            return true;
        } else {
            return false;
        }
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external override returns (bool success) {
        if (
            balances[_from] >= _value &&
            allowed[_from][msg.sender] >= _value &&
            _value > 0
        ) {
            balances[_to] += _value;
            balances[_from] -= _value;
            allowed[_from][msg.sender] -= _value;
            emit Transfer(_from, _to, _value);
            return true;
        } else {
            return false;
        }
    }

    function approve(address _spender, uint256 _value)
        external
        override
        returns (bool success)
    {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender)
        external
        view
        override
        returns (uint256 remaining)
    {
        return allowed[_owner][_spender];
    }
}

contract TestToken is StandardTestToken {
    string public name = "Test Standard Token";
    string public symbol = "TST";
    uint256 public decimals = 18;

    function showMeTheMoney(address _to, uint256 _value) external {
        totalSupply += _value;
        balances[_to] += _value;
        emit Transfer(address(0), _to, _value);
    }
}
