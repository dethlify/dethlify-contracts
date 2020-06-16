const IERC20 = artifacts.require("IERC20");
const BaseModule = artifacts.require("BaseModule");
const ethers = require("ethers");
const constants = require("../../utils/constants");

let provider = new ethers.providers.JsonRpcProvider("http://localhost:8547");

contract("Dethlify", async (accounts) => {
  const OWNER = accounts[0];
  const NOT_OWNER = accounts[1];
  let dethlify;

  before(async () => {
    let address = await provider.resolveName(constants.dethlifyENSFull);
    dethlify = await BaseModule.at(address);
  });

  // POSITIVE
  it("[TRANSFERMULTIPLE] 1.1: Transfer 10 DAI, 15 USDC, and 20 ETH", async () => {
    let recipients = [accounts[1], accounts[2], accounts[2]];
    let tokens = [
      {
        token: constants.dai,
        decimals: 18,
      },
      {
        token: constants.usdc,
        decimals: 6,
      },
      {
        token: constants.eth,
        decimals: 18,
      },
    ];

    let amounts = [ethers.utils.parseUnits("10", 18), ethers.utils.parseUnits("15", 6), ethers.utils.parseUnits("20", 18)];

    let previousBalances = [];
    for (let i = 0; i < tokens.length; i++) {
      let bal;
      if (tokens[i].token === constants.eth) {
        bal = await provider.getBalance(recipients[i]);
        bal = Number(ethers.utils.formatUnits(bal.toString(), tokens[i].decimals).toString());
      } else {
        let token = await IERC20.at(tokens[i].token);
        bal = await token.balanceOf(recipients[i]);
        bal = Number(ethers.utils.formatUnits(bal.toString(), tokens[i].decimals).toString());
      }
      previousBalances.push(bal);
    }

    await dethlify.transferMultiple(
      recipients,
      tokens.map((t) => t.token),
      amounts,
      {from: OWNER}
    );

    let afterBalances = [];
    for (let i = 0; i < tokens.length; i++) {
      let bal;
      if (tokens[i].token === constants.eth) {
        bal = await provider.getBalance(recipients[i]);
        bal = Number(ethers.utils.formatUnits(bal.toString(), tokens[i].decimals).toString());
      } else {
        let token = await IERC20.at(tokens[i].token);
        bal = await token.balanceOf(recipients[i]);
        bal = Number(ethers.utils.formatUnits(bal.toString(), tokens[i].decimals).toString());
      }
      afterBalances.push(bal);
    }

    for (let i = 0; i < tokens.length; i++) {
      let diff = Number(ethers.utils.formatUnits(amounts[i].toString(), tokens[i].decimals));
      assert.equal(afterBalances[i], previousBalances[i] + diff, "Did not transfer funds");
    }
  });

  // NEGATIVE
  it("[TRANSFERMULTIPLE] 2.1: Attempt to transfer 1 Token as non-owner", async () => {
    let recipients = [accounts[1], accounts[2], accounts[2]];
    let tokens = [
      {
        token: constants.dai,
        decimals: 18,
      },
      {
        token: constants.usdc,
        decimals: 6,
      },
      {
        token: constants.eth,
        decimals: 18,
      },
    ];

    let amounts = [ethers.utils.parseUnits("10", 18), ethers.utils.parseUnits("15", 6), ethers.utils.parseUnits("20", 18)];
    try {
      await dethlify.transferMultiple(
        recipients,
        tokens.map((t) => t.token),
        amounts,
        {from: NOT_OWNER}
      );
      assert.equal(true, false, "Could steal money!");
    } catch (error) {
      assert.equal(error.reason, "BH: Only owner!", "Error reason invalid.");
    }
  });
});
