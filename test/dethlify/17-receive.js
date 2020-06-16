const Dethlify = artifacts.require("Dethlify");
const ethers = require("ethers");
const constants = require("../../utils/constants");

contract("Dethlify", async (accounts) => {
  const OWNER = accounts[0];

  let dethlify;
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8547");

  before(async () => {
    let address = await provider.resolveName(constants.dethlifyENSFull);
    dethlify = await Dethlify.at(address);
  });

  it("[RECEIVE] 1.1: Receive ETH", async () => {
    let prev = await provider.getBalance(dethlify.address);

    await web3.eth.sendTransaction({
      to: dethlify.address,
      from: OWNER,
      value: ethers.utils.parseEther("10", "Ether").toString(),
    });
    let after = await provider.getBalance(dethlify.address);
    assert.equal(false, prev.toString() === after.toString(), "Heirs and distribution are not set correctly."); // prettier-ignore
  });
});
