const { ethers } = require('hardhat');

async function deploy() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const MartiansAreYourFrens = await ethers.getContractFactory('MartiansAreYourFrens');
  const contract = await MartiansAreYourFrens.deploy(
    '0x0A032a6Cf4e1f1cF890e92bC511Bc7a5Fa78e065',
    '0x915c2d9211a3f833414e91093d842c2b80dc3033d55db5df26d73d037d9bf6ef',
    1658731113,
    1658731113
  );

  await contract.deployed();
  console.log('MartiansAreYourFrens deployed to:', contract.address);

  return contract.address;
}

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
