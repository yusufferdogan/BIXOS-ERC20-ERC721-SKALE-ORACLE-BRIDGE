// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IBixosPalmIslandServerNft is IERC721 {
    function lockerMint(address user, uint256 tokenId) external;

    function burn(uint256 tokenId) external;
}
