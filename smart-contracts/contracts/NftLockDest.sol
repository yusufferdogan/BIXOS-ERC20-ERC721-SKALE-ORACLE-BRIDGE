// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "./BixosPalmIslandServerNFt.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/IBixosPalmIslandServerNft.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

//DEPLOY ON SKALE
contract NftLockDest {
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
    event TokenBurned(uint256 indexed tokenId, address indexed owner);
    //received from skale
    event TokenMinted(uint256 indexed tokenId, address indexed owner);

    error NotLockedOnSource();

    mapping(uint256 => address) public burnedBy;

    constructor(IOracle _oracle, IBixosPalmIslandServerNft _nft) {
        oracle = _oracle;
        nft = _nft;
    }

    //SEND TO BNB
    function lock(uint256 tokenId) external {
        nft.burn(tokenId);
        emit TokenBurned(tokenId, msg.sender);
        burnedBy[tokenId] = msg.sender;
    }

    //RECEIVE FROM BNB
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

        nft.lockerMint(msg.sender);
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
