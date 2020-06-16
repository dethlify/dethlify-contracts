const Manager = artifacts.require("Manager");
const BaseModule = artifacts.require("BaseModule");
const IERC20 = artifacts.require("IERC20");
const ethers = require("ethers");
const constants = require("../../utils/constants");

contract("Dethlify", async (accounts) => {
  const OWNER = accounts[0];
  const NOT_OWNER = accounts[1];
  const MANAGER_OWNER = accounts[0];

  let usdc, manager;

  let dethlify;
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8547");

  let day = 24 * 60 * 60;
  let month = day * 31;
  let year = month * 12;
  let decimals = 6;
  let monthlyFee = 4;
  let yearlyFee = 40;

  before(async () => {
    manager = await Manager.deployed();
    usdc = await IERC20.at(constants.usdc);

    let address = await provider.resolveName(constants.dethlifyENSFull);
    dethlify = await BaseModule.at(address);
  });

  // POSITIVE
  it("[PAYMENT] 1.1: Pay yearly amount", async () => {
    let prevBalance = await usdc.balanceOf(dethlify.address);
    let prevPaid = Number((await dethlify.paidUntil.call()).toString());

    await dethlify.payYearlyFee(usdc.address, {from: OWNER});
    let afterBalance = await usdc.balanceOf(dethlify.address);
    let afterPaid = Number((await dethlify.paidUntil.call()).toString());

    prevBalance = Number(ethers.utils.formatUnits(prevBalance.toString(), decimals).toString());
    afterBalance = Number(ethers.utils.formatUnits(afterBalance.toString(), decimals).toString());

    assert.equal(afterBalance, prevBalance - yearlyFee, "Invalid balance.");
    assert.equal(afterPaid, prevPaid + year, "Did not extend paidUntil.");
  });

  it("[PAYMENT] 1.2: Pay monthly amount", async () => {
    let prevBalance = await usdc.balanceOf(dethlify.address);
    let prevPaid = Number((await dethlify.paidUntil.call()).toString());

    await dethlify.payMonthlyFee(usdc.address, {from: OWNER});
    let afterBalance = await usdc.balanceOf(dethlify.address);
    let afterPaid = Number((await dethlify.paidUntil.call()).toString());

    prevBalance = Number(ethers.utils.formatUnits(prevBalance.toString(), decimals).toString());
    afterBalance = Number(ethers.utils.formatUnits(afterBalance.toString(), decimals).toString());

    assert.equal(afterBalance, prevBalance - monthlyFee, "Invalid balance.");
    assert.equal(afterPaid, prevPaid + month, "Did not extend paidUntil.");
  });

  it("[PAYMENT] 1.3: Pay yearly amount with user funds", async () => {
    let prevBalance = await usdc.balanceOf(OWNER);
    let prevPaid = Number((await dethlify.paidUntil.call()).toString());
    let fee = await manager.getYearlyFee(constants.usdc);
    await usdc.approve(manager.address, fee, {from: OWNER});

    await manager.payYearlyFee(OWNER, dethlify.address, constants.usdc, {
      from: OWNER,
    });
    let afterBalance = await usdc.balanceOf(OWNER);
    let afterPaid = Number((await dethlify.paidUntil.call()).toString());

    prevBalance = Number(ethers.utils.formatUnits(prevBalance.toString(), decimals).toString());
    afterBalance = Number(ethers.utils.formatUnits(afterBalance.toString(), decimals).toString());

    assert.equal(afterBalance, prevBalance - yearlyFee, "Invalid balance.");
    assert.equal(afterPaid, prevPaid + year, "Did not extend paidUntil.");
  });

  it("[PAYMENT] 1.4: Pay monthly amount with user funds", async () => {
    let prevBalance = await usdc.balanceOf(OWNER);
    let prevPaid = Number((await dethlify.paidUntil.call()).toString());
    let fee = await manager.getMonthlyFee(constants.usdc);
    await usdc.approve(manager.address, fee, {from: OWNER});

    await manager.payMonthlyFee(OWNER, dethlify.address, constants.usdc, {
      from: OWNER,
    });
    let afterBalance = await usdc.balanceOf(OWNER);
    let afterPaid = Number((await dethlify.paidUntil.call()).toString());

    prevBalance = Number(ethers.utils.formatUnits(prevBalance.toString(), decimals).toString());
    afterBalance = Number(ethers.utils.formatUnits(afterBalance.toString(), decimals).toString());

    assert.equal(afterBalance, prevBalance - monthlyFee, "Invalid balance.");
    assert.equal(afterPaid, prevPaid + month, "Did not extend paidUntil.");
  });

  it("[PAYMENT] 1.5: Pay by admin", async () => {
    let prevPaid = Number((await dethlify.paidUntil.call()).toString());
    await manager.adminPay([dethlify.address], [1], {from: MANAGER_OWNER});
    let afterPaid = Number((await dethlify.paidUntil.call()).toString());
    assert.equal(afterPaid, prevPaid + month, "Did not extend paidUntil.");
  });

  // NEGATIVE
  it("[PAYMENT] 2.1: Attempt to use another token contract", async () => {
    try {
      await dethlify.payMonthlyFee(dethlify.address);
      assert.equal(true, false, "Could pay with disallowed token.");
    } catch (error) {
      assert.equal(error.reason, "M: Token not allowed.", "Error reason invalid.");
    }
  });

  it("[PAYMENT] 2.2: Attempt to pay monthly as not-owner", async () => {
    try {
      await dethlify.payMonthlyFee(usdc.address, {from: NOT_OWNER});
      assert.equal(true, false, "Could pay as not-owner.");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Error reason invalid.");
    }
  });

  it("[PAYMENT] 2.3: Attempt to pay yearly as not-owner", async () => {
    try {
      await dethlify.payYearlyFee(usdc.address, {from: NOT_OWNER});
      assert.equal(true, false, "Could pay as not-owner.");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Error reason invalid.");
    }
  });
});
