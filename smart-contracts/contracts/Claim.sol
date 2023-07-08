// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./interfaces/IClaimableToken.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IOracle.sol";

error AlreadyClaimed(address attemptedClaimer);

contract Claim {

    using SafeERC20 for IClaimableToken;
    
    mapping(address => bool) public claimed;

    IOracle public oracle;
    IClaimableToken public token;

    modifier onlyValidResponse(IOracle.OracleResponse memory response) {
        require(oracle.verifyOracleResponse(response), "Invalid Oracle Response");
        _;
    }

    event ClaimTokens(address indexed claimer);

    constructor(
        IOracle _oracle,
        IClaimableToken _token
    ) {
        oracle = _oracle;
        token = _token;
    }

    function claim(IOracle.OracleResponse memory response) external onlyValidResponse(response) {
        if (claimed[msg.sender])
           revert AlreadyClaimed({
               attemptedClaimer: msg.sender
           });

        claimed[msg.sender] = true;
        token.mint(msg.sender);

        emit ClaimTokens(msg.sender);
    }

}
