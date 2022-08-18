const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
//const { ethers } = require('hardhat');

const whitelistAddresses = [
  '0xA68796B8BDEE0ec434A70B704bc562d41A33db6b',
  '0x0A032a6Cf4e1f1cF890e92bC511Bc7a5Fa78e065',
  '0x322e128453efd91a4c131761d9d535ff6e0ccd90',
];

// TEST ONLY
// ethers.getSigners().then(([owner, addr1]) => {
//   console.log(owner.address, addr1.address);
//   whitelistAddresses.push(owner.address, addr1.address);
//   growMerkleTree();
// });

const leaves = whitelistAddresses.map((x) => keccak256(x));
const tree = new MerkleTree(leaves, keccak256, {
  sortLeaves: true,
  sortPairs: true,
});
const root = tree.getHexRoot();
console.log('RootHash: ', root);

const leaf = keccak256(whitelistAddresses[2]);
console.log(whitelistAddresses[2]);
const proof = tree.getHexProof(leaf);
console.log('Proof: ', proof);
console.log(tree.verify(proof, leaf, root)); // true
