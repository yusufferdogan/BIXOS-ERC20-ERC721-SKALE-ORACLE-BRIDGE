// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./interfaces/IClaimableToken.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IOracle.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

error AlreadyClaimed(address attemptedClaimer);

contract Claim {
    using SafeERC20 for IClaimableToken;

    mapping(address => bool) public claimed;

    IOracle public oracle;
    IClaimableToken public token;

    event LogParams(string sender);
    event LogParams(bytes sender);
    event LogParams(address sender);

    modifier onlyValidResponse(IOracle.OracleResponse memory response) {
        require(
            oracle.verifyOracleResponse(response),
            "Invalid Oracle Response"
        );
        _;
    }

    event ClaimTokens(address indexed claimer);

    constructor(IOracle _oracle, IClaimableToken _token) {
        oracle = _oracle;
        token = _token;
    }

    function claim(
        IOracle.OracleResponse memory response
    ) external onlyValidResponse(response) {
        //EXTRACT ADDRESS FROM response.rslts[0] AND MINT TO THIS
        //token.mint(msg.sender);

        emit LogParams(response.rslts[0]);
        // bytes memory byt = bytes(response.rslts[0]);
        // bytes memory strBytes = bytes(abi.decode(byt, (string)));
        // emit LogParams(response.rslts[0]);
    }
}
