const BaseModule = artifacts.require("BaseModule");
const ethers = require("ethers");
const constants = require("../../utils/constants");

contract("Dethlify", async (accounts) => {
  const OWNER = accounts[0];
  const NOT_OWNER = accounts[1];

  let dethlify;
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8547");

  before(async () => {
    let address = await provider.resolveName(constants.dethlifyENSFull);
    dethlify = await BaseModule.at(address);
  });

  // POSITIVE
  it("[UPDATELOCK] 1.1: Correctly update lock", async () => {
    let newLock = 24 * 60 * 60 * 31; // 1 month
    await dethlify.updateLock(newLock, {from: OWNER});
    let afterLock = Number((await dethlify.lock.call()).toString());

    assert.equal(newLock, afterLock, "Could not set lock period");
  });

  // NEGATIVE
  it("[UPDATELOCK] 2.1: Set too short lock period", async () => {
    let newLock = 24 * 60 * 60 * 1; // 1 day

    try {
      await dethlify.updateLock(newLock, {from: OWNER});
      assert.equal(true, false, "Could set invalid lock period.");
    } catch (error) {
      assert.equal(error.reason, "BH: Lock period must be as least one month.");
    }
  });

  it("[UPDATELOCK] 2.2: Set too long lock period", async () => {
    let newLock = 24 * 60 * 60 * 365 * 3; // 3 years

    try {
      await dethlify.updateLock(newLock, {from: OWNER});
      assert.equal(true, false, "Could set invalid lock period.");
    } catch (error) {
      assert.equal(error.reason, "BH: Lock period must not be longer than two years.");
    }
  });

  it("[UPDATELOCK] 2.3: Set lock as non-owner", async () => {
    let newLock = 24 * 60 * 60 * 31; // 1 month
    try {
      await dethlify.updateLock(newLock, {from: NOT_OWNER});
      assert.equal(true, false, "Not owner could change lock period.");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Error reason invalid.");
    }
  });
});
