const BaseModule = artifacts.require("BaseModule");
const IERC20 = artifacts.require("IERC20");
const ethers = require("ethers");
const constants = require("../../utils/constants");

contract("Dethlify", async (accounts) => {
  const OWNER = accounts[0];

  let dethlify;
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8547");

  before(async () => {
    let address = await provider.resolveName(constants.dethlifyENSFull);
    dethlify = await BaseModule.at(address);
  });

  it("[EXIT] 1.1: Exit all funds", async () => {
    let tokens = [constants.usdc, constants.dai];
    let prevBalances = [];
    let contractBalances = [];

    for (let i = 0; i < tokens.length; i++) {
      let tkn = await IERC20.at(tokens[i]);
      let bal = await tkn.balanceOf(OWNER);
      let cBal = await tkn.balanceOf(dethlify.address);
      prevBalances.push(Math.ceil(Number(bal.toString())));
      contractBalances.push(Math.ceil(Number(cBal.toString())));
    }

    await dethlify.exit(OWNER, tokens);

    for (let i = 0; i < tokens.length; i++) {
      let tkn = await IERC20.at(tokens[i]);
      let bal = await tkn.balanceOf(OWNER);
      assert.equal(Math.ceil(Number(bal.toString())), prevBalances[i] + contractBalances[i], "Did not exit token.");
    }
  });
});
