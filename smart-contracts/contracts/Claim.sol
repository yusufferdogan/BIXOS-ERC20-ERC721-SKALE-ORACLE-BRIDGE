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
    event LogParams(bool isEq);

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

    function substring(
        string memory str,
        uint startIndex,
        uint endIndex
    ) public pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex - startIndex);
        for (uint i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }

    function claim(
        IOracle.OracleResponse memory response
    ) external onlyValidResponse(response) {
        //EXTRACT ADDRESS FROM response.rslts[0] AND MINT TO THIS
        //token.mint(msg.sender);

        string memory senderStr = Strings.toHexString(uint160(msg.sender), 20);
        emit LogParams(senderStr);

        emit LogParams(
            keccak256(bytes(senderStr)) ==
                keccak256(
                    bytes(
                        string.concat(
                            "0x",
                            substring(response.rslts[0], 26, 66)
                        )
                    )
                )
        );

        emit LogParams(substring(response.rslts[0], 26, 66));
        emit LogParams(response.rslts[0]);
        // bytes memory byt = bytes(response.rslts[0]);
        // bytes memory strBytes = bytes(abi.decode(byt, (string)));
        // emit LogParams(response.rslts[0]);
    }
}
