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
    //sent to skale
    event TokenLocked(uint256 indexed tokenId, address indexed owner);
    //received from skale
    event TokenUnLocked(uint256 indexed tokenId, address indexed owner);

    mapping(uint256 => address) public lockedBy;

    constructor(IOracle _oracle, IBixosPalmIslandServerNft _nft) {
        oracle = _oracle;
        nft = _nft;
    }

    //SEND TO SKALE
    function lock(uint256 tokenId) external {
        nft.transferFrom(msg.sender, address(this), tokenId);
        emit TokenLocked(tokenId, msg.sender);
        lockedBy[tokenId] = msg.sender;
    }

    //SEND TO BNB
    function unlock(
        IOracle.OracleResponse memory response
    ) external onlyValidResponse(response) {}
}
