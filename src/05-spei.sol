// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.7.0 <0.9.0;
import "./00-IERC20.sol";
import {Creator} from "./02-createOrder.sol";
import {Funding} from "./03-funding.sol";
import {Disable} from "./03-disable.sol";
import {Lock} from "./03-lock.sol";
import {Types} from "./01-types.sol";
import {Parser} from "./00-parser.sol";
import {Buy} from "./03-buy.sol";
import {PublicKeys} from "./03-publickeys.sol";
import {RSA} from "./00-rsa.sol";
import {Receipt} from "./04-receipt.sol";
import {Coins} from "./00-coins.sol";

contract SPEI {
    event OrderCreated(uint256 index, address indexed seller);
    event BuyExecuted(uint80 amount);
    event OrderLocked(uint256 index, address indexed buyer);

    /** 

    ************************************************************************
    |  Feel free to buy me a cup of coffee by donating to this address :)  |
    ************************************************************************

     */
    address owner;

    constructor() {
        owner = msg.sender;
        initCoins();
    }

    // ***********************************
    // owner functions:
    // ***********************************

    modifier onlyOwner() {
        require(msg.sender == owner, "owner only");
        _;
    }

    function initCoins() private onlyOwner {
        require(coinCount == 0, "coins already initted");

        uint16 c = Coins.initCoins(coins, coinCount);
        coinCount = c;
    }

    function addCoin(address coin) external onlyOwner {
        require(coinCount > 0, "call initCoins");
        coins[coinCount] = coin;
        coinCount++;
    }

    function requestTimelockChange() external onlyOwner {
        uint32 unixMinutes = uint32(block.timestamp / 60);
        timeLockChangeEnabledAt = unixMinutes + timeLock;
    }

    /** Send collected fees to owner */
    function collectFees(address coin) external onlyOwner {
        uint256 balance = ownerFees[coin];
        require(balance > 0);

        if (!IERC20(coin).transfer(owner, uint256(balance) * 1000)) {
            revert("not enough funds");
        }
        ownerFees[coin] -= balance;
    }

    modifier onlyOwnerInTimelock() {
        require(msg.sender == owner);
        {
            uint32 unixMinutes = uint32(block.timestamp / 60);
            require(
                unixMinutes >= timeLockChangeEnabledAt &&
                    unixMinutes < (timeLockChangeEnabledAt + 60 * 3),
                "timelock only"
            );
        }
        _;
    }

    function changeOwner(address next) external onlyOwnerInTimelock {
        owner = next;
    }

    function changeTimelock(uint16 newTimelock) external onlyOwnerInTimelock {
        // Max timelock is 1 week
        require(newTimelock < 60 * 24 * 7);
        require(fixedTimeLock == false);

        timeLock = newTimelock;
    }

    function changeFee(uint8 newFee) external onlyOwnerInTimelock {
        ownerFeeRatio = newFee;
    }

    /** Adds a new bank public key that will be enabled after "timeLock" minutes */
    function addPublicKey(uint256 exp, uint256[8] memory modulus)
        external
        onlyOwner
    {
        uint16 index = publicKeyCount;
        PublicKeys.addPublicKey(publicKeys, timeLock, index, exp, modulus);
        publicKeyCount = index + 1;
    }

    /** Disables a public key after "timeLock" minutes */
    function disablePublicKey(uint16 index) external onlyOwner {
        PublicKeys.disablePublicKey(publicKeys, timeLock, index);
    }

    /** Disables the ability to change the timelock */
    function fixTimelock() external onlyOwner {
        fixedTimeLock = true;
    }

    /** Time required for owner to update public keys in minutes */
    uint16 public timeLock;
    /** timeLock and owner fee will be able change in the range [timeLockChangeEnabledAt, timeLockChangeEnabledAt + 3 hours] */
    uint32 public timeLockChangeEnabledAt;

    /** Prevents the timelock to be changed */
    bool public fixedTimeLock;

    /** 
        Owner fee for any executed buys in 0.1% steps,
        so max fee == 25.6%
        Fee can only be changed inside the timelock period
     */
    uint8 public ownerFeeRatio;

    /** Collected fees for each ERC20 coin */
    mapping(address => uint256) public ownerFees;

    /** For each order, the seller address */
    mapping(uint256 => address) internal orderSellers;

    /** All sell orders */
    mapping(uint256 => Types.Order) internal orders;

    /** Order variable data */
    mapping(uint256 => Types.OrderVariables) internal orderVars;

    /** For each buyer and order, the locked funds */
    mapping(address => mapping(uint256 => Types.BuyerLock)) internal buyerLocks;

    /** Public keys count, also the next public key index */
    uint16 internal publicKeyCount;

    /** Bank public keys */
    mapping(uint16 => Types.PublicKey) internal publicKeys;

    /** 
        Least significant 256 bits of already spent message signatures 
        Note that we didn't found a way to prevent double spending without tracking each receipt separately,
        this is an open problem that might be related to a secure way to generate random and non repeatable SPEI nonces
    */
    mapping(uint256 => bool) internal spentSignatures;

    /** coin address index */
    mapping(uint16 => address) internal coins;
    uint16 internal coinCount;

    function orderSeller(uint256 index) external view returns (address) {
        return orderSellers[index];
    }

    function getCoinCount() external view returns (uint16) {
        return coinCount;
    }

    function getCoin(uint16 index) external view returns (address) {
        return coins[index];
    }

    function orderDefinition(uint256 index)
        external
        view
        returns (Types.Order memory)
    {
        return orders[index];
    }

    function orderVariables(uint256 index)
        external
        view
        returns (Types.OrderVariables memory)
    {
        return orderVars[index];
    }

    function buyerLock(address buyer, uint256 order)
        external
        view
        returns (Types.BuyerLock memory)
    {
        return buyerLocks[buyer][order];
    }

    function getPublicKeyCount() external view returns (uint16) {
        return publicKeyCount;
    }

    function getValidPublicKey(uint16 orderIndex)
        external
        view
        returns (uint256 exp, uint256[8] memory modulus)
    {
        return
            PublicKeys.getValidPublicKey(
                publicKeys,
                orderIndex,
                uint32(block.timestamp / 60)
            );
    }

    function getPublicKey(uint16 index)
        external
        view
        returns (Types.PublicKey memory)
    {
        return publicKeys[index];
    }

    function getOwnerFees(address coin) external view returns (uint256) {
        return ownerFees[coin];
    }

    /** Creates a sell order and returns the order index. Caller must pay "funds" in "coin" */
    function createOrder(
        uint256 index,
        uint80 funds,
        uint160 dest,
        uint16 coinIndex,
        uint16 priceMXN1000Num,
        uint16 priceMXN1000Den,
        uint48 nonce,
        uint16 lockRatio10000,
        uint16 lockTime,
        uint16 maxPubKeyIndex
    ) external returns (uint256) {
        require(priceMXN1000Num > 0, "price num");
        require(priceMXN1000Den > 0, "price den");
        require(lockTime > 0, "lockTime is 0");

        // Can't overwrite orders:
        require(orderSellers[index] == address(0), "order already exists");

        if (funds > 0) {
            address coin = coins[coinIndex];
            require(coin != address(0), "invalid coin");

            if (
                !IERC20(coin).transferFrom(
                    msg.sender,
                    address(this),
                    uint256(funds) * 1000
                )
            ) {
                revert("not enough funds");
            }
        }

        orderSellers[index] = msg.sender;

        orders[index] = Types.Order({
            dest: dest,
            nonce: nonce,
            priceMXN1000Num: priceMXN1000Num,
            priceMXN1000Den: priceMXN1000Den,
            maxPubKeyIndex: maxPubKeyIndex
        });

        orderVars[index] = Types.OrderVariables({
            funds: funds,
            locked: 0,
            expire: 0,
            disabled: false,
            lockRatio10000: lockRatio10000,
            lockTime: lockTime,
            coinIndex: coinIndex
        });

        emit OrderCreated(index, msg.sender);

        return index;
    }

    /** Add funds to a sell order. Anyone can fund an order */
    function fundOrder(uint256 orderIndex, uint80 amount) external {
        Funding.fundOrder(orderVars, coins, orderIndex, amount);
    }

    /** Withdraw funds from a sell order */
    function defundOrder(uint256 orderIndex, uint80 amount) external {
        address seller = orderSellers[orderIndex];
        require(seller == msg.sender);

        return Funding.defundOrder(orderVars, coins, orderIndex, amount);
    }

    /** Prevent any buyer from locking this order */
    function disableOrder(uint256 orderIndex) external {
        require(orderSellers[orderIndex] == msg.sender);
        Disable.disableOrder(orderVars, orderIndex);
    }

    /** Allow again buyers to lock this order */
    function enableOrder(uint256 orderIndex) external {
        require(orderSellers[orderIndex] == msg.sender);
        Disable.enableOrder(orderVars, orderIndex);
    }

    /** Lock "amount" for the given order. Caller will pay amount * lockRatio  */
    function lockOrder(uint256 orderIndex, uint80 amount) external {
        Lock.lockOrder(orderVars, coins, buyerLocks, orderIndex, amount);
        emit OrderLocked(orderIndex, msg.sender);
    }

    /** Executes an already verified buy */
    function executeBuy(
        uint256 orderIndex,
        uint80 amountMXN,
        Types.BuyerLock memory lock
    ) internal {
        Types.Order memory order = orders[orderIndex];
        uint80 amount = Buy.executeBuy(
            orderVars,
            ownerFees,
            coins,
            buyerLocks,
            lock,
            orderIndex,
            amountMXN,
            order.priceMXN1000Num,
            order.priceMXN1000Den,
            ownerFeeRatio
        );

        emit BuyExecuted(amount);
    }

    /** Buys a sell order */
    function buy(
        uint256 orderIndex,
        uint16 publicKeyIndex,
        uint256[8] memory sig,
        string calldata message
    ) external {
        Types.BuyerLock memory lock = buyerLocks[msg.sender][orderIndex];

        uint80 amountMXN = Receipt.getReceiptValidAmount(
            publicKeys,
            orders,
            orderIndex,
            publicKeyIndex,
            lock.publicKeyDateRef,
            sig,
            message
        );
        require(!spentSignatures[sig[3]], "already spent");
        executeBuy(orderIndex, amountMXN, lock);
        spentSignatures[sig[3]] = true;
    }
}

contract SPEITest is SPEI {
    function executeBuyTest(uint256 orderIndex, uint80 amountMXN) external {
        Types.BuyerLock memory lock = buyerLocks[msg.sender][orderIndex];
        executeBuy(orderIndex, amountMXN, lock);
    }
}
