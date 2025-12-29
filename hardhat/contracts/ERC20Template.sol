// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title SimpleERC20
 * @dev Minimal ERC20 token for Arc Testnet deployment
 * Constructor mints initial supply to deployer
 */
contract SimpleERC20 is ERC20 {
    /**
     * @param name Token name (e.g., "My Token")
     * @param symbol Token symbol (e.g., "MTK")
     * @param initialSupply Initial supply (in wei, e.g., 1000000 * 10**18 for 1M tokens)
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }
}
