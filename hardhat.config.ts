import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // ===== KUSAMA NETWORKS (EVM Compatible) =====

    // Moonriver (Kusama Parachain - Production)
    moonriver: {
      url: process.env.MOONRIVER_RPC_URL || "https://rpc.api.moonriver.moonbeam.network",
      chainId: 1285, // 0x505
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },

    // ===== POLKADOT NETWORKS (EVM Compatible) =====

    // Paseo Testnet (Polkadot Community Testnet)
    paseo: {
      url: process.env.PASEO_RPC_URL || "https://rpc.paseo.io",
      chainId: 1001, // Paseo testnet chain ID
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },

    // Moonbeam (Polkadot Parachain - Production)
    moonbeam: {
      url: process.env.MOONBEAM_RPC_URL || "https://rpc.api.moonbeam.network",
      chainId: 1284,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },

    // ===== DEVELOPMENT NETWORKS =====

    // Moonbase Alpha Testnet (free testnet for development)
    moonbase: {
      url: process.env.MOONBASE_RPC_URL || "https://rpc.api.moonbase.moonbeam.network",
      chainId: 1287,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
    },

    // Local Hardhat network for testing
    hardhat: {
      chainId: 1337,
    },
  },
  etherscan: {
    apiKey: {
      moonbaseAlpha: process.env.MOONSCAN_API_KEY || "",
      moonbeam: process.env.MOONSCAN_API_KEY || "",
      moonriver: process.env.MOONSCAN_API_KEY || "",
      paseo: "no-api-key-needed", // Paseo doesn't require API key for verification
    },
  },
};

export default config;
