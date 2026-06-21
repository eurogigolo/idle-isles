import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { network } from "hardhat";
import type { Address, Hash, TransactionReceipt } from "viem";

interface ContractDeployment {
  address: Address;
  transactionHash: Hash;
  blockNumber: string;
  gasUsed: string;
}

interface DeploymentRecord {
  network: string;
  chainId: number;
  deployedAt: string;
  deployer: Address;
  metadataUri: string;
  contracts: {
    IdleIslesContent: ContractDeployment;
    IdleIsles: ContractDeployment & {
      constructorArgs: [string, Address];
    };
    HoardHall: ContractDeployment & {
      constructorArgs: [Address];
    };
  };
  frontendEnv: {
    VITE_IDLE_ISLES_ADDRESS: Address;
    VITE_HOARD_HALL_ADDRESS: Address;
  };
}

const DEFAULT_METADATA_URI = "ipfs://idle-isles/{id}.json";
const metadataUri = process.env.IDLE_ISLES_METADATA_URI ?? DEFAULT_METADATA_URI;
const confirmations = parseConfirmations(process.env.DEPLOY_CONFIRMATIONS);

async function main() {
  const connection = await network.create();

  try {
    const { viem } = connection;
    const publicClient = await viem.getPublicClient();
    const [deployer] = await viem.getWalletClients();

    if (!deployer?.account?.address) {
      throw new Error("No deployer account available for the selected Hardhat network.");
    }

    const chainId = await publicClient.getChainId();
    const deployerAddress = deployer.account.address;

    console.log(`Deploying Idle Isles to ${connection.networkName} (${chainId})`);
    console.log(`Deployer: ${deployerAddress}`);
    console.log(`Metadata URI: ${metadataUri}`);
    console.log(`Confirmations: ${confirmations}`);

    console.log("Deploying IdleIslesContent...");
    const contentTx = await viem.sendDeploymentTransaction("IdleIslesContent");
    const contentReceipt = await publicClient.waitForTransactionReceipt({
      hash: contentTx.deploymentTransaction.hash,
      confirmations,
    });
    const contentAddress = requireContractAddress(
      contentTx.contract.address,
      contentReceipt,
      "IdleIslesContent",
    );
    console.log(`IdleIslesContent: ${contentAddress}`);

    console.log("Deploying IdleIsles...");
    const gameTx = await viem.sendDeploymentTransaction("IdleIsles", [
      metadataUri,
      contentAddress,
    ]);
    const gameReceipt = await publicClient.waitForTransactionReceipt({
      hash: gameTx.deploymentTransaction.hash,
      confirmations,
    });
    const gameAddress = requireContractAddress(gameTx.contract.address, gameReceipt, "IdleIsles");
    console.log(`IdleIsles: ${gameAddress}`);

    console.log("Deploying HoardHall...");
    const hoardHallTx = await viem.sendDeploymentTransaction("HoardHall", [gameAddress]);
    const hoardHallReceipt = await publicClient.waitForTransactionReceipt({
      hash: hoardHallTx.deploymentTransaction.hash,
      confirmations,
    });
    const hoardHallAddress = requireContractAddress(
      hoardHallTx.contract.address,
      hoardHallReceipt,
      "HoardHall",
    );
    console.log(`HoardHall: ${hoardHallAddress}`);

    const deployment: DeploymentRecord = {
      network: connection.networkName,
      chainId,
      deployedAt: new Date().toISOString(),
      deployer: deployerAddress,
      metadataUri,
      contracts: {
        IdleIslesContent: formatDeployment(
          contentAddress,
          contentTx.deploymentTransaction.hash,
          contentReceipt,
        ),
        IdleIsles: {
          ...formatDeployment(gameAddress, gameTx.deploymentTransaction.hash, gameReceipt),
          constructorArgs: [metadataUri, contentAddress],
        },
        HoardHall: {
          ...formatDeployment(
            hoardHallAddress,
            hoardHallTx.deploymentTransaction.hash,
            hoardHallReceipt,
          ),
          constructorArgs: [gameAddress],
        },
      },
      frontendEnv: {
        VITE_IDLE_ISLES_ADDRESS: gameAddress,
        VITE_HOARD_HALL_ADDRESS: hoardHallAddress,
      },
    };

    const outputPath = resolve("deployments", `${toKebabCase(connection.networkName)}.json`);
    const tempOutputPath = `${outputPath}.tmp`;
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(tempOutputPath, `${JSON.stringify(deployment, null, 2)}\n`, "utf8");
    await rename(tempOutputPath, outputPath);

    console.log(`Deployment written to ${outputPath}`);
    console.log(`Set VITE_IDLE_ISLES_ADDRESS=${gameAddress}`);
    console.log(`Set VITE_HOARD_HALL_ADDRESS=${hoardHallAddress}`);
  } finally {
    await connection.close();
  }
}

function formatDeployment(
  address: Address,
  transactionHash: Hash,
  receipt: TransactionReceipt,
): ContractDeployment {
  return {
    address,
    transactionHash,
    blockNumber: receipt.blockNumber.toString(),
    gasUsed: receipt.gasUsed.toString(),
  };
}

function requireContractAddress(
  predictedAddress: Address,
  receipt: TransactionReceipt,
  contractName: string,
): Address {
  const receiptAddress = receipt.contractAddress;
  if (receiptAddress === null) {
    throw new Error(`${contractName} deployment receipt did not include a contract address.`);
  }

  if (receiptAddress.toLowerCase() !== predictedAddress.toLowerCase()) {
    throw new Error(`${contractName} deployment address mismatch.`);
  }

  return predictedAddress;
}

function parseConfirmations(value: string | undefined): number {
  const parsed = Number(value ?? "1");

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("DEPLOY_CONFIRMATIONS must be a positive integer.");
  }

  return parsed;
}

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

await main();
