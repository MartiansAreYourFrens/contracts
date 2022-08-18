import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import 'dotenv/config';
import { HardhatUserConfig } from 'hardhat/types';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';
import 'hardhat-gas-reporter';
import 'solidity-coverage';

const { INFURA_API_KEY, DEPLOY_PRIV_KEY, ETHERSCAN_API_KEY } = process.env;

// Ensure that we have all the environment variables we need.
if (!DEPLOY_PRIV_KEY) {
  throw new Error('Please set your DEPLOY_PRIV_KEY in a .env file');
}

if (!INFURA_API_KEY) {
  throw new Error('Please set your INFURA_API_KEY in a .env file');
}

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
      live: false,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [`${DEPLOY_PRIV_KEY}`],
      chainId: 1,
      live: true,
      saveDeployments: true,
      gasMultiplier: 2,
      deploy: ['deploy/mainnet'],
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [`${DEPLOY_PRIV_KEY}`],
      chainId: 4,
      live: true,
      saveDeployments: true,
      tags: ['staging'],
      deploy: ['deploy/rinkeby'],
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.15',
        settings: {
          metadata: {
            bytecodeHash: 'none',
          },
          optimizer: {
            enabled: false,
            runs: 10_000,
          },
        },
      },
    ],
  },
  etherscan: {
    apiKey: {
      rinkeby: ETHERSCAN_API_KEY ?? '',
      mainnet: ETHERSCAN_API_KEY ?? '',
    },
  },
  namedAccounts: {
    deployer: 0,
    user1: 1,
    user2: 2,
  },
  mocha: {
    timeout: 60000,
  },
  gasReporter: {
    currency: 'USD',
    enabled: process.env.REPORT_GAS ? true : false,
  },
  paths: {
    artifacts: './artifacts',
    cache: './cache',
    deploy: './deploy',
    deployments: 'deployments',
    sources: './contracts',
    tests: './test',
  },
};

export default config;
