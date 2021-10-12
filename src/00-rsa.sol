// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.7.0 <0.9.0;

library RSA {
    /** Verifies a digital signature for an ASCII message */
    function verifySig2048SHA256(
        string calldata message,
        uint256[8] memory sig,
        uint256 exp,
        uint256[8] memory modulus
    ) internal returns (bool) {
        bytes32 hash = sha256(abi.encodePacked(message));
        return verifySig2048SHA256(hash, sig, exp, modulus);
    }

    /** Verifies a digital signature */
    function verifySig2048SHA256(
        bytes32 hash,
        uint256[8] memory sig,
        uint256 exp,
        uint256[8] memory modulus
    ) private returns (bool) {
        bytes32[8] memory a = pad2048SHA256(hash);
        bytes32[8] memory b = powMod2048(sig, exp, modulus);

        return (a[0] == b[0] &&
            a[1] == b[1] &&
            a[2] == b[2] &&
            a[3] == b[3] &&
            a[4] == b[4] &&
            a[5] == b[5] &&
            a[6] == b[6] &&
            a[7] == b[7]);
    }

    /** Returns the pkcs1_v15 encoded SHA256*/
    function pad2048SHA256(bytes32 hash)
        internal
        pure
        returns (bytes32[8] memory pointer)
    {
        //0x30,0x31,0x30,0x0d,0x06,0x09,0x60,0x86,0x48,0x01,0x65,0x03,0x04,0x02,0x01,0x05,0x00,0x04,0x20
        //
        assembly {
            // prefix
            mstore(
                pointer,
                0x0001000000000000000000000000000000000000000000000000000000000000
            )

            /*
                const keyLen = 2048 / 8;
                const hashInfoLen = 19;
                const hashLen = 256 / 8
                const onesLen = keyLen - hashInfoLen - hashLen - 3; // 202
            */
            // ones:
            mstore(
                add(pointer, 2),
                0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF // 32
            )
            mstore(
                add(pointer, 34),
                0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF // 64
            )
            mstore(
                add(pointer, 66),
                0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF // 96
            )
            mstore(
                add(pointer, 98),
                0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF // 128
            )
            mstore(
                add(pointer, 130),
                0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF // 160
            )
            mstore(
                add(pointer, 162),
                0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF // 192
            )

            // last 10 ones, plus one last 0
            mstore(
                add(pointer, 194),
                0xFFFFFFFFFFFFFFFFFFFF00000000000000000000000000000000000000000000 // 202 + 1
            )

            // hash info:
            mstore(
                add(pointer, 205),
                0x3031300d06096086480165030402010500042000000000000000000000000000
            )

            // hash:
            mstore(add(pointer, 224), hash)
        }
    }

    /**(base ^ exponent) % modulo*/
    function powMod2048(
        uint256[8] memory base,
        uint256 exponent,
        uint256[8] memory modulus
    ) private returns (bytes32[8] memory ret) {
        assembly {
            // Free memory pointer
            let pointer := mload(0x40)

            // bigExpMod contract input format:
            // <length_of_BASE> <length_of_EXPONENT> <length_of_MODULUS> <BASE> <EXPONENT> <MODULUS>

            //lengths
            mstore(pointer, 0x100)
            mstore(add(pointer, 0x20), 0x20)
            mstore(add(pointer, 0x40), 0x100)

            //

            // Define variables base, exponent and modulus
            mstore(add(pointer, 0x60), mload(base))
            mstore(add(pointer, 0x80), mload(add(base, 0x20)))
            mstore(add(pointer, 0xA0), mload(add(base, 0x40)))
            mstore(add(pointer, 0xC0), mload(add(base, 0x60)))

            mstore(add(pointer, 0x0E0), mload(add(base, 0x80)))
            mstore(add(pointer, 0x100), mload(add(base, 0xA0)))
            mstore(add(pointer, 0x120), mload(add(base, 0xC0)))
            mstore(add(pointer, 0x140), mload(add(base, 0xE0)))

            mstore(add(pointer, 0x160), exponent)

            mstore(add(pointer, 0x180), mload(modulus))
            mstore(add(pointer, 0x1A0), mload(add(modulus, 0x20)))
            mstore(add(pointer, 0x1C0), mload(add(modulus, 0x40)))
            mstore(add(pointer, 0x1E0), mload(add(modulus, 0x60)))

            mstore(add(pointer, 0x200), mload(add(modulus, 0x80)))
            mstore(add(pointer, 0x220), mload(add(modulus, 0xA0)))
            mstore(add(pointer, 0x240), mload(add(modulus, 0xC0)))
            mstore(add(pointer, 0x260), mload(add(modulus, 0xE0)))

            // Store the result

            // Call the precompiled contract 0x05 = bigModExp
            if iszero(
                call(
                    gas(), //gas
                    0x05, //bigModExp address
                    0, //ETH value
                    pointer, //in
                    0x280, //in size
                    ret, //out
                    0x100 // out size
                )
            ) {
                revert(0, 0)
            }
        }
    }
}

contract RSATest {
    function hash(string calldata message) external pure returns (bytes32) {
        return sha256(abi.encodePacked(message));
    }

    function pad(string calldata message)
        external
        pure
        returns (bytes32[8] memory pointer)
    {
        return RSA.pad2048SHA256(sha256(abi.encodePacked(message)));
    }

    /** Verifies a digital signature for a string message */
    function verifySig2048SHA256(
        string calldata message,
        uint256[8] memory sig,
        uint256 exp,
        uint256[8] memory modulus
    ) external returns (bool) {
        return RSA.verifySig2048SHA256(message, sig, exp, modulus);
    }
}
