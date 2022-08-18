const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { deployContract } = require('./helpers.js');
const { expect } = require('chai');
const { ethers } = require('hardhat');

let mainContract;
let maxMintCount;
let owner;
let team;
let addr1;
let addr2;

const START_TIME = 1649083667;

const createTestSuite = ({ contract, constructorArgs }) =>
  function () {
    context(`${contract}`, function () {
      beforeEach(async function () {
        mainContract = await deployContract(contract, constructorArgs);
        maxMintCount = await mainContract.MAX_MINT_COUNT();

        const [ownerWallet, addr1Wallet, addr2Wallet, teamWallet] = await ethers.getSigners();
        owner = ownerWallet;
        addr1 = addr1Wallet;
        addr2 = addr2Wallet;
        team = teamWallet;

        await mainContract.updateTeamAddress(team.address);
      });

      context('Initial Contract', async function () {
        it('has 0 totalSupply', async function () {
          const supply = await mainContract.totalSupply();
          expect(supply).to.equal(0);
        });

        it('has 0 totalMinted', async function () {
          const totalMinted = await mainContract.totalMinted();
          expect(totalMinted).to.equal(0);
        });

        it('owner can update mint start times', async function () {
          await mainContract.updateMintStartTime(START_TIME);
          await mainContract.updateAllowlistMintStartTime(START_TIME + 1000);

          const mintStartTime = await mainContract.mintStartTime();
          expect(mintStartTime).to.equal(START_TIME);

          const allowlistMintStartTime = await mainContract.allowlistMintStartTime();
          expect(allowlistMintStartTime).to.equal(START_TIME + 1000);
        });

        it('can be paused and unpaused', async function () {
          let isPaused = await mainContract.paused();
          expect(isPaused).to.equal(false);

          await mainContract.pause();

          isPaused = await mainContract.paused();
          expect(isPaused).to.equal(true);

          await expect(mainContract.mint(1)).to.be.revertedWith('Pausable: paused');

          await mainContract.unpause();

          isPaused = await mainContract.paused();
          expect(isPaused).to.equal(false);
        });
      });

      context('Team Mint Functionality', async function () {
        it('team can mint tokens', async function () {
          const teamAllowance = await mainContract.TEAM_MINT_COUNT();

          const teamWallet = mainContract.connect(team);
          await teamWallet.teamMint();

          const teamBalance = await mainContract.balanceOf(team.address);
          expect(teamBalance).to.be.equal(teamAllowance);
        });

        it('only the teamAddress can mint', async function () {
          await expect(mainContract.connect(addr1).teamMint()).to.be.revertedWith('Caller is not the teamAddress');
        });
      });

      context('Public Mint Functionality', async function () {
        it('throws an exception if minted before mintStartTime', async function () {
          const startTime = Date.now() + 1000000;
          await mainContract.updateMintStartTime(startTime);
          await expect(mainContract.mint(maxMintCount)).to.be.revertedWith('Not Active');
        });

        it('throws an exception quantity is more than MAX_MINT_COUNT', async function () {
          const user = mainContract.connect(addr1);

          await expect(user.mint(maxMintCount + 1)).to.be.revertedWith('Exceeds allowance');
        });

        it('can mint MAX_MINT_COUNT tokens', async function () {
          const user = mainContract.connect(addr1);

          await user.mint(maxMintCount);
          const balance = await user.balanceOf(addr1.address);
          expect(+balance).to.be.equal(maxMintCount);
        });
      });

      context('Allowlist Mint Functionality', async function () {
        beforeEach(async function () {
          const leafNodes = [owner.address, addr1.address].map((addr) => keccak256(addr));
          const tree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
          this.merkleTree = tree;

          const root = '0x' + this.merkleTree.getRoot().toString('hex');
          await mainContract.updateMerkleRoot(root);
        });

        it('throws an exception if minted before allowlistMintStartTime', async function () {
          const proof = this.merkleTree.getHexProof(keccak256(owner.address));
          const startTime = Date.now() + 1000000;
          await mainContract.updateAllowlistMintStartTime(startTime);
          await expect(mainContract.allowlistMint(proof, 1)).to.be.revertedWith('Not Active');
        });

        it('throws an exception if address is exceeding allowance', async function () {
          const proof = this.merkleTree.getHexProof(keccak256(addr2.address));
          const user2 = mainContract.connect(addr2);
          await expect(user2.allowlistMint(proof, 1)).to.be.revertedWith('Invalid Proof');
        });

        it('throws an exception quantity is more than MAX_MINT_COUNT', async function () {
          const proof = this.merkleTree.getHexProof(keccak256(addr1.address));
          const user = mainContract.connect(addr1);

          await expect(user.allowlistMint(proof, maxMintCount + 1)).to.be.revertedWith('Exceeds allowance');
        });

        it('mints when on the allowlist', async function () {
          const proof = this.merkleTree.getHexProof(keccak256(addr1.address));
          const user = mainContract.connect(addr1);

          await user.allowlistMint(proof, maxMintCount);
          let balance = await user.balanceOf(addr1.address);
          expect(+balance).to.be.equal(maxMintCount);

          await expect(user.allowlistMint(proof, 1)).to.be.revertedWith('Exceeds allowance');
        });
      });
    });
  };

describe(
  'MartiansAreYourFrens',
  createTestSuite({
    contract: 'MartiansAreYourFrens',
    constructorArgs: [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      '0x070e8db97b197cc0e4a1790c5e6c3667bab32d733db7f815fbe84f5824c7168d',
      1651498961,
      1651498961,
    ],
  })
);
