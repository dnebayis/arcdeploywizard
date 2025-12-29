// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleERC721
 * @dev Minimal ERC721 NFT collection for Arc Testnet deployment
 * Implements public minting with auto-incrementing token IDs
 */
contract SimpleERC721 is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    string private _baseTokenURI;

    /**
     * @param name Collection name (e.g., "My NFT Collection")
     * @param symbol Collection symbol (e.g., "MNFT")
     * @param baseURI Base URI for token metadata (e.g., "ipfs://...")
     */
    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseURI;
    }

    /**
     * @dev Public mint function - anyone can mint
     * @return tokenId The minted token ID
     */
    function mint() public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(msg.sender, tokenId);
        return tokenId;
    }

    /**
     * @dev Base URI for computing tokenURI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Update base URI (only owner)
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
}
