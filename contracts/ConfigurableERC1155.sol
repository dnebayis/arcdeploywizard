// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

/**
 * @title ConfigurableERC1155
 * @dev Multi-token standard contract with configurable features
 * All features are set at deployment and are immutable
 */
contract ConfigurableERC1155 is ERC1155, Ownable, ERC1155Pausable, ERC1155Burnable, ERC1155Supply {
    
    // Immutable feature flags
    bool public immutable mintable;
    bool public immutable burnable;
    bool public immutable pausable;
    
    // Minting access control
    enum MintAccessMode { OnlyOwner, Public, PublicWithWalletLimit }
    MintAccessMode public immutable mintAccessMode;
    uint256 public immutable walletMintLimit;
    
    // Supply management
    uint256 public immutable maxSupplyPerToken;
    
    // Tracking
    mapping(address => uint256) public walletMintCount;
    mapping(uint256 => uint256) public tokenMaxSupply;
    
    // Metadata
    string public name;
    
    // Events
    event TokenMinted(address indexed to, uint256 indexed tokenId, uint256 amount);
    event TokenBatchMinted(address indexed to, uint256[] tokenIds, uint256[] amounts);
    event MaxSupplySet(uint256 indexed tokenId, uint256 maxSupply);
    
    // Errors
    error MintingDisabled();
    error BurningDisabled();
    error PausingDisabled();
    error UnauthorizedMinter();
    error WalletLimitExceeded();
    error MaxSupplyExceeded();
    error InvalidAmount();
    
    constructor(
        string memory _name,
        string memory _uri,
        address _owner,
        bool _mintable,
        bool _burnable,
        bool _pausable,
        MintAccessMode _mintAccessMode,
        uint256 _walletMintLimit,
        uint256 _maxSupplyPerToken
    ) ERC1155(_uri) Ownable(_owner) {
        name = _name;
        mintable = _mintable;
        burnable = _burnable;
        pausable = _pausable;
        mintAccessMode = _mintAccessMode;
        walletMintLimit = _walletMintLimit;
        maxSupplyPerToken = _maxSupplyPerToken;
    }
    
    /**
     * @dev Mint tokens to an address
     */
    function mint(
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes memory data
    ) public {
        if (!mintable) revert MintingDisabled();
        
        // Check minting access
        if (mintAccessMode == MintAccessMode.OnlyOwner) {
            if (msg.sender != owner()) revert UnauthorizedMinter();
        } else if (mintAccessMode == MintAccessMode.PublicWithWalletLimit) {
            walletMintCount[msg.sender] += amount;
            if (walletMintCount[msg.sender] > walletMintLimit) {
                revert WalletLimitExceeded();
            }
        }
        // MintAccessMode.Public has no restrictions
        
        // Check supply limits
        if (maxSupplyPerToken > 0) {
            if (totalSupply(tokenId) + amount > maxSupplyPerToken) {
                revert MaxSupplyExceeded();
            }
        }
        
        // Check token-specific max supply if set
        if (tokenMaxSupply[tokenId] > 0) {
            if (totalSupply(tokenId) + amount > tokenMaxSupply[tokenId]) {
                revert MaxSupplyExceeded();
            }
        }
        
        _mint(to, tokenId, amount, data);
        emit TokenMinted(to, tokenId, amount);
    }
    
    /**
     * @dev Batch mint tokens
     */
    function mintBatch(
        address to,
        uint256[] memory tokenIds,
        uint256[] memory amounts,
        bytes memory data
    ) public {
        if (!mintable) revert MintingDisabled();
        
        // Check minting access
        if (mintAccessMode == MintAccessMode.OnlyOwner) {
            if (msg.sender != owner()) revert UnauthorizedMinter();
        } else if (mintAccessMode == MintAccessMode.PublicWithWalletLimit) {
            uint256 totalAmount = 0;
            for (uint256 i = 0; i < amounts.length; i++) {
                totalAmount += amounts[i];
            }
            walletMintCount[msg.sender] += totalAmount;
            if (walletMintCount[msg.sender] > walletMintLimit) {
                revert WalletLimitExceeded();
            }
        }
        
        // Check supply limits
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (maxSupplyPerToken > 0) {
                if (totalSupply(tokenIds[i]) + amounts[i] > maxSupplyPerToken) {
                    revert MaxSupplyExceeded();
                }
            }
            if (tokenMaxSupply[tokenIds[i]] > 0) {
                if (totalSupply(tokenIds[i]) + amounts[i] > tokenMaxSupply[tokenIds[i]]) {
                    revert MaxSupplyExceeded();
                }
            }
        }
        
        _mintBatch(to, tokenIds, amounts, data);
        emit TokenBatchMinted(to, tokenIds, amounts);
    }
    
    /**
     * @dev Set max supply for a specific token ID (owner only)
     */
    function setTokenMaxSupply(uint256 tokenId, uint256 maxSupply) external onlyOwner {
        if (maxSupply > 0 && totalSupply(tokenId) > maxSupply) {
            revert MaxSupplyExceeded();
        }
        tokenMaxSupply[tokenId] = maxSupply;
        emit MaxSupplySet(tokenId, maxSupply);
    }
    
    /**
     * @dev Update the base URI
     */
    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }
    
    /**
     * @dev Pause all token transfers
     */
    function pause() external onlyOwner {
        if (!pausable) revert PausingDisabled();
        _pause();
    }
    
    /**
     * @dev Unpause all token transfers
     */
    function unpause() external onlyOwner {
        if (!pausable) revert PausingDisabled();
        _unpause();
    }
    
    /**
     * @dev Override burn to check if burning is enabled
     */
    function burn(
        address account,
        uint256 id,
        uint256 value
    ) public override {
        if (!burnable) revert BurningDisabled();
        super.burn(account, id, value);
    }
    
    /**
     * @dev Override burnBatch to check if burning is enabled
     */
    function burnBatch(
        address account,
        uint256[] memory ids,
        uint256[] memory values
    ) public override {
        if (!burnable) revert BurningDisabled();
        super.burnBatch(account, ids, values);
    }
    
    // Required overrides for multiple inheritance
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual override(ERC1155, ERC1155Pausable, ERC1155Supply) {
        super._update(from, to, ids, values);
    }
}
