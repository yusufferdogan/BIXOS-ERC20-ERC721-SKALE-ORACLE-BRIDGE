// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
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
    event LogParam(uint256 indexed remaining);
    event LogParam(string indexed remaining);
    event LogParam(bool indexed remaining);

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
        string memory strAddr = substring(response.rslts[0], 66, 130);

        uint256 amount = stringToNumber(strNum);
        emit LogParam(amount);

        string memory senderStr = Strings.toHexString(uint160(msg.sender), 20);

        emit LogParam(
            keccak256(bytes(senderStr)) ==
                keccak256(bytes(string.concat("0x", strAddr)))
        );

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

    function stringToNumber(
        string memory numString
    ) public pure returns (uint) {
        uint val = 0;
        bytes memory stringBytes = bytes(numString);
        for (uint i = 0; i < stringBytes.length; i++) {
            uint exp = stringBytes.length - i;
            bytes1 ival = stringBytes[i];
            uint8 uval = uint8(ival);
            uint jval = uval - uint(0x30);

            val += (uint(jval) * (10 ** (exp - 1)));
        }
        return val;
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
