const { ethers } = require('hardhat');

const deployContract = async function (contractName, constructorArgs) {
  let factory;
  try {
    factory = await ethers.getContractFactory(contractName);
  } catch (e) {
    console.log(e);
  }
  let contract = await factory.deploy(...(constructorArgs || []));
  await contract.deployed();
  return contract;
};

module.exports = { deployContract };
