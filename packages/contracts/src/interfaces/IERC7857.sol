// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title IERC7857 - Intelligent NFT Standard
 * @notice Adapted from 0G Labs ERC-7857 reference. Encrypted metadata + oracle-mediated transfer.
 * @dev Eidolon's interpretation: SoulNFT implements this. Encrypted metadata = the Soul's
 *      personality + memory blob, stored in 0G Storage and pointed to by `metadataRoot`.
 */
interface IERC7857 {
    /// @notice Emitted on a fresh mint.
    event SoulMinted(uint256 indexed tokenId, address indexed owner, bytes32 metadataRoot);

    /// @notice Emitted whenever the owner re-uploads new encrypted metadata (e.g., after gameplay).
    event MetadataUpdated(uint256 indexed tokenId, bytes32 oldRoot, bytes32 newRoot);

    /// @notice Emitted when a buyer initiates a transfer; oracle must complete it.
    event DriftRequested(uint256 indexed tokenId, address indexed from, address indexed to);

    /// @notice Emitted when oracle finishes re-encryption and transfers ownership.
    event DriftCompleted(uint256 indexed tokenId, address indexed newOwner, bytes32 newMetadataRoot);

    /// @notice Mint a new Soul.
    /// @param to            Initial owner.
    /// @param metadataRoot  0G Storage root hash of the encrypted metadata blob.
    /// @param encryptedURI  Indexer URL or hint for metadata retrieval.
    /// @return tokenId      The newly minted token ID.
    function mint(
        address to,
        bytes32 metadataRoot,
        string calldata encryptedURI
    ) external returns (uint256 tokenId);

    /// @notice Owner updates their Soul's metadata root after gameplay.
    function updateMetadata(uint256 tokenId, bytes32 newRoot, string calldata newEncryptedURI) external;

    /// @notice Anyone (typically Marketplace) requests a drift to `to`.
    /// @dev    Locks the token. Oracle must call `completeDrift` to finalize.
    function requestDrift(uint256 tokenId, address to) external;

    /// @notice Oracle finalizes drift after re-encrypting metadata for the new owner.
    /// @param oracleSignature  Signature over (tokenId, newOwner, newMetadataRoot, nonce).
    function completeDrift(
        uint256 tokenId,
        address newOwner,
        bytes32 newMetadataRoot,
        string calldata newEncryptedURI,
        uint256 nonce,
        bytes calldata oracleSignature
    ) external;

    /// @notice Read accessors.
    function metadataRootOf(uint256 tokenId) external view returns (bytes32);
    function encryptedURIOf(uint256 tokenId) external view returns (string memory);
    function pendingDrift(uint256 tokenId) external view returns (address to, bool active);
}
