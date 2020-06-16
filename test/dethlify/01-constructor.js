const BaseModule = artifacts.require("BaseModule");
const ethers = require("ethers");
const dayjs = require("dayjs");
const constants = require("../../utils/constants");

/**
 * @dev checks all parameters after construction.
 */
contract("Dethlify", async (accounts) => {
  const ETHER = "0x0000000000000000000000000000000000000000";
  const h1 = accounts[1];
  const h2 = accounts[2];
  const h3 = accounts[3];
  const h4 = accounts[4];
  const heirs = [h1, h2, h3, h4];
  const dist = constants.dethlifyDist;
  const lock = constants.lock;
  const version = "1.0.0";

  let dethlify;
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8547");

  before(async () => {
    let address = await provider.resolveName(constants.dethlifyENSFull);
    dethlify = await BaseModule.at(address);
  });

  it("[CONSTRUCTOR] 1.1: Set heirs and distribution", async () => {
    let cHeirs = await dethlify.getHeirs();
    let cDist = await dethlify.getTokenDistribution(ETHER);

    let isEqual = true;
    for (let i = 0; i < cHeirs.length; i++) {
      if (cHeirs[i] !== heirs[i]) {
        isEqual = false;
        break;
      }
      if (Number(cDist[i].toString()) !== dist[i]) {
        isEqual = false;
        break;
      }
    }

    assert.equal(true, isEqual, "Heirs and distribution are not set correctly."); // prettier-ignore
  });

  it("[CONSTRUCTOR] 1.2: Set Lock period", async () => {
    let cLock = await dethlify.lock.call();
    assert.equal(Number(cLock.toString()), lock, "Lock is false"); // prettier-ignore
  });

  it("[CONSTRUCTOR] 1.3: Set setTokens", async () => {
    let setTokens = await dethlify.setTokens.call(0);
    assert.equal(setTokens, ETHER, "Did not set ETH");
  });

  it("[CONSTRUCTOR] 1.4: Set paidUntil", async () => {
    let paidUntil = await dethlify.paidUntil.call();
    paidUntil = Number(paidUntil.toString());
    let now = dayjs().unix();

    assert.equal(paidUntil > now, true, "Did not give free months");
  });

  it("[CONSTRUCTOR] 1.5: Set version", async () => {
    let cVersion = await dethlify.version.call();
    assert.equal(cVersion, version, "Did not set version.");
  });
});
