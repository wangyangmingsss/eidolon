// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/SoulNFT.sol";
import "../src/Marketplace.sol";
import "../src/OracleRegistry.sol";

contract RoyaltyFlowTest is Test {
    SoulNFT internal souls;
    Marketplace internal market;
    OracleRegistry internal registry;

    address internal admin = address(0xA100);
    address internal alice = address(0xA000);
    address internal bob   = address(0xB000);
    address internal carol = address(0xC000);
    uint256 internal oraclePk = 0xBEEF;
    address internal oracleAddr;

    bytes32 internal constant ROOT_1 = bytes32(uint256(0x1));
    bytes32 internal constant ROOT_2 = bytes32(uint256(0x2));
    bytes32 internal constant ROOT_3 = bytes32(uint256(0x3));

    function setUp() public {
        oracleAddr = vm.addr(oraclePk);
        vm.startPrank(admin);
        registry = new OracleRegistry(admin);
        registry.addOracle(oracleAddr);
        souls = new SoulNFT("Eidolon Souls", "SOUL", registry, admin);
        market = new Marketplace(souls);
        vm.stopPrank();
        vm.deal(bob, 100 ether);
        vm.deal(carol, 100 ether);
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    function _completeDrift(uint256 id, address newOwner, bytes32 newRoot) internal {
        uint256 nonce = souls.driftNonce(id);
        bytes32 digest = keccak256(abi.encode(block.chainid, address(souls), id, newOwner, newRoot, nonce));
        bytes32 ethSigned = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(oraclePk, ethSigned);
        souls.completeDrift(id, newOwner, newRoot, "ipfs://new", nonce, abi.encodePacked(r, s, v));
    }

    function _sellTo(uint256 id, address seller, address buyer, uint128 price, bytes32 newRoot) internal {
        vm.prank(seller);
        souls.setApprovalForAll(address(market), true);

        vm.prank(seller);
        market.list(id, price);

        vm.prank(buyer);
        market.buy{value: price}(id);

        _completeDrift(id, buyer, newRoot);

        market.settle(id);
    }

    // ── Tests ────────────────────────────────────────────────────────────

    /// @notice Alice mints, sells to Bob. Bob resells to Carol. Alice gets 2.5% royalty on Bob->Carol sale.
    function test_royalty_paid_on_secondary_drift() public {
        // Alice mints (default 250 bps = 2.5%)
        uint256 id = souls.mint(alice, ROOT_1, "ipfs://mock");

        // First sale: Alice -> Bob at 1 ether (no royalty because seller == fineTuner)
        _sellTo(id, alice, bob, 1 ether, ROOT_2);
        assertEq(souls.ownerOf(id), bob);

        // Second sale: Bob -> Carol at 2 ether
        uint256 aliceBalBefore = alice.balance;
        uint256 bobBalBefore = bob.balance;
        _sellTo(id, bob, carol, 2 ether, ROOT_3);

        // Alice should receive 2.5% royalty = 0.05 ether
        assertEq(alice.balance, aliceBalBefore + 0.05 ether, "Alice should receive 2.5% royalty");
        // Bob should receive 2 ether - 0.05 ether = 1.95 ether
        assertEq(bob.balance, bobBalBefore + 1.95 ether, "Bob should receive sale price minus royalty");
    }

    /// @notice Alice mints and sells to Bob. Alice receives full price (no self-royalty).
    function test_no_royalty_when_seller_is_finetuner() public {
        uint256 id = souls.mint(alice, ROOT_1, "ipfs://mock");

        uint256 aliceBalBefore = alice.balance;
        _sellTo(id, alice, bob, 1 ether, ROOT_2);

        // Alice is both seller and fineTuner, so she gets the full amount
        assertEq(alice.balance, aliceBalBefore + 1 ether, "Seller-fineTuner should receive full price");
    }

    /// @notice Minting with bps > 1000 reverts.
    function test_max_royalty_capped() public {
        vm.expectRevert(SoulNFT.RoyaltyTooHigh.selector);
        souls.mint(alice, ROOT_1, "ipfs://mock", 1001);
    }

    /// @notice Mint with bps=500, verify 5% royalty paid on secondary sale.
    function test_custom_royalty_bps() public {
        // Alice mints with 500 bps = 5%
        uint256 id = souls.mint(alice, ROOT_1, "ipfs://mock", 500);

        // Verify royalty info
        (address fineTuner, uint96 bps) = souls.getRoyaltyInfo(id);
        assertEq(fineTuner, alice);
        assertEq(bps, 500);

        // First sale: Alice -> Bob (no self-royalty)
        _sellTo(id, alice, bob, 1 ether, ROOT_2);

        // Second sale: Bob -> Carol at 4 ether
        uint256 aliceBalBefore = alice.balance;
        uint256 bobBalBefore = bob.balance;
        _sellTo(id, bob, carol, 4 ether, ROOT_3);

        // Alice gets 5% of 4 ether = 0.2 ether
        assertEq(alice.balance, aliceBalBefore + 0.2 ether, "Alice should receive 5% royalty");
        assertEq(bob.balance, bobBalBefore + 3.8 ether, "Bob should receive sale price minus royalty");
    }
}
