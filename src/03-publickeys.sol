// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.7.0 <0.9.0;
import {Types} from "./01-types.sol";
import {Utils} from "./02-utils.sol";

library PublicKeys {
    /** Gets a public key params, requires that the key is enabled at dateRef time */
    function getValidPublicKey(
        mapping(uint16 => Types.PublicKey) storage publicKeys,
        uint16 index,
        uint32 dateRef
    ) internal view returns (uint256 exp, uint256[8] memory modulus) {
        Types.PublicKey memory r = publicKeys[index];
        require(dateRef >= r.enableTime, "public key not yet nabled");
        require(dateRef <= r.disableTime, "public key disabled");

        return (r.exp, r.modulus);
    }

    /**
     Add a new public keys that will be enabled after "timeLock" minutes
     Does not verify "index", so caller needs to ensure that this is an empty index.
     */
    function addPublicKey(
        mapping(uint16 => Types.PublicKey) storage publicKeys,
        uint16 timeLock,
        uint16 index,
        uint256 exp,
        uint256[8] memory modulus
    ) external {
        uint32 unixMinutes = uint32(block.timestamp / 60);
        publicKeys[index] = Types.PublicKey(
            exp,
            modulus,
            unixMinutes + timeLock,
            0xFFFFFFFF
        );
    }

    /** 
    Disables an specific public key after "timelock" minutes.
     */
    function disablePublicKey(
        mapping(uint16 => Types.PublicKey) storage publicKeys,
        uint16 timeLock,
        uint16 index
    ) external {
        Types.PublicKey memory r = publicKeys[index];
        uint32 unixMinutes = uint32(block.timestamp / 60);
        uint32 disableTime = unixMinutes + timeLock;
        require(disableTime < r.disableTime, "key already disabled");

        publicKeys[index] = Types.PublicKey(
            // copy:
            r.exp,
            r.modulus,
            r.enableTime,
            // update
            disableTime
        );
    }
}
