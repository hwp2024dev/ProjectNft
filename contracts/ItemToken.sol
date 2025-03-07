// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ItemToken is ERC20, Ownable {
    struct NFTItem {
        uint256 itemId;       // 고유 식별자
        string itemName;
        string itemType;      // 프론트엔드에서는 type으로 매핑
        string emoji;
        string price;
        uint256 quantity;
        string username;
    }

    NFTItem[] private nftItems;
    mapping(uint256 => uint256) private nftIndex;

    constructor() ERC20("ItemToken", "ITK") Ownable(msg.sender) {
        _mint(msg.sender, 100000 * (10 ** decimals()));
    }

    // NFT 등록 (ERC-20 토큰화)
    function mintItem(
        address _to,
        uint256 _amount,
        string memory _name,
        string memory _itemType,
        string memory _emoji,
        string memory _price,
        string memory _username
    ) external onlyOwner {
        require(_amount > 0, "Amount must be greater than zero");
        _mint(_to, _amount);
        // 고유 instanceId 생성 – 블록 타임스탬프 기반 (충분히 고유)
        uint256 newId = uint256(keccak256(abi.encodePacked(_name, _price, _username, block.timestamp)));
        nftItems.push(NFTItem({
            itemId: newId,
            itemName: _name,
            itemType: _itemType,
            emoji: _emoji,
            price: _price,
            quantity: _amount,
            username: _username
        }));
        nftIndex[newId] = nftItems.length - 1;
    }

    // NFT 소각 (아이템 제거)
    function burnItem(uint256 _itemId, uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than zero");
        require(nftIndex[_itemId] < nftItems.length, "Invalid itemId");

        uint256 index = nftIndex[_itemId];
        require(nftItems[index].quantity >= _amount, "Not enough items to burn");
        require(balanceOf(msg.sender) >= _amount, "Not enough balance to burn");

        _burn(msg.sender, _amount);
        nftItems[index].quantity -= _amount;

        if (nftItems[index].quantity == 0) {
            _removeNFT(index);
        }
    }

    // NFT 배열 정리 (삭제)
    function _removeNFT(uint256 index) private {
        uint256 lastIndex = nftItems.length - 1;
        if (index != lastIndex) {
            NFTItem memory lastItem = nftItems[lastIndex];
            nftItems[index] = lastItem;
            nftIndex[lastItem.itemId] = index;
        }
        nftItems.pop();
    }

    // NFT 개수 반환
    function getTotalNFTs() public view returns (uint256) {
        return nftItems.length;
    }

    // NFT 데이터 반환
    function getNFTByIndex(uint256 index) public view returns (
        uint256 itemId,
        string memory itemName,
        string memory itemType,
        string memory emoji,
        string memory price,
        uint256 quantity,
        string memory username
    ) {
        require(index < nftItems.length, "Invalid index");
        NFTItem memory nft = nftItems[index];
        return (nft.itemId, nft.itemName, nft.itemType, nft.emoji, nft.price, nft.quantity, nft.username);
    }
}