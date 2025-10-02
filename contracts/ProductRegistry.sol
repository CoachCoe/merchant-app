// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProductRegistry {
    struct Store {
        address owner;
        string name;
        string ipfsProfileHash;
        bool isActive;
        uint256 createdAt;
    }

    struct Product {
        bytes32 id;
        address seller;
        string name;
        string ipfsMetadataHash;
        uint256 priceHollar;
        string category;
        bool isActive;
        uint256 createdAt;
    }

    mapping(address => Store) public stores;
    mapping(bytes32 => Product) public products;
    mapping(string => bytes32[]) public productsByCategory;
    mapping(address => bytes32[]) public productsBySeller;

    bytes32[] private allProductIds;

    event StoreCreated(address indexed owner, string name, string ipfsProfileHash);
    event StoreUpdated(address indexed owner, string name, string ipfsProfileHash);
    event ProductRegistered(
        bytes32 indexed id,
        address indexed seller,
        string name,
        string ipfsMetadataHash,
        uint256 priceHollar,
        string category
    );
    event ProductUpdated(
        bytes32 indexed id,
        string ipfsMetadataHash,
        uint256 priceHollar,
        bool isActive
    );
    event ProductDeactivated(bytes32 indexed id);

    modifier onlyStoreOwner() {
        require(stores[msg.sender].owner == msg.sender, "Not a store owner");
        _;
    }

    modifier onlyProductOwner(bytes32 productId) {
        require(products[productId].seller == msg.sender, "Not product owner");
        _;
    }

    function createStore(
        string memory _name,
        string memory _ipfsProfileHash
    ) external {
        require(stores[msg.sender].owner == address(0), "Store already exists");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_ipfsProfileHash).length > 0, "IPFS hash cannot be empty");

        stores[msg.sender] = Store({
            owner: msg.sender,
            name: _name,
            ipfsProfileHash: _ipfsProfileHash,
            isActive: true,
            createdAt: block.timestamp
        });

        emit StoreCreated(msg.sender, _name, _ipfsProfileHash);
    }

    function updateStore(
        string memory _name,
        string memory _ipfsProfileHash
    ) external onlyStoreOwner {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_ipfsProfileHash).length > 0, "IPFS hash cannot be empty");

        Store storage store = stores[msg.sender];
        store.name = _name;
        store.ipfsProfileHash = _ipfsProfileHash;

        emit StoreUpdated(msg.sender, _name, _ipfsProfileHash);
    }

    function registerProduct(
        string memory _name,
        string memory _ipfsMetadataHash,
        uint256 _priceHollar,
        string memory _category
    ) external returns (bytes32) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_ipfsMetadataHash).length > 0, "IPFS hash cannot be empty");
        require(_priceHollar > 0, "Price must be greater than 0");
        require(bytes(_category).length > 0, "Category cannot be empty");

        bytes32 productId = keccak256(
            abi.encodePacked(msg.sender, _name, _ipfsMetadataHash, block.timestamp)
        );

        require(products[productId].seller == address(0), "Product already exists");

        products[productId] = Product({
            id: productId,
            seller: msg.sender,
            name: _name,
            ipfsMetadataHash: _ipfsMetadataHash,
            priceHollar: _priceHollar,
            category: _category,
            isActive: true,
            createdAt: block.timestamp
        });

        productsByCategory[_category].push(productId);
        productsBySeller[msg.sender].push(productId);
        allProductIds.push(productId);

        emit ProductRegistered(
            productId,
            msg.sender,
            _name,
            _ipfsMetadataHash,
            _priceHollar,
            _category
        );

        return productId;
    }

    function updateProduct(
        bytes32 _productId,
        string memory _ipfsMetadataHash,
        uint256 _priceHollar,
        bool _isActive
    ) external onlyProductOwner(_productId) {
        require(bytes(_ipfsMetadataHash).length > 0, "IPFS hash cannot be empty");
        require(_priceHollar > 0, "Price must be greater than 0");

        Product storage product = products[_productId];
        product.ipfsMetadataHash = _ipfsMetadataHash;
        product.priceHollar = _priceHollar;
        product.isActive = _isActive;

        emit ProductUpdated(_productId, _ipfsMetadataHash, _priceHollar, _isActive);
    }

    function deactivateProduct(bytes32 _productId) external onlyProductOwner(_productId) {
        products[_productId].isActive = false;
        emit ProductDeactivated(_productId);
    }

    function getProduct(bytes32 _productId) external view returns (
        bytes32 id,
        address seller,
        string memory name,
        string memory ipfsMetadataHash,
        uint256 priceHollar,
        string memory category,
        bool isActive,
        uint256 createdAt
    ) {
        Product memory product = products[_productId];
        return (
            product.id,
            product.seller,
            product.name,
            product.ipfsMetadataHash,
            product.priceHollar,
            product.category,
            product.isActive,
            product.createdAt
        );
    }

    function getStore(address _owner) external view returns (
        address owner,
        string memory name,
        string memory ipfsProfileHash,
        bool isActive,
        uint256 createdAt
    ) {
        Store memory store = stores[_owner];
        return (
            store.owner,
            store.name,
            store.ipfsProfileHash,
            store.isActive,
            store.createdAt
        );
    }

    function getProductsBySeller(address _seller) external view returns (bytes32[] memory) {
        return productsBySeller[_seller];
    }

    function getProductsByCategory(string memory _category) external view returns (bytes32[] memory) {
        return productsByCategory[_category];
    }

    function getAllActiveProducts() external view returns (bytes32[] memory) {
        uint256 activeCount = 0;

        for (uint256 i = 0; i < allProductIds.length; i++) {
            if (products[allProductIds[i]].isActive) {
                activeCount++;
            }
        }

        bytes32[] memory activeProducts = new bytes32[](activeCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < allProductIds.length; i++) {
            if (products[allProductIds[i]].isActive) {
                activeProducts[currentIndex] = allProductIds[i];
                currentIndex++;
            }
        }

        return activeProducts;
    }

    function getTotalProducts() external view returns (uint256) {
        return allProductIds.length;
    }

    function getActiveProductCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < allProductIds.length; i++) {
            if (products[allProductIds[i]].isActive) {
                count++;
            }
        }
        return count;
    }
}
