// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract UBXS is ERC20 {
    constructor() ERC20("UBXS", "UBXS TOKEN") {
        _mint(msg.sender, 100000000000 * 10 ** 6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
