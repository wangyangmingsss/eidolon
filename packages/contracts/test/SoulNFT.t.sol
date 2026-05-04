// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/SoulNFT.sol";
import "../src/OracleRegistry.sol";

contract SoulNFTTest is Test {
    SoulNFT internal souls;
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
        vm.stopPrank();
    }

    function _mintTo(address to, bytes32 root) internal returns (uint256) {
        return souls.mint(to, root, "ipfs://mock");
    }

    function test_mint_storesRoot() public {
        uint256 id = _mintTo(alice, ROOT_1);
        assertEq(souls.ownerOf(id), alice);
        assertEq(souls.metadataRootOf(id), ROOT_1);
    }

    function test_updateMetadata_onlyOwner() public {
        uint256 id = _mintTo(alice, ROOT_1);
        vm.prank(alice);
        souls.updateMetadata(id, ROOT_2, "ipfs://mock2");
        assertEq(souls.metadataRootOf(id), ROOT_2);
    }

    function test_updateMetadata_revertsForNonOwner() public {
        uint256 id = _mintTo(alice, ROOT_1);
        vm.prank(bob);
        vm.expectRevert(SoulNFT.NotOwnerNorApproved.selector);
        souls.updateMetadata(id, ROOT_2, "ipfs://mock2");
    }

    function test_directTransfer_isBlocked() public {
        uint256 id = _mintTo(alice, ROOT_1);
        vm.prank(alice);
        vm.expectRevert(SoulNFT.TokenLocked.selector);
        souls.transferFrom(alice, bob, id);
    }

    function test_drift_happyPath() public {
        uint256 id = _mintTo(alice, ROOT_1);

        vm.prank(alice);
        souls.requestDrift(id, bob);

        (address pendingTo, bool active) = souls.pendingDrift(id);
        assertEq(pendingTo, bob);
        assertTrue(active);

        uint256 nonce = souls.driftNonce(id);
        bytes32 digest = keccak256(abi.encode(block.chainid, address(souls), id, bob, ROOT_2, nonce));
        bytes32 ethSigned = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(oraclePk, ethSigned);
        bytes memory sig = abi.encodePacked(r, s, v);

        souls.completeDrift(id, bob, ROOT_2, "ipfs://new", nonce, sig);

        assertEq(souls.ownerOf(id), bob);
        assertEq(souls.metadataRootOf(id), ROOT_2);
        assertEq(souls.driftNonce(id), nonce + 1);
    }

    function test_drift_revertsOnReplay() public {
        uint256 id = _mintTo(alice, ROOT_1);
        vm.prank(alice);
        souls.requestDrift(id, bob);

        uint256 nonce = souls.driftNonce(id);
        bytes32 digest = keccak256(abi.encode(block.chainid, address(souls), id, bob, ROOT_2, nonce));
        bytes32 ethSigned = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(oraclePk, ethSigned);
        bytes memory sig = abi.encodePacked(r, s, v);

        souls.completeDrift(id, bob, ROOT_2, "ipfs://new", nonce, sig);

        vm.prank(bob);
        souls.requestDrift(id, alice);
        vm.expectRevert(SoulNFT.NonceMismatch.selector);
        souls.completeDrift(id, alice, ROOT_2, "ipfs://new", nonce, sig);
    }

    function test_drift_revertsOnUntrustedOracle() public {
        uint256 id = _mintTo(alice, ROOT_1);
        vm.prank(alice);
        souls.requestDrift(id, bob);

        uint256 fakePk = 0xDEAD;
        uint256 nonce = souls.driftNonce(id);
        bytes32 digest = keccak256(abi.encode(block.chainid, address(souls), id, bob, ROOT_2, nonce));
        bytes32 ethSigned = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(fakePk, ethSigned);
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.expectRevert(SoulNFT.NotTrustedOracle.selector);
        souls.completeDrift(id, bob, ROOT_2, "ipfs://new", nonce, sig);
    }
}
