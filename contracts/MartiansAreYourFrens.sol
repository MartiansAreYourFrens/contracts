// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import 'erc721a/contracts/ERC721A.sol';

/** 
    @dev Contract inherits functionality from ERC721A, 
    a fully compliant implementation of IERC721 with 
    gas savings for minting multiple NFTs in a single transaction.
    source: https://github.com/chiru-labs/ERC721A 
    @title Martians Are Your Frens mint contract
    @author magiclars <https://github.com/magiclars-off>
*/
contract MartiansAreYourFrens is Ownable, ERC721A, Pausable {
    using Strings for uint256;

    /**********************
     * Contract Variables *
     **********************/

    uint16 public constant MAX_MINT_COUNT = 10;
    uint16 public constant TEAM_MINT_COUNT = 250;
    uint16 public constant TOTAL_SUPPLY = 10_000;

    uint256 public allowlistMintStartTime;
    uint256 public mintStartTime;

    bytes32 public merkleRoot;
    bool public teamHasMinted = false;

    address payable public teamAddress;

    /*************
     * Modifiers *
     *************/

    /// Checks that the caller is not a contract
    modifier callerIsUser() {
        require(tx.origin == msg.sender, 'No cheating allowed in the Country Club');
        _;
    }

    /// Verify if sale started
    modifier saleStarted(uint256 _saleStartTime) {
        require(_saleStartTime != 0 && block.timestamp >= _saleStartTime, 'Not Active');
        _;
    }

    /// Verify that total supply has not been reached
    modifier supplyAvailable() {
        uint256 reservedForTeam = TEAM_MINT_COUNT - super._numberMinted(owner());
        require(super.totalSupply() < (TOTAL_SUPPLY - reservedForTeam), 'Max Supply');
        _;
    }

    /// Verify that address will not mint more than MAX_MINT_COUNT
    modifier canMintQuantity(uint256 _quantity) {
        require(super._numberMinted(msg.sender) + _quantity <= MAX_MINT_COUNT, 'Exceeds allowance');
        _;
    }

    /// Verify correct eth amount is sent
    modifier onlyTeam() {
        require(msg.sender == teamAddress, 'Caller is not the teamAddress');
        _;
    }

    /***************
     * Constructor *
     ***************/

    /// Initialize the Martians Are Your Frens contract.
    constructor(
        address _teamAddress,
        bytes32 _merkleRoot,
        uint256 _mintStartTime,
        uint256 _allowlistMintStartTime
    ) ERC721A('Martians Are Your Frens', 'MAYF') {
        teamAddress = payable(_teamAddress);
        merkleRoot = _merkleRoot;
        mintStartTime = _mintStartTime;
        allowlistMintStartTime = _allowlistMintStartTime;
    }

    /*********************************
     * External and Public Functions *
     *********************************/

    /// allowlistMint allows the sender to Mint a Martian if supplied with valid MerkleProof
    function allowlistMint(bytes32[] calldata _merkleproof, uint256 _quantity)
        external
        callerIsUser
        saleStarted(allowlistMintStartTime)
        supplyAvailable
        canMintQuantity(_quantity)
    {
        /// Verify that address is on the allowlist
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(_merkleproof, merkleRoot, leaf), 'Invalid Proof');

        super._mint(msg.sender, _quantity);
    }

    /// mint allows the sender to Mint a Martian
    function mint(uint256 _quantity)
        external
        callerIsUser
        saleStarted(mintStartTime)
        supplyAvailable
        canMintQuantity(_quantity)
    {
        super._mint(msg.sender, _quantity);
    }

    /// teamMint allows the teamAddress to mint the TEAM_MINT_COUNT
    function teamMint() external onlyTeam supplyAvailable {
        /// Verify that address will not mint more than TEAM_MINT_COUNT
        require(!teamHasMinted, 'Team Already Minted');

        teamHasMinted = true;

        /// Mint Martians in batches of 10
        for (uint256 i = 0; i < (TEAM_MINT_COUNT / 10); i++) {
            super._mint(msg.sender, 10);
        }
    }

    /// Returns the amount of Martians minted by an address
    function numberMinted(address _address) public view returns (uint256) {
        return super._numberMinted(_address);
    }

    /// Returns the amount of minted Martian
    function totalMinted() public view returns (uint256) {
        return super._totalMinted();
    }

    /// Sets the Allow List mint Start Time
    function updateAllowlistMintStartTime(uint256 _allowlistMintStartTime) external onlyOwner {
        allowlistMintStartTime = _allowlistMintStartTime;
    }

    /// Sets the Allow List mint Start Time
    function updateMintStartTime(uint256 _mintStartTime) external onlyOwner {
        mintStartTime = _mintStartTime;
    }

    /// updateTeamAddress allows the owner to update the teamAddress
    function updateTeamAddress(address newAddress) external onlyOwner {
        teamAddress = payable(newAddress);
    }

    /// updateMerkleRoot updates the set Merkle Root for Allow List verification
    function updateMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    /// pause is used to pause the contract
    function pause() external onlyOwner {
        _pause();
    }

    /// unpause is used to unpause the contract.
    function unpause() external onlyOwner {
        _unpause();
    }

    /// Allows the owner to withdraw the balance of the contract
    function withdrawBalance() external onlyTeam {
        (bool success, ) = msg.sender.call{value: address(this).balance}('');
        require(success, 'Transfer failed.');
    }

    /**********************
     * Metadata Variables *
     **********************/

    string private _baseTokenURI;
    string private _defaultURI;
    bool private _enableDefaultUri = true;

    /// Overrides the _baseURI function from ERC721A.sol
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /// Overrides the tokenURI function from ERC721A.sol
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(super._exists(_tokenId), 'ERC721Metadata: URI query for nonexistent token');

        return _enableDefaultUri ? _defaultURI : string.concat(_baseTokenURI, _tokenId.toString());
    }

    /// Sets the Base URI
    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    /// Sets the Default URI
    function setDefaultURI(string calldata defaultURI) external onlyOwner {
        _defaultURI = defaultURI;
    }

    /// Toggles the usage of the default- or baseTokenURI
    function setToggleDefaultURI(bool enable) external onlyOwner {
        _enableDefaultUri = enable;
    }

    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal override whenNotPaused {
        super._beforeTokenTransfers(from, to, startTokenId, quantity);
    }
}
