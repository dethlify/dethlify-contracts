const ManagerProxy = artifacts.require("ManagerProxy");
const Manager = artifacts.require("Manager");
const BaseModule = artifacts.require("BaseModule");
const ethers = require("ethers");
const constants = require("../../utils/constants");
const {generateSignature} = require("../../utils/sign");

/**
 * @dev checks all parameters after construction.
 */
contract("Manager", async (accounts) => {
  const dethOwner = accounts[0];

  let lock = 24 * 60 * 60 * 365 * 1.5; // 1.5 years
  let manager, proxy;

  before(async () => {
    proxy = await ManagerProxy.deployed();
    let mgr = await proxy.getManagerImplementation();
    manager = await Manager.at(mgr);
  });

  it("[DEPLOYPRO] 1.1: Deploy new dethlify contract", async () => {
    // contract variables
    const nonce = 1231231;
    const name = constants.dethlifyENS;
    const sig = await generateSignature(name, nonce);

    const h1 = accounts[1];
    const h2 = accounts[2];
    const h3 = accounts[3];
    const h4 = accounts[4];
    const heirs = [h1, h2, h3, h4];
    const dist = constants.dethlifyDist;

    let transaction = await manager.deploy(dethOwner, heirs, dist, lock, proxy.address, name, nonce, sig, {from: dethOwner, value: ethers.utils.parseEther("100")});
    let provider = new ethers.providers.JsonRpcProvider("http://localhost:8547");
    let tx = await provider.getTransactionReceipt(transaction.tx);
    let log = tx.logs[tx.logs.length - 1];
    let abi = ["event Deploy(address dethlify)"];
    let iface = new ethers.utils.Interface(abi);
    let event = iface.parseLog(log);
    let dethlify = event.values.dethlify;

    dethlify = await BaseModule.at(dethlify);

    let cHeirs = await dethlify.getHeirs();
    let cDist = await dethlify.getTokenDistribution(constants.eth);

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
});
