// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.7.0 <0.9.0;

library Types {
    /*
types:

    date =  uint32 (max year 10,141), UNIX minutes
  amount =  uint80 1 unit = 1000 wei,  (max 1e27 GWei or 1,208,925,819 units) 
   ratio =  uint16 (max 65536)
    time =  uint16 (max 45 days), minutes
 account = uint160 (max 20 digits bank account)
   nonce =  uint48 (max 6 characters SPEI nonce)
*/

    /** Order fixed data, 256 bits */
    struct Order {
        /** dest account */
        uint160 dest;
        /** SPEI nonce */
        uint48 nonce;
        /** 
            Coin price in COIN units (1e18 wei) / (MXN * 1000)
            thus, 
                if ratio is 
                [1,1] -> 1 token = 1000 MXN,
                [2,1] -> 1 token = 2000 MXN ,
            [1, 1000] -> 1 token =    1 MXN
                    
        */
        uint16 priceMXN1000Num;
        uint16 priceMXN1000Den;
        /** Max public key index for this order, this prevents validating signatures for a seller-untrusted public key */
        uint16 maxPubKeyIndex;
    }

    /** Order variable info, 232 bits */
    struct OrderVariables {
        /**Order total funds */
        uint80 funds;
        /** Order locked funds */
        uint80 locked;
        /**Date at which the lock expires */
        uint32 expire;
        /** True to disable order locking */
        bool disabled;
        /** 
    Lock ratio in 1 / 10000 units, cost / amount indicates buyer needs to pay "cost" in order to lock "amount" funds
    The lock is free if cost == 0 
     */
        uint16 lockRatio10000;
        /** Lock time in minutes */
        uint16 lockTime;
        /** Order coin */
        uint16 coinIndex;
    }

    /** Order lock per buyer, 112 bits */
    struct BuyerLock {
        /** Order locked funds */
        uint80 amount;
        /**Date at which the lock expires */
        uint32 expire;
        /** Date at which the lock started, used to calculate public key enable state */
        uint32 publicKeyDateRef;
    }

    struct PublicKey {
        uint256 exp;
        uint256[8] modulus;
        /** Public key will be enabled at this time */
        uint32 enableTime;
        /** Public key will be disabled at this time */
        uint32 disableTime;
    }
}
