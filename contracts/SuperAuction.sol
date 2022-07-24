// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Import this file to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SuperAuction is ReentrancyGuard {

    event BiddingStarted(uint256 productId);
    event BiddingEnded(uint256 productId);
    event NewWinningBid(uint256 productId, uint256 bidAmount, address owner);
    event BidNotAccepted(uint256 productId, uint256 bidAmount, address owner);
    event ClaimSuccess(uint256 productId, address owner);

    struct AuctionProduct {
        uint256 id;
        uint256 initialPrice;
        address seller;
        string url;
        uint256 bidStart;
        uint256 bidEnd;
    }

    struct Bidder {
        uint256 bidAmount;
        address owner;
    }

    mapping(uint256 => AuctionProduct) products;
    mapping(uint256 => Bidder) productBids;
    mapping(uint256 => bool) productClaims;
    uint256 nextId = 1;

    address private _admin;

    // before deployment to MAINNET, set this to FALSE!
    bool private _test_override = true;

    constructor() {
        _admin = msg.sender;
        console.log('block.timestamp is ', block.timestamp);
    }

    modifier onlyAdmin {
        require(msg.sender == _admin, 'Only Admin can operate this fn');
        _;
    }

    function isAdmin() public view returns (bool) {
        return _admin == msg.sender;
    }

    function addProduct(uint256 initPrice, address seller, string calldata url, uint256 bidStart, uint256 bidEnd) public onlyAdmin {
        products[nextId] = AuctionProduct(nextId, initPrice, seller, url, bidStart, bidEnd);
        nextId++;
    }

    function getProductById(uint256 productId) public view returns (AuctionProduct memory)  {
        return AuctionProduct(
            products[productId].id,
            products[productId].initialPrice,
            products[productId].seller,
            "HIDDEN",
            products[productId].bidStart,
            products[productId].bidEnd
        );
    }

    function getNextId() public view returns (uint256) {
        return nextId;
    }

    function getHighestBid(uint256 productId) public view returns(Bidder memory) {
        return productBids[productId];
    }

    function bid(uint256 productId, uint256 bidAmount) public returns(bool) {
        // console.log('block.timestamp', block.timestamp);
        // console.log('products[productId].bidStart', products[productId].bidStart);
        require(productId < nextId, 'AuctionProduct does not exist');
        require(productClaims[productId] == false, 'This product has been claimed');

        // for time-sensitive conditions, let's pass if doing testing
        if (!_test_override) {
            require(block.timestamp > products[productId].bidStart, 'Bidding not yet started');
            require(block.timestamp < products[productId].bidEnd, 'Bidding has ended');
        }

        Bidder memory currentBid = productBids[productId];

        if (currentBid.bidAmount == 0 || bidAmount > currentBid.bidAmount) { // first bid
            productBids[productId] = Bidder(bidAmount, msg.sender);
            emit NewWinningBid(productId, bidAmount, msg.sender);
            return true;
        }
        emit BidNotAccepted(productId, bidAmount, msg.sender);
        return false;
    }

    function checkWinningBid(uint256 productId) public view returns (Bidder memory) {
        return productBids[productId];
    }

    function claimProduct(uint256 productId) public nonReentrant payable returns (string memory) {
        require(productBids[productId].owner == msg.sender, 'Only winner can claim');
        require(!productClaims[productId], "Has been claimed");

        if (!_test_override) {
            require(block.timestamp > products[productId].bidEnd, 'Bidding not yet ended');
        }

        console.log('msg.value', msg.value);
        console.log('bidAmount', productBids[productId].bidAmount);
        require(msg.value >= productBids[productId].bidAmount, 'Insufficient amount paid');

        (bool sent, ) = products[productId].seller.call{value: msg.value}("");
        require(sent, "Failed to send Ether");

        productClaims[productId] = true;
        emit ClaimSuccess(productId, msg.sender);
        return products[productId].url;
    }

    function getProductUrl(uint256 productId) public view returns(string memory) {
        require(productBids[productId].owner == msg.sender, 'Only winner can retrieve product url');
        require(productClaims[productId] == true, 'Not yet claimed. Execute claimProduct first');
        return products[productId].url;
    }

    // TODO: implement fallback functions
    function checkAuction() public {
        for (uint256 index = 1; index < nextId; index++) {
            AuctionProduct memory p = products[index];
            if (block.timestamp > p.bidStart && block.timestamp < p.bidEnd ) {
                emit BiddingStarted(index);
            } else if (block.timestamp > p.bidStart && block.timestamp > p.bidEnd) {
                emit BiddingEnded(index);
            }
        }
    }
}