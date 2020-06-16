const ManagerProxy = artifacts.require("ManagerProxy");
const Manager = artifacts.require("Manager");
const ethers = require("ethers");
const constants = require("../../utils/constants");

/**
 * @dev checks all parameters after construction.
 */
contract("Manager", async (accounts) => {
  const OWNER = accounts[0];

  let manager, proxy;

  before(async () => {
    proxy = await ManagerProxy.deployed();
    let mgr = await proxy.getManagerImplementation();
    manager = await Manager.at(mgr);
  });

  it("[ALLOWTOKEN] 1.1: Allow new token", async () => {
    let monthlyDAI = ethers.utils.parseUnits("4", 18);
    let yearlyDAI = ethers.utils.parseUnits("40", 18);
    await manager.allowToken(constants.dai, monthlyDAI, yearlyDAI, {
      from: OWNER,
    });
    let monthlyUSDC = ethers.utils.parseUnits("4", 6);
    let yearlyUSDC = ethers.utils.parseUnits("40", 6);
    await manager.allowToken(constants.usdc, monthlyUSDC, yearlyUSDC, {
      from: OWNER,
    });

    // check if tokens are allowed
    let daiAllowed = await manager.isTokenAllowed(constants.dai);
    let usdcAllowed = await manager.isTokenAllowed(constants.usdc);
    assert.equal(daiAllowed, true, "DAI not allowed.");
    assert.equal(usdcAllowed, true, "DAI not allowed.");

    // check fees
    let _monthlyDAI = await manager.getMonthlyFee(constants.dai);
    let _yearlyDAI = await manager.getYearlyFee(constants.dai);

    assert.equal(monthlyDAI.toString(), _monthlyDAI.toString(), "Did not set fee.");
    assert.equal(yearlyDAI.toString(), _yearlyDAI.toString(), "Did not set fee.");
  });
});
