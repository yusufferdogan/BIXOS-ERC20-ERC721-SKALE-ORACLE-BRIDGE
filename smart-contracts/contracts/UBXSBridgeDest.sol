// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "./interfaces/IOracle.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

//DEPLOY ON SKALE
contract UBXSBridgeDest is Ownable {
    IOracle public oracle;
    IERC20 public ubxs;

    event Received(uint256 amount);
    event WithdrewRemaining(uint256 remaining);
    event LogParam(uint256 remaining);
    event LogParam(string remaining);
    event LogParam(bool remaining);

    error OnlyTrustedContract();

    mapping(address => uint256) public receivedAmount;

    uint256 public remaining;
    address public trustedContract;

    constructor(address _oracle, address _ubxs, address _trustedContract) {
        oracle = IOracle(_oracle);
        ubxs = IERC20(_ubxs);
        trustedContract = _trustedContract;
    }

    modifier onlyValidResponse(IOracle.OracleResponse memory response) {
        require(
            oracle.verifyOracleResponse(response),
            "Invalid Oracle Response"
        );
        _;
    }

    function receiveUbxs(
        IOracle.OracleResponse memory response
    ) external onlyValidResponse(response) {
        string memory strNum = substring(response.rslts[0], 2, 66);
        string memory strAddr = substring(response.rslts[0], 90, 130);
        uint256 amount = convertString(strNum);

        string memory senderStr = Strings.toHexString(
            uint160(trustedContract),
            20
        );

        if (
            keccak256(bytes(senderStr)) !=
            keccak256(bytes(string.concat("0x", strAddr)))
        ) revert OnlyTrustedContract();

        ubxs.transfer(msg.sender, amount - receivedAmount[msg.sender]);
        receivedAmount[msg.sender] += amount;
    }

    function setTrustedContract(address addr) external onlyOwner {
        trustedContract = addr;
    }

    function addUbxsToBridge(uint256 amount) external onlyOwner {
        ubxs.transferFrom(msg.sender, address(this), amount);
        remaining += amount;
    }

    function withdrawRemaing() external onlyOwner {
        ubxs.transferFrom(msg.sender, address(this), remaining);
        emit WithdrewRemaining(remaining);
        remaining = 0;
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

    function numberFromAscII(bytes1 b) private pure returns (uint8 res) {
        if (b >= "0" && b <= "9") {
            return uint8(b) - uint8(bytes1("0"));
        } else if (b >= "A" && b <= "F") {
            return 10 + uint8(b) - uint8(bytes1("A"));
        } else if (b >= "a" && b <= "f") {
            return 10 + uint8(b) - uint8(bytes1("a"));
        }
        return uint8(b); // or return error ...
    }

    function convertString(
        string memory str
    ) public pure returns (uint256 value) {
        bytes memory b = bytes(str);
        uint256 number = 0;
        for (uint i = 0; i < b.length; i++) {
            number = number << 4; // or number = number * 16
            number |= numberFromAscII(b[i]); // or number += numberFromAscII(b[i]);
        }
        return number;
    }
}
