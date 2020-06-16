"use strict";
const BaseModule = artifacts.require("BaseModule");
const CompoundModule = artifacts.require("CompoundModule");
const DSRModule = artifacts.require("DSRModule");
const Manager = artifacts.require("Manager");
const ManagerProxy = artifacts.require("ManagerProxy");
const ethers = require("ethers");

module.exports = async (deployer) => {
  let proxy = await ManagerProxy.deployed();
  let manager = await Manager.at(await proxy.getManagerImplementation());
  let version = "1.0.0";

  // 1. deploy modules
  let base = await deployer.deploy(BaseModule);
  let compound = await deployer.deploy(CompoundModule);
  let dsr = await deployer.deploy(DSRModule);

  // 2. register function signatures in manager
  let sigs = [];
  let addresses = [];
  let contracts = [base, compound, dsr];

  contracts.forEach((c) => {
    let iFace = new ethers.utils.Interface(c.abi);
    let functions = iFace.functions;
    Object.keys(functions).forEach((f) => {
      if (!f.includes("(")) {
        sigs.push(functions[f].sighash);
        addresses.push(c.address);
      }
    });
  });

  await manager.setNewVersionImplementation(version, sigs, addresses);
};
