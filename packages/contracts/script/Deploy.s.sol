// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/SoulNFT.sol";
import "../src/Marketplace.sol";
import "../src/OracleRegistry.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        // Oracle address may be the deployer itself for MVP, or a separate one
        address oracleAddr = vm.envOr("ORACLE_ADDRESS", deployer);

        vm.startBroadcast(deployerKey);

        OracleRegistry registry = new OracleRegistry(deployer);
        registry.addOracle(oracleAddr);

        SoulNFT souls = new SoulNFT("Eidolon Souls", "SOUL", registry, deployer);
        Marketplace market = new Marketplace(souls);

        vm.stopBroadcast();

        console.log("OracleRegistry:", address(registry));
        console.log("SoulNFT:        ", address(souls));
        console.log("Marketplace:    ", address(market));
        console.log("Oracle (added):", oracleAddr);

        // Write addresses to a JSON file the SDK reads
        string memory json = string(abi.encodePacked(
            "{\n",
            '  "OracleRegistry": "', vm.toString(address(registry)), '",\n',
            '  "SoulNFT": "', vm.toString(address(souls)), '",\n',
            '  "Marketplace": "', vm.toString(address(market)), '",\n',
            '  "Oracle": "', vm.toString(oracleAddr), '"\n',
            "}"
        ));
        string memory networkFile = vm.envOr("DEPLOY_NETWORK", string("testnet"));
        string memory outFile = string(abi.encodePacked("./addresses.", networkFile, ".json"));
        vm.writeFile(outFile, json);
    }
}
