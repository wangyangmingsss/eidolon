// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IOracleRegistry {
    function isTrustedOracle(address candidate) external view returns (bool);
}
