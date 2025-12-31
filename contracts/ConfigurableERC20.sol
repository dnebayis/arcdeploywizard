// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ConfigurableERC20
 * @dev ERC20 token with deploy-time feature configuration
 * All behavior is determined at deployment and is immutable
 */
contract ConfigurableERC20 is ERC20, Ownable {
    bool public immutable mintable;
    bool public immutable burnable;
    bool public immutable pausable;
    uint256 public immutable maxSupply;
    
    bool private _paused;
    
    error TokenPaused();
    error MintingDisabled();
    error BurningDisabled();
    error MaxSupplyExceeded();
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner,
        bool _mintable,
        bool _burnable,
        bool _pausable,
        uint256 _maxSupply
    ) ERC20(name, symbol) Ownable(owner) {
        mintable = _mintable;
        burnable = _burnable;
        pausable = _pausable;
        maxSupply = _maxSupply;
        
        if (initialSupply > 0) {
            if (_maxSupply > 0 && initialSupply > _maxSupply) {
                revert MaxSupplyExceeded();
            }
            _mint(owner, initialSupply);
        }
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        if (!mintable) revert MintingDisabled();
        if (pausable && _paused) revert TokenPaused();
        if (maxSupply > 0 && totalSupply() + amount > maxSupply) {
            revert MaxSupplyExceeded();
        }
        _mint(to, amount);
    }
    
    function burn(uint256 amount) external {
        if (!burnable) revert BurningDisabled();
        if (pausable && _paused) revert TokenPaused();
        _burn(msg.sender, amount);
    }
    
    function pause() external onlyOwner {
        require(pausable, "Pausing disabled");
        _paused = true;
    }
    
    function unpause() external onlyOwner {
        require(pausable, "Pausing disabled");
        _paused = false;
    }
    
    function paused() external view returns (bool) {
        return pausable && _paused;
    }
    
    function _update(address from, address to, uint256 value) internal virtual override {
        if (pausable && _paused && from != address(0)) {
            revert TokenPaused();
        }
        super._update(from, to, value);
    }
}
