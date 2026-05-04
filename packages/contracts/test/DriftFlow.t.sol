// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/SoulNFT.sol";
import "../src/Marketplace.sol";
import "../src/OracleRegistry.sol";

contract DriftFlowTest is Test {
    SoulNFT souls;
    Marketplace market;
    OracleRegistry registry;
    address admin = address(0xA100);
    address alice = address(0xA000);
    address bob = address(0xB000);
    uint256 oraclePk = 0xBEEF;
    address oracleAddr;

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

    /// @notice Full happy path: Alice mints → lists → Bob buys → oracle completes → settle pays Alice.
    function test_fullDriftFlow() public {
        // 1. Alice mints
        uint256 id = souls.mint(alice, bytes32(uint256(0xA1A1)), "ipfs://alice-soul");
        assertEq(souls.ownerOf(id), alice);

        // 2. Alice approves Marketplace
        vm.prank(alice);
        souls.setApprovalForAll(address(market), true);

        // 3. Alice lists for 1 OG
        vm.prank(alice);
        market.list(id, 1 ether);

        // 4. Bob buys
        vm.prank(bob);
        market.buy{value: 1 ether}(id);

        // Drift is now pending
        assertEq(souls.ownerOf(id), alice);
        (address pendingTo, bool active) = souls.pendingDrift(id);
        assertEq(pendingTo, bob);
        assertTrue(active);

        // 5. Oracle re-encrypts and completes
        bytes32 newRoot = bytes32(uint256(0xB0B0));
        uint256 nonce = souls.driftNonce(id);
        bytes32 digest = keccak256(abi.encode(block.chainid, address(souls), id, bob, newRoot, nonce));
        bytes32 ethSigned = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(oraclePk, ethSigned);
        souls.completeDrift(id, bob, newRoot, "ipfs://bob-soul", nonce, abi.encodePacked(r, s, v));

        // 6. Bob now owns the soul with new root
        assertEq(souls.ownerOf(id), bob);
        assertEq(souls.metadataRootOf(id), newRoot);

        // 7. Settle releases escrow
        uint256 aliceBefore = alice.balance;
        market.settle(id);
        assertEq(alice.balance, aliceBefore + 1 ether);
    }
}
