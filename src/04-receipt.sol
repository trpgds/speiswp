// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.7.0 <0.9.0;
import {Types} from "./01-types.sol";
import {PublicKeys} from "./03-publickeys.sol";
import {RSA} from "./00-rsa.sol";
import {Parser} from "./00-parser.sol";
import {Buy} from "./03-buy.sol";

library Receipt {
    /** 
        Proves that the buyer payed the seller by sending a digitally signed "cadenaCDA",
        returns the verified buy amount in MXN cents
     */
    function getReceiptValidAmount(
        mapping(uint16 => Types.PublicKey) storage publicKeys,
        mapping(uint256 => Types.Order) storage orders,
        uint256 orderIndex,
        uint16 publicKeyIndex,
        uint32 pubKeyDateRef,
        uint256[8] memory sig,
        string calldata message
    ) internal returns (uint80) {
        Types.Order memory order = orders[orderIndex];
        // honor seller max pub key:
        require(
            publicKeyIndex <= order.maxPubKeyIndex,
            "seller doesn't trusts pub key"
        );

        // verify bank signature:
        (uint256 exp, uint256[8] memory modulus) = PublicKeys.getValidPublicKey(
            publicKeys,
            publicKeyIndex,
            pubKeyDateRef
        );

        require(
            RSA.verifySig2048SHA256(message, sig, exp, modulus),
            "invalid signature"
        );
        (uint32 dateDays, uint48 nonce, uint160 dest, uint80 amount) = Parser
            .parseMessage(message);

        {
            uint32 unixDays = uint32(block.timestamp / 60 / 60 / 24);

            // Receipt should be up to 7 days older and  newer
            require(
                dateDays >= (unixDays - 7) && dateDays <= (unixDays + 7),
                "out of date"
            );
        }

        // verify seller bank account and SPEI nonce:
        require(order.nonce == nonce && order.dest == dest, "nonce or dest");

        return amount;
    }
}
