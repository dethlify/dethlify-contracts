"use strict";
require("dotenv").config({path: "../.env"});
const Manager = artifacts.require("Manager");
const ManagerProxy = artifacts.require("ManagerProxy");
const IERC20 = artifacts.require("IERC20");
const ENS = artifacts.require("ENS");
const ethers = require("ethers");
const constants = require("../utils/constants");

module.exports = async (deployer, network, accounts) => {
  const proxyOwner = accounts[0];
  const managerOwner = accounts[0];
  const signers = [accounts[0], constants.dummySigner];
  const largeDAIHolder = "0x78bc49be7bae5e0eec08780c86f0e8278b8b035b";
  const largeUSDCHolder = "0x3e71552f3CBEAE776e8369B06376576487f59eB0";

  let proxy, manager;

  // deploy Manager
  let ens = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
  let resolver = "0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41";
  await deployer.deploy(Manager, ens, resolver, signers, {from: managerOwner});
  manager = await Manager.deployed();

  // give Manager ENS controller rights
  let registry = await ENS.at("0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85");
  await registry.reclaim(ethers.utils.bigNumberify("0x7bcac4d71cf70ef1664983bbf57e9733e5606c13955878f2599d07e8ef7a30d5"), manager.address, {from: "0x230C20B0756388DD2b3d61B787C5713c1B18656A"});

  // deploy Proxy
  await deployer.deploy(ManagerProxy, {from: proxyOwner});
  proxy = await ManagerProxy.deployed();

  // register manager in proxy
  await proxy.setManager(manager.address, {from: proxyOwner});

  // register dai token
  let monthlyDAI = ethers.utils.parseUnits("4", 18);
  let yearlyDAI = ethers.utils.parseUnits("40", 18);
  await manager.allowToken(constants.dai, monthlyDAI, yearlyDAI, {
    from: managerOwner,
  });
  let monthlyUSDC = ethers.utils.parseUnits("4", 6);
  let yearlyUSDC = ethers.utils.parseUnits("40", 6);
  await manager.allowToken(constants.usdc, monthlyUSDC, yearlyUSDC, {
    from: managerOwner,
  });

  // mint DAI and usdt for user
  await web3.eth.sendTransaction({
    from: accounts[0],
    value: ethers.utils.parseEther("10"),
    to: largeUSDCHolder,
  });
  let dai = await IERC20.at(constants.dai);
  let usdc = await IERC20.at(constants.usdc);

  for (let i = 0; i < 5; i++) {
    await dai.transfer(accounts[i], ethers.utils.parseUnits("90000", 18), {
      from: largeDAIHolder,
    });
    await usdc.transfer(accounts[i], ethers.utils.parseUnits("90000", 6), {
      from: largeUSDCHolder,
    });
  }
};
