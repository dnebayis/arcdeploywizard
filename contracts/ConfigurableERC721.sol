// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ConfigurableERC721
 * @dev ERC721 NFT with deploy-time feature configuration
 * All behavior is determined at deployment and is immutable
 */
contract ConfigurableERC721 is ERC721, Ownable {
    enum MintAccessMode {
        OnlyOwner,
        Public,
        PublicWithWalletLimit
    }
    
    uint256 private _tokenIdCounter;
    bool private _paused;
    
    bool public immutable burnable;
    bool public immutable pausable;
    uint256 public immutable maxSupply;
    uint256 public immutable walletMintLimit;
    MintAccessMode public immutable mintAccessMode;
    
    string private constant SHARED_METADATA_URI = "https://emerald-spotty-boar-761.mypinata.cloud/ipfs/bafybeic5wusdlmndycj6vbjigvle3qkdmbwbiqxtmn33m363dr6nd54q2i/metadata.json";
    
    mapping(address => uint256) private _walletMints;
    
    error TokenPaused();
    error BurningDisabled();
    error MaxSupplyReached();
    error WalletMintLimitReached();
    error MintingNotAllowed();
    
    constructor(
        string memory name,
        string memory symbol,
        address owner,
        bool _burnable,
        bool _pausable,
        uint256 _maxSupply,
        MintAccessMode _mintAccessMode,
        uint256 _walletMintLimit
    ) ERC721(name, symbol) Ownable(owner) {
        burnable = _burnable;
        pausable = _pausable;
        maxSupply = _maxSupply;
        mintAccessMode = _mintAccessMode;
        walletMintLimit = _walletMintLimit;
    }
    
    function mint() external returns (uint256) {
        if (pausable && _paused) revert TokenPaused();
        if (maxSupply > 0 && _tokenIdCounter >= maxSupply) revert MaxSupplyReached();
        
        if (mintAccessMode == MintAccessMode.OnlyOwner && msg.sender != owner()) {
            revert MintingNotAllowed();
        }
        
        if (mintAccessMode == MintAccessMode.PublicWithWalletLimit) {
            if (_walletMints[msg.sender] >= walletMintLimit) {
                revert WalletMintLimitReached();
            }
            _walletMints[msg.sender]++;
        }
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(msg.sender, tokenId);
        return tokenId;
    }
    
    function burn(uint256 tokenId) external {
        if (!burnable) revert BurningDisabled();
        if (pausable && _paused) revert TokenPaused();
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _burn(tokenId);
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
    
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
    
    function walletMints(address wallet) external view returns (uint256) {
        return _walletMints[wallet];
    }
    
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        return SHARED_METADATA_URI;
    }
    
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        if (pausable && _paused && from != address(0)) {
            revert TokenPaused();
        }
        return super._update(to, tokenId, auth);
    }
}
