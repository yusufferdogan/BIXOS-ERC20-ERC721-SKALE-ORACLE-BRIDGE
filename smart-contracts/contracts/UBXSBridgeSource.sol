// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

//DEPLOY ON MAINNET
contract UBXSBridgeSource is Ownable {
    IERC20 public ubxs;

    uint256 public remaining;

    event WithdrewRemaining(uint256 remaining);

    struct Transfer {
        uint256 amount;
        address addr;
    }

    mapping(address => uint256) private sentAmount;

    constructor(address _ubxs) {
        ubxs = IERC20(_ubxs);
    }

    function getSentAmount(
        address addr
    ) external view returns (Transfer memory transfer) {
        transfer = Transfer(sentAmount[addr], address(this));
    }

    function withdrawRemaing() external onlyOwner {
        ubxs.transferFrom(msg.sender, address(this), remaining);
        emit WithdrewRemaining(remaining);
        remaining = 0;
    }

    function sendUBXS(uint256 amount) external {
        ubxs.transferFrom(msg.sender, address(this), amount);

        sentAmount[msg.sender] += amount;
        remaining += amount;
    }
}
