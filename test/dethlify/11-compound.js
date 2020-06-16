const CompoundModule = artifacts.require("CompoundModule");
const CEth = artifacts.require("CEth");
const CToken = artifacts.require("CToken");
const ethers = require("ethers");
const constants = require("../../utils/constants");

/**
 * To execute these tests you need to run ganache-cli with
 * the mainnet fork and unlock the DAI large holder.
 */
contract("Dethlify", async (accounts) => {
  const OWNER = accounts[0];
  const NOT_OWNER = accounts[1];
  const cEthContractAddress = "0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5";
  const cDaiContractAddress = "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643";

  let cEthTokenContract, cDaiTokenContract;
  let dethlify;
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8547");

  before(async () => {
    let address = await provider.resolveName(constants.dethlifyENSFull);
    dethlify = await CompoundModule.at(address);
    cEthTokenContract = await CEth.at(cEthContractAddress);
    cDaiTokenContract = await CToken.at(cDaiContractAddress);
  });

  // POSITIVE
  it("[COMPOUND] 1.1: Supply 5 ETH", async () => {
    /**
     * Once supplied, the user should receive the amount of
     * ETH send, divided by the current exchange rate.
     */
    let amount = ethers.utils.parseEther("5");
    await dethlify.supplyEth(cEthContractAddress, amount, {from: OWNER});
    let realEth = await cEthTokenContract.balanceOfUnderlying.call(dethlify.address);

    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(realEth.toString(), 18))), 5, "Did not supply 5 ETH.");
  });

  it("[COMPOUND] 1.2: Redeem all ETH + interest", async () => {
    /**
     * This redeems all ETH with the accrued interest.
     * The final amount is equal to the cEth token amount
     * multiplied by the exchange rate.
     */
    let prevEth = await cEthTokenContract.balanceOfUnderlying.call(dethlify.address);
    await dethlify.redeemAllEth(cEthContractAddress, {from: OWNER});
    let afterEth = await cEthTokenContract.balanceOfUnderlying.call(dethlify.address);

    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(prevEth.toString(), 18))), 5, "Did not redeem all ETH.");
    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(afterEth.toString(), 18))), 0, "Did not redeem all ETH.");
  });

  it("[COMPOUND] 1.3: Supply 100 DAI", async () => {
    let amount = ethers.utils.parseEther("100");
    await dethlify.supplyToken(cDaiContractAddress, constants.dai, amount, {
      from: OWNER,
    });
    let realDai = await cDaiTokenContract.balanceOfUnderlying.call(dethlify.address);

    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(realDai.toString(), 18))), 100, "Did not supply 100 DAI.");
  });

  it("[COMPOUND] 1.4: Redeem all Tokens + interest", async () => {
    /**
     * This redeems all DAI tokens with the accrued interest.
     * The final amount is equal to the cDai token amount
     * multiplied by the exchange rate.
     */
    let prevDai = await cDaiTokenContract.balanceOfUnderlying.call(dethlify.address);
    await dethlify.redeemAllTokens(cDaiContractAddress, {from: OWNER});
    let afterDai = await cDaiTokenContract.balanceOfUnderlying.call(dethlify.address);

    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(prevDai.toString(), 18))), 100, "Did not redeem all DAI.");
    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(afterDai.toString(), 18))), 0, "Did not redeem all DAI.");
  });

  it("[COMPOUND] 1.5: Redeem 1 ETH based on underlying ETH amount", async () => {
    /**
     * This redeems one ETH based on the underlying amount. Meaning that we
     * request 1 ETH in wei (1000000000000000000) and then calculate the
     * amount of cEth tokens based on that underlying amount.
     * The amount of cEth tokens is calculated by taking the amount in wei
     * and dividing it by the current exchange rate.
     */
    let amount = ethers.utils.parseEther("5");
    await dethlify.supplyEth(cEthContractAddress, amount);

    amount = ethers.utils.parseEther("1");
    let prevEth = await cEthTokenContract.balanceOfUnderlying.call(dethlify.address);
    await dethlify.redeemEth(cEthContractAddress, amount, false, {from: OWNER});
    let afterEth = await cEthTokenContract.balanceOfUnderlying.call(dethlify.address);

    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(prevEth.toString(), 18))), 5, "Did not redeem 1 ETH based on underlying ETH amount.");
    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(afterEth.toString(), 18))), 4, "Did not redeem 1 ETH based on underlying ETH amount.");
  });

  it("[COMPOUND] 1.6: Redeem 50 DAI based on underlying DAI amount", async () => {
    /**
     * This redeems 50 DAI based on the underlying amount. Meaning that we
     * request 50 DAI  (50000000000000000000) and then calculate the
     * amount of cDai tokens based on that underlying amount.
     * The amount of cDai tokens is calculated by taking the amount (18 decimals)
     * and dividing it by the current exchange rate.
     */
    let amount = ethers.utils.parseEther("100");
    await dethlify.supplyToken(cDaiContractAddress, constants.dai, amount);

    amount = ethers.utils.parseEther("50");
    let prevDai = await cDaiTokenContract.balanceOfUnderlying.call(dethlify.address);

    await dethlify.redeemTokens(cDaiContractAddress, amount, false, {
      from: OWNER,
    });
    let afterDai = await cDaiTokenContract.balanceOfUnderlying.call(dethlify.address);

    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(prevDai.toString(), 18))), 100, "Did not redeem DAI based on underlying DAI amount.");
    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(afterDai.toString(), 18))), 50, "Did not redeem DAI based on underlying DAI amount.");
  });

  it("[COMPOUND] 1.7: Redeem 1 ETH based on cEther token amount", async () => {
    /**
     * This redeems some ETH based on the cEther token amount. Meaning that we
     * request an amount of cEther tokens and the cEther contract calculates the
     * amount of ETH in wei that we will get.
     * The amount of ETH is calculated by taking the cEther tokens amount and
     * multiplying it by the current exchange rate.
     */
    let exchangeRate =  await cEthTokenContract.exchangeRateCurrent.call() / 1e18; // prettier-ignore
    let neededAmount = parseInt(Number(ethers.utils.parseEther("1").toString()) / exchangeRate); // prettier-ignore

    let prevEth = await cEthTokenContract.balanceOfUnderlying.call(dethlify.address);
    await dethlify.redeemEth(cEthContractAddress, neededAmount, true, {
      from: OWNER,
    });
    let afterEth = await cEthTokenContract.balanceOfUnderlying.call(dethlify.address);

    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(prevEth.toString(), 18))), 4, "Did not redeem ETH based on cEther token amount.");
    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(afterEth.toString(), 18))), 3, "Did not redeem ETH based on cEther token amount.");
  });

  it("[COMPOUND] 1.8: Redeem 20 DAI based on cToken amount", async () => {
    /**
     * This redeems some DAI based on the cToken amount. Meaning that we
     * request an amount of cTokens and the cToken contract calculates the
     * amount of DAI that we will get.
     * The amount of DAI is calculated by taking the cToken amount and
     * multiplying it by the current exchange rate.
     */
    let exchangeRate =  await cDaiTokenContract.exchangeRateCurrent.call() / 1e18; // prettier-ignore
    let neededAmount = new ethers.utils.BigNumber(String(parseInt(Number(ethers.utils.parseUnits("20", 18)) / exchangeRate))); // prettier-ignore

    let prevDai = await cDaiTokenContract.balanceOfUnderlying.call(dethlify.address);
    await dethlify.redeemTokens(cDaiContractAddress, neededAmount, true, {
      from: OWNER,
    });
    let afterDai = await cDaiTokenContract.balanceOfUnderlying.call(dethlify.address);

    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(prevDai.toString(), 18))), 50, "Did not redeem Dai based on cDai token amount.");
    assert.equal(Math.round(parseFloat(ethers.utils.formatUnits(afterDai.toString(), 18))), 30, "Did not redeem Dai based on cDai token amount.");
  });

  // Negative
  it("[COMPOUND] 1.9: Attempt to supply ETH as non-owner", async () => {
    let amount = ethers.utils.parseEther("5");
    try {
      await dethlify.supplyEth(cEthContractAddress, amount, {from: NOT_OWNER});
      assert.equal(true, false, "Could supply ETH as non-owner.");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Wrong revert reason.");
    }
  });

  it("[COMPOUND] 1.10: Attempt to supply DAI as non-owner", async () => {
    let amount = ethers.utils.parseEther("100");
    try {
      await dethlify.supplyToken(cDaiContractAddress, constants.dai, amount, {
        from: NOT_OWNER,
      });
      assert.equal(true, false, "Could supply DAI as non-owner.");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Wrong revert reason.");
    }
  });

  it("[COMPOUND] 1.11: Attempt to redeem all ETH as non-owner", async () => {
    try {
      await dethlify.redeemAllEth(cEthContractAddress, {
        from: NOT_OWNER,
      });
      assert.equal(true, false, "Could redeem ETH as non-owner.");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Wrong revert reason.");
    }
  });

  it("[COMPOUND] 1.12: Attempt to redeem all DAI as non-owner", async () => {
    try {
      await dethlify.redeemAllTokens(cDaiContractAddress, {
        from: NOT_OWNER,
      });
      assert.equal(true, false, "Could redeem DAI as non-owner.");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Wrong revert reason.");
    }
  });

  it("[COMPOUND] 1.13: Attempt to redeem some ETH as non-owner", async () => {
    let amount = ethers.utils.parseEther("1");
    try {
      await dethlify.redeemEth(cEthContractAddress, amount, false, {
        from: NOT_OWNER,
      });
      assert.equal(true, false, "Could redeem ETH as non-owner.");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Wrong revert reason.");
    }
  });

  it("[COMPOUND] 1.13: Attempt to redeem some DAI as non-owner", async () => {
    let amount = ethers.utils.parseEther("1");
    try {
      await dethlify.redeemTokens(cDaiContractAddress, amount, false, {
        from: NOT_OWNER,
      });
      assert.equal(true, false, "Could redeem DAI as non-owner.");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Wrong revert reason.");
    }
  });
});
