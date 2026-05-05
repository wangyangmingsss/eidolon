// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC7857.sol";
import "./interfaces/IOracle.sol";

/**
 * @title SoulNFT — Eidolon's ERC-7857 implementation
 * @notice Souls are AI agents tokenized as iNFTs. Their "intelligence"
 *         (personality + memory) lives encrypted in 0G Storage; the contract
 *         stores only a root hash and a hint URL.
 *
 *         The novel part vs ERC-721 is `requestDrift` + `completeDrift`:
 *         transfers go through an oracle that re-encrypts metadata for the
 *         new owner inside its own TEE. Without this, the new owner would
 *         get a token that points to data they cannot decrypt.
 */
contract SoulNFT is IERC7857, ERC721, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IOracleRegistry public immutable oracleRegistry;

    uint256 private _nextTokenId;

    // tokenId -> encrypted metadata root hash on 0G Storage
    mapping(uint256 => bytes32) private _metadataRoot;
    // tokenId -> URI hint for retrieval (e.g., indexer URL + path)
    mapping(uint256 => string) private _encryptedURI;

    // ─── Royalty ─────────────────────────────────────────────────────────
    struct RoyaltyInfo {
        address fineTuner;
        uint96 royaltyBps;
    }
    mapping(uint256 => RoyaltyInfo) public royaltyInfo;

    event RoyaltySet(uint256 indexed tokenId, address indexed fineTuner, uint96 bps);

    error RoyaltyTooHigh();

    // Pending drift state (after requestDrift, before completeDrift)
    struct Pending {
        address to;
        bool active;
    }
    mapping(uint256 => Pending) private _pending;

    // Replay-protection nonce per token
    mapping(uint256 => uint256) public driftNonce;

    error NotOwnerNorApproved();
    error InvalidRoot();
    error PendingDriftAlreadyActive();
    error NoPendingDrift();
    error NotTrustedOracle();
    error InvalidOracleSignature();
    error NonceMismatch();
    error TokenLocked();

    modifier onlyOwnerOrApproved(uint256 tokenId) {
        address owner = ownerOf(tokenId);
        if (msg.sender != owner && !isApprovedForAll(owner, msg.sender) && getApproved(tokenId) != msg.sender) {
            revert NotOwnerNorApproved();
        }
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        IOracleRegistry registry_,
        address initialOwner
    ) ERC721(name_, symbol_) Ownable(initialOwner) {
        oracleRegistry = registry_;
    }

    // ─── Mint ────────────────────────────────────────────────────────────

    /// @inheritdoc IERC7857
    /// @dev Defaults to 250 bps (2.5%) royalty for the minter.
    function mint(
        address to,
        bytes32 metadataRoot,
        string calldata encryptedURI
    ) external override returns (uint256 tokenId) {
        return this.mint(to, metadataRoot, encryptedURI, 250);
    }

    /// @notice Mint with explicit royalty basis points.
    function mint(
        address to,
        bytes32 metadataRoot,
        string calldata encryptedURI,
        uint96 royaltyBps
    ) external returns (uint256 tokenId) {
        if (metadataRoot == bytes32(0)) revert InvalidRoot();
        tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);
        _metadataRoot[tokenId] = metadataRoot;
        _encryptedURI[tokenId] = encryptedURI;
        _setRoyalty(tokenId, to, royaltyBps);
        emit SoulMinted(tokenId, to, metadataRoot);
    }

    // ─── Royalty internals ──────────────────────────────────────────────

    function _setRoyalty(uint256 tokenId, address fineTuner, uint96 bps) internal {
        if (bps > 1000) revert RoyaltyTooHigh();
        royaltyInfo[tokenId] = RoyaltyInfo({fineTuner: fineTuner, royaltyBps: bps});
        emit RoyaltySet(tokenId, fineTuner, bps);
    }

    /// @notice Returns the royalty info for a Soul.
    function getRoyaltyInfo(uint256 tokenId) external view returns (address fineTuner, uint96 royaltyBps) {
        RoyaltyInfo memory info = royaltyInfo[tokenId];
        return (info.fineTuner, info.royaltyBps);
    }

    // ─── Update (after gameplay) ─────────────────────────────────────────

    /// @inheritdoc IERC7857
    /// @dev Callable only when no pending drift is active.
    function updateMetadata(
        uint256 tokenId,
        bytes32 newRoot,
        string calldata newEncryptedURI
    ) external override onlyOwnerOrApproved(tokenId) {
        if (_pending[tokenId].active) revert TokenLocked();
        if (newRoot == bytes32(0)) revert InvalidRoot();
        bytes32 old = _metadataRoot[tokenId];
        _metadataRoot[tokenId] = newRoot;
        _encryptedURI[tokenId] = newEncryptedURI;
        emit MetadataUpdated(tokenId, old, newRoot);
    }

    // ─── Drift ───────────────────────────────────────────────────────────

    /// @inheritdoc IERC7857
    /// @dev Marketplace calls this on behalf of the buyer. Locks the token.
    function requestDrift(uint256 tokenId, address to) external override onlyOwnerOrApproved(tokenId) {
        if (_pending[tokenId].active) revert PendingDriftAlreadyActive();
        _pending[tokenId] = Pending({to: to, active: true});
        emit DriftRequested(tokenId, ownerOf(tokenId), to);
    }

    /// @inheritdoc IERC7857
    function completeDrift(
        uint256 tokenId,
        address newOwner,
        bytes32 newMetadataRoot,
        string calldata newEncryptedURI,
        uint256 nonce,
        bytes calldata oracleSignature
    ) external override {
        Pending memory p = _pending[tokenId];
        if (!p.active) revert NoPendingDrift();
        if (p.to != newOwner) revert NoPendingDrift();
        if (newMetadataRoot == bytes32(0)) revert InvalidRoot();
        if (nonce != driftNonce[tokenId]) revert NonceMismatch();

        // Verify oracle signature: signs (chainid, contract, tokenId, newOwner, newRoot, nonce)
        bytes32 hash = keccak256(abi.encode(block.chainid, address(this), tokenId, newOwner, newMetadataRoot, nonce))
            .toEthSignedMessageHash();
        address signer = hash.recover(oracleSignature);
        if (!oracleRegistry.isTrustedOracle(signer)) revert NotTrustedOracle();

        // Bump nonce, clear pending
        driftNonce[tokenId] = nonce + 1;
        delete _pending[tokenId];

        // Store old root for event
        bytes32 oldRoot = _metadataRoot[tokenId];
        _metadataRoot[tokenId] = newMetadataRoot;
        _encryptedURI[tokenId] = newEncryptedURI;

        // Use _update to bypass the standard transfer auth (we've authorized via oracle sig)
        _update(newOwner, tokenId, address(0));

        emit DriftCompleted(tokenId, newOwner, newMetadataRoot);
        emit MetadataUpdated(tokenId, oldRoot, newMetadataRoot);
    }

    // ─── View ────────────────────────────────────────────────────────────

    /// @notice Returns the metadata root hash for a Soul.
    function metadataRootOf(uint256 tokenId) external view override returns (bytes32) {
        _requireOwned(tokenId);
        return _metadataRoot[tokenId];
    }

    /// @notice Returns the encrypted URI for a Soul.
    function encryptedURIOf(uint256 tokenId) external view override returns (string memory) {
        _requireOwned(tokenId);
        return _encryptedURI[tokenId];
    }

    /// @notice Returns the pending drift state for a Soul.
    function pendingDrift(uint256 tokenId) external view override returns (address to, bool active) {
        Pending memory p = _pending[tokenId];
        return (p.to, p.active);
    }

    // ─── Lock semantics: block direct transfers (force oracle path) ───

    /// @dev Override to BLOCK ERC-721 standard transfers entirely. Souls can ONLY
    ///      change hands via the drift mechanism. This is the core ERC-7857 invariant.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        // Allow mint (from == 0) and burn (to == 0) and oracle-driven transfers (auth == 0).
        // Block ALL externally-initiated transfers (auth != 0 means caller-supplied).
        if (from != address(0) && to != address(0) && auth != address(0)) {
            revert TokenLocked();
        }
        return super._update(to, tokenId, auth);
    }
}
