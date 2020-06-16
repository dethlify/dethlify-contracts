const IERC20 = artifacts.require("IERC20");
const BaseModule = artifacts.require("BaseModule");
const ethers = require("ethers");
const constants = require("../../utils/constants");

// -----------------------------------------------
// NOTE THAT THIS TESTS ARE ONLY SUCCESSFUL IF THE
// LOCK PERIOD IS OVER!
// -----------------------------------------------
contract("Dethlify", async (accounts) => {
  const OWNER = accounts[0];

  const h1 = accounts[1];
  const h2 = accounts[2];
  const h3 = accounts[3];
  const h4 = accounts[4];
  const heirs = [h1, h2, h3, h4];
  const dist = constants.dethlifyDist;
  let decimals = 18;
  let tokenDecimals = 6;

  let dethlify, usdc;
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8547");

  before(async () => {
    let address = await provider.resolveName(constants.dethlifyENSFull);
    dethlify = await BaseModule.at(address);
    usdc = await IERC20.at(constants.usdc);

    // increase time
    await advanceTimeAndBlock(constants.lock);
  });

  it("[WITHDRAW] 1.1: Calculate shares correctly and withdraw correct amount", async () => {
    await dethlify.withdraw({from: h1});
    let total = 100;
    let share = total * (dist[0] / (100 * 100));
    let balanceAfter = await web3.eth.getBalance(dethlify.address);
    assert.equal(balanceAfter.toString(), ethers.utils.parseUnits(String(total - share), decimals).toString(), "Invalid share");
  });

  it("[WITHDRAW] 1.2: Heirs should not be able to claim tokens more than once during cycle", async () => {
    try {
      await dethlify.withdraw({from: h1});
      assert.equal(true, false, "Claiming more than once was successful.");
    } catch (error) {
      assert.equal(error.reason, "W: Can only claim once during claim cycle!", "Wrong reason given.");
    }
  });

  it("[WITHDRAW] 1.3: Let all other heirs claim their ETH", async () => {
    let total = 100;
    for (let i = 1; i < heirs.length; i++) {
      let share = total * (dist[i] / (100 * 100));
      let prevBalance = await web3.eth.getBalance(heirs[i]);
      await dethlify.withdraw({from: heirs[i]});
      let afterBalance = await web3.eth.getBalance(heirs[i]);
      prevBalance = Number(parseInt(Math.ceil(ethers.utils.formatUnits(prevBalance.toString(), decimals))));
      afterBalance = Number(parseInt(Math.ceil(ethers.utils.formatUnits(afterBalance.toString(), decimals))));
      assert.equal(afterBalance, prevBalance + share, "Invalid balance.");
    }
    await dethlify.withdraw({from: h1});
  });

  it("[WITHDRAW] 1.4: Attempt to withdraw funds as non-heir", async () => {
    try {
      await dethlify.withdraw({from: accounts[9]});
      assert.equal(true, false, "Could steal funds.");
    } catch (error) {
      assert.equal(error.reason, "BH: Only Heir!", "Wrong reason given.");
    }
  });

  it("[WITHDRAW] 1.5 Withdraw token", async () => {
    // 1. add token distributions
    let USDC_DIST = [20 * 100, 20 * 100, 20 * 100, 40 * 100];
    await dethlify.updateOrAddTokenDistributions([constants.usdc], USDC_DIST, {
      from: OWNER,
    });

    // 2. get total
    let total = await usdc.balanceOf(dethlify.address);
    total = Number(ethers.utils.formatUnits(total.toString(), tokenDecimals));

    // 3. withdraw token
    for (let i = 0; i < heirs.length; i++) {
      let share = total * (USDC_DIST[i] / (100 * 100));
      let prevBalance = await usdc.balanceOf(heirs[i]);
      await dethlify.withdrawToken(constants.usdc, {from: heirs[i]});
      let afterBalance = await usdc.balanceOf(heirs[i]);
      prevBalance = Number(parseInt(Math.ceil(ethers.utils.formatUnits(prevBalance.toString(), tokenDecimals))));
      afterBalance = Number(parseInt(Math.ceil(ethers.utils.formatUnits(afterBalance.toString(), tokenDecimals))));
      assert.equal(afterBalance, prevBalance + share, "Invalid balance.");
    }
  });
});

const advanceTimeAndBlock = async (time) => {
  await advanceTime(time);
  await advanceBlock();
};

const advanceTime = (time) => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [time],
        id: new Date().getTime(),
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      }
    );
  });
};

const advanceBlock = () => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_mine",
        id: new Date().getTime(),
      },
      (err) => {
        if (err) {
          return reject(err);
        }
        const newBlockHash = web3.eth.getBlock("latest").hash;

        return resolve(newBlockHash);
      }
    );
  });
};
