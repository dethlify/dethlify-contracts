const ethers = require("ethers");
const constants = require("../utils/constants");

async function generateSignature(subdomain, nonce) {
  let wallet = new ethers.Wallet(constants.dummyPrivateKey);
  let labelHash = ethers.utils.solidityKeccak256(["string"], [subdomain]);
  let msgHash = ethers.utils.solidityKeccak256(["bytes32", "uint256"], [labelHash, nonce]);
  let msg = ethers.utils.arrayify(msgHash);
  let sig = await wallet.signMessage(msg);
  return sig;
}

module.exports.generateSignature = generateSignature;
