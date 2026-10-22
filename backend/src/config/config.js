import dotenv from "dotenv";

dotenv.config();

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not defined in the environment variables");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

if(!process.env.SEPOLIA_RPC_URL) {
  throw new Error("SEPOLIA_RPC_URL is not defined in the environment variables");
}

if(!process.env.EVENT_CONTRACT_ADDRESS) {
  throw new Error("EVENT_CONTRACT_ADDRESS is not defined in the environment variables");
}

const config = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL,
  EVENT_CONTRACT_ADDRESS: process.env.EVENT_CONTRACT_ADDRESS,
};

export default config;
