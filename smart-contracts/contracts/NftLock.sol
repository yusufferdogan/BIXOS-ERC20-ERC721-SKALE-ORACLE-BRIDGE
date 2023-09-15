// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "./BixosPalmIslandServerNFt.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/IBixosPalmIslandServerNft.sol";

//DEPLOY ON BNB CHAIN
contract NftLockSource {
    IOracle public oracle;
    IBixosPalmIslandServerNft public nft;

    modifier onlyValidResponse(IOracle.OracleResponse memory response) {
        require(
            oracle.verifyOracleResponse(response),
            "Invalid Oracle Response"
        );
        _;
    }

    event ClaimTokens(address indexed claimer);

    constructor(IOracle _oracle, IBixosPalmIslandServerNft _nft) {
        oracle = _oracle;
        nft = _nft;
    }

    //MEANS SENDING TO SKALE
    function lock() external {}

    //TRANSFER TO BNB
    function unlock() external {}
}
