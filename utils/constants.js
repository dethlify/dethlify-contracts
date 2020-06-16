module.exports = Object.freeze({
  lock: 24 * 60 * 60 * 31 * 5, // 5 months
  dethlifyDist: [25 * 100, 25 * 100, 25 * 100, 25 * 100],
  basicDist: [25 * 100, 25 * 100, 50 * 100],
  dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  eth: "0x0000000000000000000000000000000000000000",
  registryAbi: [{inputs:[{internalType:"uint256",name:"id",type:"uint256"},{internalType:"address",name:"owner",type:"address"}],name:"reclaim",type:"function"}], // prettier-ignore
  pot: "0x197E90f9FAD81970bA7976f33CbD77088E5D7cf7",
  join: "0x9759A6Ac90977b93B58547b4A71c78317f391A28",
  vat: "0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B",
  usdc: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  usdt: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  dethlifyENS: "dethlifycontract",
  dethlifyENSFull: "dethlifycontract.dethlify.eth",
  basicENS: "second.dethlify.eth",
  dummyPrivateKey: "0xce4c31502ab5fb697cc6d01da6bd7ed8ac4312c21852dc5dc0a0ce24477d593a",
  dummySigner: "0x7E2E7c6EcC19E76aff781aB878fA5822a785BCd0",
});
// DO NOT USE THE PRIVATE KEY STORED HERE
// AS IT WAS GENERATED FOR PUBLIC TESTS ONLY
