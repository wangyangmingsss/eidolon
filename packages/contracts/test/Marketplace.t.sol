// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/SoulNFT.sol";
import "../src/Marketplace.sol";
import "../src/OracleRegistry.sol";

contract MarketplaceTest is Test {
    SoulNFT internal souls;
    Marketplace internal market;
    OracleRegistry internal registry;

    address internal admin = address(0xA100);
    address internal alice = address(0xA000);
    address internal bob = address(0xB000);
    uint256 internal oraclePk = 0xBEEF;
    address internal oracleAddr;

    bytes32 internal constant ROOT_1 = bytes32(uint256(0x1));
    bytes32 internal constant ROOT_2 = bytes32(uint256(0x2));

    function setUp() public {
        oracleAddr = vm.addr(oraclePk);
        vm.startPrank(admin);
        registry = new OracleRegistry(admin);
        registry.addOracle(oracleAddr);
        souls = new SoulNFT("Eidolon Souls", "SOUL", registry, admin);
        market = new Marketplace(souls);
        vm.stopPrank();
        vm.deal(bob, 10 ether);
    }

    function _mintAndApprove(address to, bytes32 root) internal returns (uint256 id) {
        id = souls.mint(to, root, "ipfs://mock");
        vm.prank(to);
        souls.setApprovalForAll(address(market), true);
    }

    function test_listAndBuy_escrowsAndRequestsDrift() public {
        uint256 id = _mintAndApprove(alice, ROOT_1);

        vm.prank(alice);
        market.list(id, 1 ether);

        vm.prank(bob);
        market.buy{value: 1 ether}(id);

        (address to, bool active) = souls.pendingDrift(id);
        assertEq(to, bob);
        assertTrue(active);

        (address buyer, uint128 amount) = market.escrows(id);
        assertEq(buyer, bob);
        assertEq(amount, 1 ether);
    }

    function test_settle_paysSellerAfterDriftCompletes() public {
        uint256 id = _mintAndApprove(alice, ROOT_1);

        vm.prank(alice);
        market.list(id, 1 ether);

        vm.prank(bob);
        market.buy{value: 1 ether}(id);

        // Oracle completes drift
        uint256 nonce = souls.driftNonce(id);
        bytes32 digest = keccak256(abi.encode(block.chainid, address(souls), id, bob, ROOT_2, nonce));
        bytes32 ethSigned = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(oraclePk, ethSigned);
        souls.completeDrift(id, bob, ROOT_2, "ipfs://new", nonce, abi.encodePacked(r, s, v));

        uint256 aliceBalBefore = alice.balance;
        market.settle(id);
        assertEq(alice.balance, aliceBalBefore + 1 ether);
    }
}
