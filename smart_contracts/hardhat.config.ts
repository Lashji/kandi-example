import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// get dotenv variables
import dotenv from "dotenv";
const envConf = dotenv.config();



const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${envConf!!.parsed!!.ALCHEMY_API_KEY}`,
      accounts: [envConf!!.parsed!!.GOERLI_PRIVATE_KEY],
    },
  },
};

export default config;
