// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {EventTicketing} from "../src/EventTicketing.sol";

contract DeployEventTicketing is Script {
    function run() external {
        address admin = vm.envAddress("ADMIN");
        vm.startBroadcast();
        EventTicketing ticketing = new EventTicketing(admin);
        vm.stopBroadcast();
        console.log("EventTicketing deployed at:", address(ticketing));
    }
}