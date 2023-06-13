// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./interfaces/IClaimableToken.sol";

contract ClaimableToken is ERC20, ERC20Burnable, IClaimableToken, AccessControl {
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant CLAIM_ROLE = keccak256("CLAIM_ROLE");

    uint256 public claimAmount;

    event SetClaimAmount(uint256 indexed amount);

    constructor() ERC20("ClaimableToken", "CLAIM") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(CLAIM_ROLE, msg.sender);

        claimAmount = 100 ether;
    }

    function mint(address to) public onlyRole(MINTER_ROLE) {
        _mint(to, claimAmount);
    }

    function setClaimAmount(uint256 amount) public onlyRole(CLAIM_ROLE) {
        claimAmount = amount;
        emit SetClaimAmount(amount);
    }
}
