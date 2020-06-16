const DSRModule = artifacts.require("DSRModule");
const ethers = require("ethers");
const constants = require("../../utils/constants");

/**
 * To execute these tests you need to run ganache-cli with
 * the mainnet fork and unlock the DAI large holder.
 */
contract("Dethlify", async (accounts) => {
  const OWNER = accounts[0];
  const NOT_OWNER = accounts[1];

  // DSR
  let pot = constants.pot;
  let join = constants.join;
  let vat = constants.vat;
  let dai = constants.dai;

  let dethlify;
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8547");

  before(async () => {
    let address = await provider.resolveName(constants.dethlifyENSFull);
    dethlify = await DSRModule.at(address);
  });

  // POSITIVE
  it("[DSR] 1.1: init DSR", async () => {
    /**
     * This initializes the DSR configuration. Basically it allows
     * the joinDai and pot contracts to modify the gem and dai balance
     * of the current contract.
     */
    await dethlify.initDSR(pot, join, vat, {from: OWNER});
  });

  it("[DSR] 1.2: join 100 DAI", async () => {
    /**
     * This adds 100 DAI to the DAI Savings Rate contract.
     * Effectively this allows users to earn interest on their DAI.
     */
    let amount = ethers.utils.parseUnits("100", 18); // DAI uses 18 decimals
    await dethlify.joinDSR(dai, join, pot, amount, {from: OWNER});
    let afterBalance = await dethlify.getDSRBalance(pot);

    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(afterBalance.toString(), 18))), 100, "Did not join 100 DAI");
  });

  it("[DSR] 1.3: exit all DAI", async () => {
    /**
     * This exits all DAI from the DSR contract.
     */
    let prevBalance = await dethlify.getDSRBalance(pot);
    await dethlify.exitAllDSR(join, pot, {from: OWNER});
    let afterBalance = await dethlify.getDSRBalance(pot);

    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(prevBalance.toString(), 18))), 100, "Did not join 100 DAI");
    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(afterBalance.toString(), 18))), 0, "Did not join 100 DAI");
  });

  it("[DSR] 1.4: exit 10 DAI", async () => {
    /**
     * This exits only 10 DAI from the DSR contract.
     */
    let amount = ethers.utils.parseUnits("100", 18);
    await dethlify.joinDSR(dai, join, pot, amount, {from: OWNER});

    let prevBalance = await dethlify.getDSRBalance(pot);
    amount = ethers.utils.parseUnits("10", 18);
    await dethlify.exitDSR(join, pot, amount, {from: OWNER});
    let afterBalance = await dethlify.getDSRBalance(pot);

    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(prevBalance.toString(), 18))), 100, "Did not exit 10 DAI.");
    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(afterBalance.toString(), 18))), 90, "Did not exit 10 DAI.");
  });

  it("[DSR] 1.5: init and join 100 DAI", async () => {
    /**
     * This adds 100 DAI to the DAI Savings Rate contract.
     * Effectively this allows users to earn interest on their DAI.
     */
    await dethlify.exitAllDSR(join, pot, {from: OWNER});

    let amount = ethers.utils.parseUnits("100", 18); // DAI uses 18 decimals
    await dethlify.initAndJoinDSR(dai, join, pot, vat, amount, {
      from: OWNER,
    });
    let afterBalance = await dethlify.getDSRBalance(pot);

    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(afterBalance.toString(), 18))), 100, "Did not join 100 DAI");
  });

  // negative
  it("[DSR] 1.6: Attempt to join some DAI as non-owner", async () => {
    /**
     * This exits only 10 DAI from the DSR contract.
     */
    let amount = ethers.utils.parseUnits("100", 18);
    try {
      await dethlify.joinDSR(dai, join, pot, amount, {from: NOT_OWNER});
      assert.equal(true, false, "Could join DAI as non-owner.");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Wrong revert reason.");
    }
  });

  it("[DSR] 1.7: Attempt to exit some DAI as non-owner", async () => {
    /**
     * This exits only 10 DAI from the DSR contract.
     */
    let amount = ethers.utils.parseUnits("1", 18);
    try {
      await dethlify.exitDSR(join, pot, amount, {from: NOT_OWNER});
      assert.equal(true, false, "Could exit DAI as non-owner.");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Wrong revert reason.");
    }
  });

  it("[DSR] 1.8: Attempt to exit some DAI as non-owner", async () => {
    /**
     * This exits only 10 DAI from the DSR contract.
     */
    let amount = ethers.utils.parseUnits("1", 18);
    try {
      await dethlify.exitDSR(join, pot, amount, {from: NOT_OWNER});
      assert.equal(true, false, "Could exit DAI as non-owner.");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Wrong revert reason.");
    }
  });
});
