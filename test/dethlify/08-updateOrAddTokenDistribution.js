const BaseModule = artifacts.require("BaseModule");
const ethers = require("ethers");
const constants = require("../../utils/constants");

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
  it("[UPDATEDIST] 1.1: Update ETH and DAI distribution", async () => {
    let ETH_DIST = [50 * 100, 10 * 100, 10 * 100, 30 * 100];
    let DAI_DIST = [20 * 100, 10 * 100, 30 * 100, 40 * 100];
    let NEW_DIST = [ETH_DIST, DAI_DIST].flat();

    await dethlify.updateDistributions([ETHER, constants.dai], NEW_DIST, {
      from: OWNER,
    });
    let ACTUAL_DIST_ETH = (await dethlify.getTokenDistribution(ETHER)).map((d) => Number(d.toString()));
    let ACTUAL_DIST_DAI = (await dethlify.getTokenDistribution(constants.dai)).map((d) => Number(d.toString()));

    for (let i = 0; i < ACTUAL_DIST_ETH.length; i++) {
      assert.equal(ACTUAL_DIST_ETH[i], ETH_DIST[i], "ETH Distribution could not be set.");
      assert.equal(ACTUAL_DIST_DAI[i], DAI_DIST[i], "DAI Distribution could not be set.");
    }
  });

  it("[UPDATEDIST] 1.2: Update ETHER (default) distribution", async () => {
    let NEW_DIST = [50 * 100, 10 * 100, 10 * 100, 30 * 100];
    await dethlify.updateOrAddTokenDistributions([ETHER], NEW_DIST, {
      from: OWNER,
    });
    let ACTUAL_DIST = (await dethlify.getTokenDistribution(ETHER)).map((d) => Number(d.toString()));

    for (let i = 0; i < ACTUAL_DIST.length; i++) {
      assert.equal(ACTUAL_DIST[i], NEW_DIST[i], "Distribution could not be set.");
    }
  });

  it("[UPDATEDIST] 1.3: Add DAI distribution", async () => {
    let DAI_DIST = [20 * 100, 20 * 100, 20 * 100, 40 * 100];
    await dethlify.updateOrAddTokenDistributions([constants.dai], DAI_DIST, {
      from: OWNER,
    });
    let ACTUAL_DIST = (await dethlify.getTokenDistribution(constants.dai)).map((d) => Number(d.toString()));

    for (let i = 0; i < ACTUAL_DIST.length; i++) {
      assert.equal(ACTUAL_DIST[i], DAI_DIST[i], "Distribution could not be set.");
    }

    let setToken0 = await dethlify.setTokens.call(0);
    let setToken1 = await dethlify.setTokens.call(1);

    assert.equal(setToken0, ETHER, "ETH is not first setToken");
    assert.equal(String(setToken1).toLowerCase(), String(constants.dai).toLowerCase(), "DAI is not in setToken list");
  });

  it("[UPDATEDIST] 1.4: Update DAI, POT and ETHER distribution", async () => {
    let ETH_DIST = [40 * 100, 30 * 100, 20 * 100, 10 * 100];
    let DAI_DIST = [10 * 100, 20 * 100, 30 * 100, 40 * 100];
    let POT_DIST = [20 * 100, 20 * 100, 20 * 100, 40 * 100];
    let MERGED = [].concat.apply([], [ETH_DIST, DAI_DIST, POT_DIST]);

    await dethlify.updateOrAddTokenDistributions([ETHER, constants.dai, constants.pot], MERGED, {from: OWNER});
    let ACTUAL_ETH_DIST = (await dethlify.getTokenDistribution(ETHER)).map((d) => Number(d.toString()));
    let ACTUAL_DAI_DIST = (await dethlify.getTokenDistribution(constants.dai)).map((d) => Number(d.toString()));
    let ACTUAL_POT_DIST = (await dethlify.getTokenDistribution(constants.pot)).map((d) => Number(d.toString()));

    for (let i = 0; i < ACTUAL_ETH_DIST.length; i++) {
      assert.equal(ACTUAL_ETH_DIST[i], ETH_DIST[i], "Distribution could not be set.");
      assert.equal(ACTUAL_DAI_DIST[i], DAI_DIST[i], "Distribution could not be set.");
      assert.equal(ACTUAL_POT_DIST[i], POT_DIST[i], "Distribution could not be set.");
    }
  });

  it("[UPDATEDIST] 1.5: Get default distribution for unset tokens", async () => {
    let ETH_DIST = [40 * 100, 30 * 100, 20 * 100, 10 * 100];
    let USDT_DIST = (await dethlify.getTokenDistribution(constants.usdt)).map((d) => Number(d.toString()));

    for (let i = 0; i < USDT_DIST.length; i++) {
      assert.equal(USDT_DIST[i], ETH_DIST[i], "Returned distribution is wrong.");
    }
  });

  it("[UPDATEDIST] 1.6: Get multiple distributions at once", async () => {
    let ETH_DIST = [40 * 100, 30 * 100, 20 * 100, 10 * 100];
    let DAI_DIST = [10 * 100, 20 * 100, 30 * 100, 40 * 100];
    let POT_DIST = [20 * 100, 20 * 100, 20 * 100, 40 * 100];
    let USDT_DIST = [40 * 100, 30 * 100, 20 * 100, 10 * 100];
    let MERGED = [].concat.apply([], [ETH_DIST, DAI_DIST, POT_DIST, USDT_DIST]);

    let ACTUAL_DISTS = (await dethlify.getTokenDistributions([constants.eth, constants.dai, constants.pot, constants.usdt])).map((d) => Number(d.toString()));

    for (let i = 0; i < MERGED.length; i++) {
      assert.equal(MERGED[i], ACTUAL_DISTS[i], "Returned distribution is wrong");
    }
  });

  it("[UPDATEDIST] 1.7: Get set toknes", async () => {
    let setTokens = [constants.eth, constants.dai, constants.pot];
    let tokens = await dethlify.getSetTokens();
    for (let i = 0; i < tokens.length; i++) {
      assert.equal(setTokens[i], tokens[i], "Wrong token set.");
    }
  });

  // NEGATIVE
  it("[UPDATEDIST] 2.1: Total too high", async () => {
    let NEW_DIST = [60 * 100, 10 * 100, 10 * 100, 30 * 100];
    try {
      await dethlify.updateOrAddTokenDistributions([ETHER], NEW_DIST, {
        from: OWNER,
      });
      assert.equal(true, false, "Attack!");
    } catch (error) {
      assert.equal(error.reason, "BIF: Total share percentage must be equal to 100%!", "Error reason invalid.");
    }
  });

  it("[UPDATEDIST] 2.1: Non-owner", async () => {
    let NEW_DIST = [50 * 100, 10 * 100, 10 * 100, 30 * 100];
    try {
      await dethlify.updateOrAddTokenDistributions([ETHER], NEW_DIST, {
        from: NOT_OWNER,
      });
      assert.equal(true, false, "Attack!");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Error reason invalid.");
    }
  });
});
