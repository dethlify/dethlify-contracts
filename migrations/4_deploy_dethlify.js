"use strict";
const ManagerProxy = artifacts.require("ManagerProxy");
const Manager = artifacts.require("Manager");
const ethers = require("ethers");
const IERC20 = artifacts.require("IERC20");
const constants = require("../utils/constants");
const {generateSignature} = require("../utils/sign");

module.exports = async (deployer, network, accounts) => {
  const dethOwner = accounts[0];

  // contract variables
  const nonce = 1;
  const name = constants.dethlifyENS;
  const sig = await generateSignature(name, nonce);

  const h1 = accounts[1];
  const h2 = accounts[2];
  const h3 = accounts[3];
  const h4 = accounts[4];
  const heirs = [h1, h2, h3, h4];
  const dist = constants.dethlifyDist;
  let lock = constants.lock;

  let proxy = await ManagerProxy.deployed();
  let manager = await Manager.at(await proxy.getManagerImplementation());

  // deploy new contract
  let transaction = await manager.deploy(dethOwner, heirs, dist, lock, proxy.address, name, nonce, sig, {from: dethOwner, value: ethers.utils.parseEther("100")});

  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8547");
  let tx = await provider.getTransactionReceipt(transaction.tx);
  let log = tx.logs[tx.logs.length - 1];
  let abi = ["event Deploy(address dethlify)"];
  let iface = new ethers.utils.Interface(abi);
  let event = iface.parseLog(log);
  let dethlify = event.values.dethlify;

  let daiContract = await IERC20.at(constants.dai);
  let usdcContract = await IERC20.at(constants.usdc);
  await daiContract.transfer(dethlify, ethers.utils.parseEther("500"), {
    from: dethOwner,
  });
  await usdcContract.transfer(dethlify, ethers.utils.parseUnits("500", 6), {
    from: dethOwner,
  });
};
