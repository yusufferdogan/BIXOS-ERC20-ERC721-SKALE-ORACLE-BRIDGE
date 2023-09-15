// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IBixosPalmIslandServerNft is IERC721 {
    function mint(address to) external;
}
