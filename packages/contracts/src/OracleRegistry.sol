// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IOracle.sol";

/**
 * @title OracleRegistry
 * @notice Maintains a list of oracle addresses authorized to complete soul drifts.
 *         For the hackathon MVP, we register ONE oracle (the off-chain service in
 *         packages/oracle). In production this would be governed.
 */
contract OracleRegistry is IOracleRegistry, Ownable {
    mapping(address => bool) private _trusted;

    event OracleAdded(address indexed oracle);
    event OracleRemoved(address indexed oracle);

    error NotTrusted();
    error AlreadyTrusted();

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Owner adds a trusted oracle.
    function addOracle(address oracle) external onlyOwner {
        if (_trusted[oracle]) revert AlreadyTrusted();
        _trusted[oracle] = true;
        emit OracleAdded(oracle);
    }

    /// @notice Owner removes a trusted oracle.
    function removeOracle(address oracle) external onlyOwner {
        if (!_trusted[oracle]) revert NotTrusted();
        _trusted[oracle] = false;
        emit OracleRemoved(oracle);
    }

    /// @notice Check if an address is a trusted oracle.
    function isTrustedOracle(address candidate) external view override returns (bool) {
        return _trusted[candidate];
    }
}
