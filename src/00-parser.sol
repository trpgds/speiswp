// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.7.0 <0.9.0;

library Parser {
    /** 
    Returns the number of days since 1970-01-01
    Valid in the year range [2001, 2399]
    */
    function getUnixDate(
        uint32 y,
        uint32 m,
        uint32 d
    ) internal pure returns (uint32) {
        assembly {
            y := sub(y, lt(m, 3))
        }

        uint32 yoe = y - 2000; // [0, 399]
        uint32 doy = ((153 * ((m + 9) % 12) + 2) / 5) + d - 1; // [0, 365]
        uint32 doe = yoe * 365 + (yoe / 4) - (yoe / 100) + doy; // [0, 146096]
        return doe + 11017;
    }

    /** Parses a CEP "cadenaCDA" attribute */
    function parseMessage(string calldata message)
        external
        pure
        returns (
            uint32 date,
            uint48 nonce,
            uint160 dest,
            uint80 amount
        )
    {
        //parse the date:
        uint256 dateAscii;
        assembly {
            dateAscii := calldataload(add(message.offset, 13))
        }

        {
            uint32 day = uint32(
                (((dateAscii >> 248) & 0x0f) * 10) +
                    ((dateAscii >> 240) & 0x000f)
            );

            uint32 month = uint32(
                (((dateAscii >> 232) & 0x0f) * 10) +
                    ((dateAscii >> 224) & 0x000f)
            );

            uint32 year = uint32(
                (((dateAscii >> 216) & 0x0f) * 1000) +
                    (((dateAscii >> 208) & 0x000f) * 100) +
                    (((dateAscii >> 200) & 0x00000f) * 10) +
                    (((dateAscii >> 192) & 0x0000000f))
            );

            date = getUnixDate(year, month, day);
        }

        assembly {
            let b := add(message.offset, 22)
            {
                let pipeCount := 0
                for {

                } lt(pipeCount, 5) {
                    b := add(b, 1)
                } {
                    // if char is pipe
                    if eq(
                        and(
                            calldataload(b),
                            0xff00000000000000000000000000000000000000000000000000000000000000
                        ),
                        0x7c00000000000000000000000000000000000000000000000000000000000000
                    ) {
                        pipeCount := add(pipeCount, 1)
                    }
                }
            }

            // we know that on position 5 we have an account number with at least 12 bytes
            b := add(b, 12)
            {
                let pipeCount := 0
                for {

                } lt(pipeCount, 5) {
                    b := add(b, 1)
                } {
                    // if char is pipe
                    if eq(
                        and(
                            calldataload(b),
                            0xff00000000000000000000000000000000000000000000000000000000000000
                        ),
                        0x7c00000000000000000000000000000000000000000000000000000000000000
                    ) {
                        pipeCount := add(pipeCount, 1)
                    }
                }
            }

            // parse account number:
            dest := calldataload(b)

            let divisor := 0x100000000000000000000000000000000000000
            for {

            } iszero(
                eq(
                    and(div(dest, divisor), 0xff),
                    // search the pipe
                    0x7c
                )
            ) {

            } {
                b := add(b, 1)
                divisor := div(divisor, 0x100)
            }

            dest := div(dest, mul(divisor, 0x100))

            b := add(b, 13) // pipe(1) + initial read (11) + pipe (1)

            {
                //read until the next pipe:
                for {

                } iszero(
                    eq(
                        and(
                            calldataload(b),
                            0xff00000000000000000000000000000000000000000000000000000000000000
                        ),
                        0x7c00000000000000000000000000000000000000000000000000000000000000
                    )
                ) {

                } {
                    b := add(b, 1)
                }

                b := add(b, 1) // pipe
            }

            // parse the nonce

            nonce := div(
                and(
                    calldataload(b),
                    // nonce is 6 digits long
                    0xffffffffffff0000000000000000000000000000000000000000000000000000
                ),
                0x10000000000000000000000000000000000000000000000000000
            )

            b := add(b, 11) // read(6) + pipe(1) + read(min 4)

            //read until the next pipe:
            for {

            } iszero(
                eq(
                    and(
                        calldataload(b),
                        0xff00000000000000000000000000000000000000000000000000000000000000
                    ),
                    0x7c00000000000000000000000000000000000000000000000000000000000000
                )
            ) {

            } {
                b := add(b, 1)
            }

            b := add(b, 1) // +5 pipe count

            // parse amount:

            // parse integer part:
            let amountData := calldataload(b)
            amount := 0

            divisor := 0x100000000000000000000000000000000000000000000000000000000000000
            for {

            } iszero(
                eq(
                    and(div(amountData, divisor), 0xff),
                    // search the decimal dot
                    0x2e
                )
            ) {

            } {
                amount := add(
                    mul(amount, 10),
                    and(div(amountData, divisor), 0x0f)
                )
                divisor := div(divisor, 0x100)
            }

            // parse decimal part:
            amount := add(
                mul(amount, 100),
                add(
                    mul(and(div(amountData, div(divisor, 0x100)), 0x0f), 10),
                    and(div(amountData, div(divisor, 0x10000)), 0x0f)
                )
            )
        }
    }

    // END 2
}

contract ParserTest {
    /** Parses a CEP "cadenaCDA" attribute */
    function parseMessage(string calldata message)
        external
        pure
        returns (
            uint256 date,
            uint48 nonce,
            uint160 dest,
            uint256 amount
        )
    {
        return Parser.parseMessage(message);
    }

    /** 
    Returns the number of days since 2000-03-01
    Only valid since year 2001
    */
    function getUnixDate(
        uint32 y,
        uint32 m,
        uint32 d
    ) external pure returns (uint32) {
        return Parser.getUnixDate(y, m, d);
    }
}
