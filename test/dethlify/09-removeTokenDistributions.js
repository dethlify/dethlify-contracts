const BaseModule = artifacts.require("BaseModule");
const constants = require("../../utils/constants");
const ethers = require("ethers");

contract("Dethlify", async (accounts) => {
  const OWNER = accounts[0];
  const NOT_OWNER = accounts[1];
  const ETHER = "0x0000000000000000000000000000000000000000";

  let dethlify;
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8547");

  before(async () => {
    let address = await provider.resolveName(constants.dethlifyENSFull);
    dethlify = await BaseModule.at(address);
  });

  // POSITIVE
  it("[REMOVEDIST] 1.1: Remove DAI", async () => {
    let DAI_DIST = [20 * 100, 20 * 100, 20 * 100, 40 * 100];
    await dethlify.updateOrAddTokenDistributions([constants.dai], DAI_DIST, {
      from: OWNER,
    });
    let setTokens1 = await dethlify.setTokens.call(1);
    assert.equal(String(setTokens1).toLowerCase(), String(constants.dai).toLowerCase(), "Did not add DAI");

    let NEW_SET_TOKENS = [ETHER];
    await dethlify.removeTokenDistributions([constants.dai], NEW_SET_TOKENS, {
      from: OWNER,
    });

    let setTokens0 = await dethlify.setTokens.call(0);
    assert.equal(setTokens0, ETHER, "ETH not set");

    try {
      await dethlify.setTokens.call(1);
      assert.equal(true, false, "DAI was not removed");
    } catch (error) {
      // ignore
    }
  });

  // NEGATIVE
  it("[REMOVEDIST] 2.1: Attempt to remove DAI as non-owner", async () => {
    let DAI_DIST = [20 * 100, 20 * 100, 20 * 100, 40 * 100];
    await dethlify.updateOrAddTokenDistributions([constants.dai], DAI_DIST, {
      from: OWNER,
    });
    let setTokens1 = await dethlify.setTokens.call(1);
    assert.equal(String(setTokens1).toLowerCase(), String(constants.dai).toLowerCase(), "Did not add DAI");

    let NEW_SET_TOKENS = [ETHER];
    try {
      await dethlify.removeTokenDistributions([constants.dai], NEW_SET_TOKENS, {
        from: NOT_OWNER,
      });
      assert.equal(true, false, "Attack!");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Error reason invalid.");
    }
  });

  it("[REMOVEDIST] 2.2: Attempt to remove ETH as non-owner", async () => {
    let NEW_SET_TOKENS = [constants.dai];

    try {
      await dethlify.removeTokenDistributions([ETHER], NEW_SET_TOKENS, {
        from: OWNER,
      });
      assert.equal(true, false, "Attack!");
    } catch (error) {
      assert.equal(error.reason, "BIF: Can't remove default token distribution!", "Error reason invalid.");
    }
  });
});
