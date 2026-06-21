import "dotenv/config";
import hardhatNetworkHelpersPlugin from "@nomicfoundation/hardhat-network-helpers";
import hardhatNodeTestRunnerPlugin from "@nomicfoundation/hardhat-node-test-runner";
import hardhatViemPlugin from "@nomicfoundation/hardhat-viem";
import { configVariable, defineConfig } from "hardhat/config";

const megaEthRpcUrl = process.env.MEGAETH_RPC_URL ?? "https://carrot.megaeth.com/rpc";

export default defineConfig({
  plugins: [hardhatViemPlugin, hardhatNetworkHelpersPlugin, hardhatNodeTestRunnerPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
        },
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    megaethTestnet: {
      type: "http",
      chainType: "l1",
      url: megaEthRpcUrl,
      accounts: [configVariable("MEGAETH_PRIVATE_KEY")],
    },
  },
});
