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

    error NotLockedOnSource();
    error HasNoTokens();

    //tokenId => owner
    mapping(uint256 => address) public lockedBy;

    //all tokens that currently locked by user
    mapping(address => uint256[]) public lockedTokenIdsByUser;

    constructor(IOracle _oracle, IBixosPalmIslandServerNft _nft) {
        oracle = _oracle;
        nft = _nft;
    }

    //SEND TO SKALE
    function lock(uint256 tokenId) external {
        nft.transferFrom(msg.sender, address(this), tokenId);
        emit TokenLocked(tokenId, msg.sender);
        lockedBy[tokenId] = msg.sender;
        lockedTokenIdsByUser[msg.sender].push(tokenId);
    }

    //SEND TO BNB
    function unlock(
        IOracle.OracleResponse memory response
    ) external onlyValidResponse(response) {
        string memory senderStr = Strings.toHexString(uint160(msg.sender), 20);
        if (
            keccak256(bytes(senderStr)) !=
            keccak256(
                bytes(string.concat("0x", substring(response.rslts[0], 26, 66)))
            )
        ) revert NotLockedOnSource();

        uint256[] memory userTokens = lockedTokenIdsByUser[msg.sender];

        if (userTokens.length == 0) revert HasNoTokens();

        //remove last token which user locked
        lockedTokenIdsByUser[msg.sender].pop();

        //send this nft to user, unlocked
        nft.transferFrom(
            msg.sender,
            address(this),
            userTokens[userTokens.length - 1]
        );
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
}
