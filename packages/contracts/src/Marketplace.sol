// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./SoulNFT.sol";

/**
 * @title Marketplace — fixed-price listings + drift orchestration
 * @notice Buyer pays in OG, contract escrows. On `DriftCompleted` (observed via
 *         a separate `settle` call), funds release to seller.
 *
 *         For the hackathon MVP: fixed price only, no auctions.
 */
contract Marketplace {
    SoulNFT public immutable souls;

    struct Listing {
        address seller;
        uint128 price;
        bool active;
    }

    // tokenId -> listing
    mapping(uint256 => Listing) public listings;

    // tokenId -> escrowed amount per buyer
    struct Escrow {
        address buyer;
        uint128 amount;
    }
    mapping(uint256 => Escrow) public escrows;

    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event Cancelled(uint256 indexed tokenId);
    event Bought(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event Settled(uint256 indexed tokenId, address indexed seller, uint256 amount);

    error NotOwner();
    error AlreadyListed();
    error NotListed();
    error WrongPrice();
    error EscrowActive();
    error NoEscrow();
    error DriftNotComplete();

    constructor(SoulNFT souls_) {
        souls = souls_;
    }

    // ─── List / Cancel ───────────────────────────────────────────────────

    /// @notice Seller lists their Soul for a fixed price.
    function list(uint256 tokenId, uint128 price) external {
        if (souls.ownerOf(tokenId) != msg.sender) revert NotOwner();
        if (listings[tokenId].active) revert AlreadyListed();
        listings[tokenId] = Listing({seller: msg.sender, price: price, active: true});
        emit Listed(tokenId, msg.sender, price);
    }

    /// @notice Seller cancels their listing.
    function cancel(uint256 tokenId) external {
        Listing memory l = listings[tokenId];
        if (!l.active) revert NotListed();
        if (l.seller != msg.sender) revert NotOwner();
        if (escrows[tokenId].amount > 0) revert EscrowActive();
        delete listings[tokenId];
        emit Cancelled(tokenId);
    }

    // ─── Buy: escrow + initiate drift ────────────────────────────────────

    /// @notice Buyer pays the listing price; escrow created, drift requested.
    function buy(uint256 tokenId) external payable {
        Listing memory l = listings[tokenId];
        if (!l.active) revert NotListed();
        if (msg.value != l.price) revert WrongPrice();
        if (escrows[tokenId].amount > 0) revert EscrowActive();

        escrows[tokenId] = Escrow({buyer: msg.sender, amount: l.price});

        // Initiate drift on behalf of seller (seller must have set approval to this marketplace)
        souls.requestDrift(tokenId, msg.sender);

        emit Bought(tokenId, msg.sender, l.price);
    }

    // ─── Settle after oracle completes drift ─────────────────────────────

    /// @notice Anyone can call once oracle has completed the drift. Pays seller, removes listing.
    function settle(uint256 tokenId) external {
        Escrow memory e = escrows[tokenId];
        if (e.amount == 0) revert NoEscrow();
        // Drift completes when ownership matches the buyer AND no pending drift
        (, bool stillPending) = souls.pendingDrift(tokenId);
        if (stillPending) revert DriftNotComplete();
        if (souls.ownerOf(tokenId) != e.buyer) revert DriftNotComplete();

        Listing memory l = listings[tokenId];
        delete listings[tokenId];
        delete escrows[tokenId];

        (bool sent, ) = payable(l.seller).call{value: e.amount}("");
        require(sent, "transfer failed");

        emit Settled(tokenId, l.seller, e.amount);
    }

    /// @notice Buyer refund if drift is stuck (placeholder for MVP).
    function refund(uint256 tokenId) external {
        Escrow memory e = escrows[tokenId];
        if (e.amount == 0) revert NoEscrow();
        if (e.buyer != msg.sender) revert NotOwner();
        (, bool stillPending) = souls.pendingDrift(tokenId);
        if (!stillPending) revert DriftNotComplete();
        revert("refund: needs oracle support - see Doc 2 known limitations");
    }
}
