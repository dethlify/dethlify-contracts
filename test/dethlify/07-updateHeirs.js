const BaseModule = artifacts.require("BaseModule");
const ethers = require("ethers");
const constants = require("../../utils/constants");

contract("Dethlify", async (accounts) => {
  const OWNER = accounts[0];
  const NOT_OWNER = accounts[1];
  const ETHER = "0x0000000000000000000000000000000000000000";
  const heir1 = accounts[1];
  const heir2 = accounts[2];

  let dethlify;
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8547");

  before(async () => {
    let address = await provider.resolveName(constants.dethlifyENSFull);
    dethlify = await BaseModule.at(address);
  });

  // POSITIVE
  it("[UPDATEHEIRS] 1.1: Update heirs and distribution", async () => {
    let NEW_HEIRS = [heir1, heir2].map((h) => ethers.utils.solidityKeccak256(["address"], [h]));
    let NEW_DIST = [50 * 100, 50 * 100, 30 * 100, 70 * 100];
    let ETH_DIST = [50 * 100, 50 * 100];
    let DAI_DIST = [30 * 100, 70 * 100];
    await dethlify.updateHeirs(NEW_HEIRS, [ETHER, constants.dai], NEW_DIST, {
      from: OWNER,
    });
    let ACTUAL_HEIRS = await dethlify.getHeirs();
    let ACTUAL_DIST_ETHER = await dethlify.getTokenDistribution(ETHER);
    let ACTUAL_DIST_DAI = await dethlify.getTokenDistribution(constants.dai);
    let isEqual = true;
    for (let i = 0; i < ACTUAL_HEIRS.length; i++) {
      if (ACTUAL_HEIRS[i] !== NEW_HEIRS[i]) {
        isEqual = false;
        break;
      }
      if (Number(ACTUAL_DIST_ETHER[i].toString()) !== ETH_DIST[i]) {
        isEqual = false;
        break;
      }
    }

    for (let i = 0; i < ACTUAL_HEIRS.length; i++) {
      if (ACTUAL_HEIRS[i] !== NEW_HEIRS[i]) {
        isEqual = false;
        break;
      }

      if (Number(ACTUAL_DIST_DAI[i].toString()) !== DAI_DIST[i]) {
        isEqual = false;
        break;
      }
    }

    let setTokens0 = await dethlify.setTokens.call(0);
    let setTokens1 = await dethlify.setTokens.call(1);
    assert.equal(setTokens0, ETHER, "Didn't set ETH to setTokens");
    assert.equal(String(setTokens1).toLowerCase(), String(constants.dai).toLowerCase(), "Didn't set DAI to setTokens");
    assert.equal(true, isEqual, "Heirs and percentages are not equal.");
  });

  // NEGATIVE
  it("[UPDATEHEIRS] 2.2: Update heirs and distribution as non-owner", async () => {
    try {
      let NEW_HEIRS = [heir1, heir2].map((h) => ethers.utils.solidityKeccak256(["address"], [h]));
      let NEW_DIST = [50 * 100, 50 * 100];
      await dethlify.updateHeirs(NEW_HEIRS, [ETHER], NEW_DIST, {
        from: NOT_OWNER,
      });
      assert.equal(true, false, "Could change heirs as attacker!");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Error reason invalid.");
    }
  });

  it("[UPDATEHEIRS] 2.2: Update heirs and distribution messed up", async () => {
    try {
      let NEW_HEIRS = [heir1].map((h) => ethers.utils.solidityKeccak256(["address"], [h]));
      let NEW_DIST = [50 * 100, 50 * 100];
      await dethlify.updateHeirs(NEW_HEIRS, [ETHER], NEW_DIST, {from: OWNER});
      assert.equal(true, false, "Messed up!");
    } catch (error) {
      assert.equal(error.reason, "BH: Arrays must be equally sized.", "Error reason invalid.");
    }
  });

  it("[UPDATEHEIRS] 2.3: Attempt to delete heirs", async () => {
    try {
      let NEW_HEIRS = [];
      let NEW_DIST = [];
      await dethlify.updateHeirs(NEW_HEIRS, [ETHER], NEW_DIST, {from: OWNER});
      assert.equal(true, false, "Should not work!");
    } catch (error) {
      assert.equal(error.reason, "P: Add at least one heir.", "Error reason invalid.");
    }
  });

  it("[UPDATEHEIRS] 2.3: Should have deleted all previous heirs", async () => {
    let NEW_HEIRS = [heir1, heir2].map((h) => ethers.utils.solidityKeccak256(["address"], [h]));
    let NEW_DIST = [50 * 100, 50 * 100];
    await dethlify.updateHeirs(NEW_HEIRS, [ETHER], NEW_DIST, {from: OWNER});
    let dist = await dethlify.tokenDistribution.call(ETHER, accounts[3]);

    assert.equal(dist.toString(), "0", "Old heir still has shares stored");
  });
});
