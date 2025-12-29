// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleERC721
 * @dev Minimal ERC721 NFT with shared IPFS metadata
 * All tokens in this collection share the same metadata and image
 */
contract SimpleERC721 is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    
    // Shared metadata URI for ALL NFTs in this collection
    // This IPFS link contains the preview image and metadata
    string private constant SHARED_METADATA_URI = "https://emerald-spotty-boar-761.mypinata.cloud/ipfs/bafybeic5wusdlmndycj6vbjigvle3qkdmbwbiqxtmn33m363dr6nd54q2i/metadata.json";
    
    /**
     * @dev Constructor - only needs name and symbol
     * Metadata is preconfigured and shared across all NFTs
     */
    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(msg.sender) {}
    
    /**
     * @dev Public mint function - anyone can mint
     * Returns the token ID of the newly minted NFT
     */
    function mint() public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(msg.sender, tokenId);
        return tokenId;
    }
    
    /**
     * @dev Returns the total number of tokens minted
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Override tokenURI to return shared metadata
     * All tokens return the SAME metadata URI regardless of tokenId
     * This means all NFTs have the same image and attributes
     * 
     * @param tokenId - The token ID (ignored, all tokens share metadata)
     * @return string - The shared IPFS metadata URI
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        return SHARED_METADATA_URI;
    }
}
