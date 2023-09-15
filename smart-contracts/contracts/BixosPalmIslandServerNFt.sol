// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// PALM ISLAND NFT TO DEPLOY IN SKALE CHAIN
contract BixosPalmIslandsServerNFT is ERC721, ERC721Enumerable, AccessControl {
    bytes32 constant LOCKER_ROLE = keccak256("LOCKER_ROLE");

    //30 minted + 20 can be minted in BNB chain
    uint256 public tokenIdCounter = 50;
    IERC20 private _ubxsToken;
    address private _contractAddress;
    string private baseUri = "https://game.bixos.io/nfts/";

    uint256 public remainNft;
    uint256 public nftPrice;

    event SaleOpened(uint256 remainNft, uint256 nftPrice);
    event SaleClosed();
    event RemainNft(uint256 remainNft);
    event PriceChanged(uint256 nftPrice);

    modifier checkRemainNft() {
        require(remainNft > 0, "NFT total supply limit reached");
        _;
    }

    constructor(
        address tokenAddress
    ) ERC721("Bixos Palm Islands Server NFT", "BXSPIS") {
        _contractAddress = address(this);
        _ubxsToken = IERC20(tokenAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(LOCKER_ROLE, msg.sender);
    }

    function startSale(
        uint256 _remainNft,
        uint256 _nftPrice
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(remainNft == 0, "Sale not completed yet");

        remainNft = _remainNft;
        nftPrice = _nftPrice;

        emit SaleOpened(remainNft, nftPrice);
    }

    function updateNftPrice(
        uint256 _nftPrice
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        nftPrice = _nftPrice;

        emit PriceChanged(nftPrice);
    }

    function lockerMint(uint256 tokenId) external onlyRole(LOCKER_ROLE) {
        _mint(_msgSender(), tokenId);
    }

    function mint() external checkRemainNft {
        // slither-disable-next-line reentrancy-no-eth
        require(
            _ubxsToken.transferFrom(_msgSender(), _contractAddress, nftPrice),
            "Transaction Error"
        );

        tokenIdCounter++;
        remainNft--;

        _mint(_msgSender(), tokenIdCounter);

        emit RemainNft(remainNft);

        if (remainNft == 0) emit SaleClosed();
    }

    function withdrawNftPayments(
        address paymentWallet
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // slither-disable-next-line unchecked-transfer
        _ubxsToken.transfer(
            paymentWallet,
            _ubxsToken.balanceOf(_contractAddress)
        );
    }

    function setBaseURI(
        string memory _baseUri
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseUri = _baseUri;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseUri;
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
