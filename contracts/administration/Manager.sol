// Copyright (C) 2020 Protor UG (haftungsbeschränkt). <https://protor.io>

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "./ManagerStorage.sol";
import "../main/Dethlify.sol";
import "../libs/strings.sol";
import "../libs/Crypto.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/DethlifyContract.sol";

/**
 * @title Manager
 * @notice The manager is responsible for contract deployments, ENS registrations and payments.
 * @author Christian Engel - <chris@dethlify.com>
 */
contract Manager is ManagerStorage, Crypto {
  /**
   * @notice Construct new Manager
   * @param _ens the ens registry address
   * @param _resolver the ens resolver address
   * @param _signers the list of addresses that are allowed to sign new deployments
   */
  constructor(
    address _ens,
    address _resolver,
    address[] memory _signers
  ) public {
    owner = msg.sender;

    // register signers
    for (uint256 i = 0; i < _signers.length; i++) {
      isSigner[_signers[i]] = true;
    }

    // initialize ENS
    setENSConfig(_ens, _resolver);
  }

  /**
   * @notice Set the ENS configuration
   * @dev reverts if unauthorized
   * @param _ens the ens registry address
   * @param _resolver the ens resolver address
   */
  function setENSConfig(address _ens, address _resolver) public onlyOwner {
    ens = ENS(_ens);
    ensResolver = ENSResolver(_resolver);
    reverseRegistrar = ENSReverseRegistrar(ens.owner(ADDR_REVERSE_NODE));
  }

  /**
   * @notice Receive ETH funds
   */
  receive() external payable {}

  // ---------------------
  // ADMINISTRATION
  // ---------------------
  /**
   * @notice Change the manager owner
   * @dev reverts if unauthorized
   * @param _owner the new owner
   */
  function changeOwner(address _owner) public onlyOwner {
    owner = _owner;
  }

  /**
   * @notice Add a new signer
   * @dev reverts if unauthorized
   * @param _signer the new signer
   */
  function addSigner(address _signer) public onlyOwner {
    isSigner[_signer] = true;
  }

  /**
   * @notice Delete an existing signer
   * @dev reverts if unauthorized
   * @param _signer the signer to delete
   */
  function deleteSigner(address _signer) public onlyOwner {
    delete isSigner[_signer];
  }

  /**
   * @notice Allows for manual payments for a set of contracts
   * @dev reverts if unauthorized
   * @param _contracts the list of contracst
   * @param _months the list of number of months that will be paid for
   */
  function adminPay(address[] memory _contracts, uint256[] memory _months) public onlyOwner {
    for (uint256 i = 0; i < _contracts.length; i++) {
      DethlifyContract(_contracts[i]).markPaid(_months[i]);
    }
  }

  // ---------------------
  // HELPERS
  // ---------------------
  /**
   * @notice Generate a full domain name (first.dethlify.eth)
   * @param _subdomain the subdomain name, e.g. first
   * @return the full domain name
   */
  function getFullName(string memory _subdomain) public view returns (string memory) {
    strings.slice[] memory parts = new strings.slice[](2);
    parts[0] = _subdomain.toSlice();
    parts[1] = rootName.toSlice();
    string memory name = ".".toSlice().join(parts);
    return name;
  }

  /**
   * @notice Checks if a message was signed by a registered signer
   * @param _name the subdomain name
   * @param _nonce the replay prevention counter
   * @param _sig the signature
   * @return true, if verification is successful, false otherwise
   */
  function isValidSigner(
    string memory _name,
    uint256 _nonce,
    bytes memory _sig
  ) internal returns (bool) {
    require(!isNonceUsed[_nonce], "M: Invalid Nonce!");
    isNonceUsed[_nonce] = true;
    // generate message hash
    bytes32 msgHash = generateHash(_name, _nonce);

    // prefix message hash
    bytes32 ethHash = ethSignedHash(msgHash);

    // get signer
    address signer = recover(ethHash, _sig);
    return isSigner[signer];
  }

  // ---------------------
  // ENS STUFF
  // ---------------------
  /**
   * @notice Batch register subdomains and set the forward ENS.
   * @dev reverts if unauthorized or unqeual array lengths
   * @param _names the names of the subdomains
   * @param _owners the addresses for the forward ENS
   */
  function batchRegisterDomains(string[] memory _names, address[] memory _owners) public onlyOwner {
    for (uint256 i = 0; i < _names.length; i++) {
      bytes32 labelHash = keccak256(abi.encodePacked(_names[i]));
      bytes32 subNode = keccak256(abi.encodePacked(rootNode, labelHash));
      ens.setSubnodeRecord(rootNode, labelHash, address(this), address(ensResolver), 0);
      ensResolver.setAddr(subNode, _owners[i]);
      string memory fullName = getFullName(_names[i]);
      ensResolver.setName(subNode, fullName);
      ens.setSubnodeOwner(subNode, labelHash, _owners[i]);
    }
  }

  // ---------------------
  // PAYMENT STUFF
  // ---------------------
  /**
   * @notice Register token for payments
   * @dev reverts if unauthorized
   * @param _token the address of the token contract
   * @param _monthlyFee the monthly fee
   * @param _yearlyFee the yearly fee
   */
  function allowToken(
    address _token,
    uint256 _monthlyFee,
    uint256 _yearlyFee
  ) public onlyOwner {
    isPaymentToken[_token] = true;
    monthlyTokenFee[_token] = _monthlyFee;
    yearlyTokenFee[_token] = _yearlyFee;
  }

  /**
   * @notice Remove token from payment token register
   * @dev reverts if unauthorized
   * @param _token the address of the token contract
   */
  function disallowToken(address _token) public onlyOwner {
    delete isPaymentToken[_token];
    delete monthlyTokenFee[_token];
    delete yearlyTokenFee[_token];
  }

  /**
   * @notice Pay the monthly fee
   * @dev reverts if the chosen token is not a registered payment token
   *      or if the allowance for the token was not set
   * @param _from who is paying for the contract
   * @param _contract the contract that is being paid for
   * @param _token the chosen token contract address
   */
  function payMonthlyFee(
    address _from,
    address payable _contract,
    address _token
  ) public isAllowed(_token) {
    uint256 fee = monthlyTokenFee[_token];
    IERC20 tkn = IERC20(_token);
    uint256 prevBalance = tkn.balanceOf(address(this));
    tkn.transferFrom(_from, address(this), fee);
    uint256 afterBalance = tkn.balanceOf(address(this));
    require(afterBalance == prevBalance + fee, "M: Payment failed. Funds were not received.");
    DethlifyContract(_contract).markPaid(1);
  }

  /**
   * @notice Pay the yearly fee
   * @dev reverts if the chosen token is not a registered payment token
   *      or if the allowance for the token was not set
   * @param _from who is paying for the contract
   * @param _contract the contract that is being paid for
   * @param _token the chosen token contract address
   */
  function payYearlyFee(
    address _from,
    address payable _contract,
    address _token
  ) public isAllowed(_token) {
    uint256 fee = yearlyTokenFee[_token];
    IERC20 tkn = IERC20(_token);
    uint256 prevBalance = tkn.balanceOf(address(this));
    tkn.transferFrom(_from, address(this), fee);
    uint256 afterBalance = tkn.balanceOf(address(this));
    require(afterBalance == prevBalance + fee, "M: Payment failed. Funds were not received.");
    DethlifyContract(_contract).markPaid(12);
  }

  /**
   * @notice Check if manager allows payment with given token
   * @param _token the address of the token
   * @return true if allowed, false otherwise
   */
  function isTokenAllowed(address _token) public view returns (bool) {
    return isPaymentToken[_token];
  }

  /**
   * @notice Get the monthly fee of the token
   * @param _token the address of the token contract
   * @return the monthly token fee
   */
  function getMonthlyFee(address _token) public view isAllowed(_token) returns (uint256) {
    return monthlyTokenFee[_token];
  }

  /**
   * @notice Get the yearly fee of the token
   * @param _token the address of the token contract
   * @return the monthly token fee
   */
  function getYearlyFee(address _token) public view isAllowed(_token) returns (uint256) {
    return yearlyTokenFee[_token];
  }

  // ---------------------
  // IMPLEMENTATION STUFF
  // ---------------------
  /**
   * @notice Get the address of the implementation of a given function signature
   * @dev will return address(0x0) if no implementation is set
   * @param _version the requested version identifier
   * @param _b the function signature
   * @return the address of the implementation
   */
  function getImplementationAddress(string memory _version, bytes4 _b)
    public
    view
    returns (address payable)
  {
    return implementations[_version][_b];
  }

  /**
   * @notice Set a new version
   * @dev reverts if the version already exists
   * @param _version the new version identifier
   * @param _b the list of function signatures
   * @param _a the list of implementation addresses
   */
  function setNewVersionImplementation(
    string memory _version,
    bytes4[] memory _b,
    address[] memory _a
  ) public onlyOwner noOverwrite(_version) {
    for (uint256 i = 0; i < _b.length; i++) {
      implementations[_version][_b[i]] = payable(_a[i]);
    }
    lastVersion = _version;
    versions.push(lastVersion);
  }

  // ---------------------
  // TRANSFER STUFF
  // ---------------------
  /**
   * @notice Transfer either ETH or token funds
   * @dev reverts if unauthorized or if the transfer failed
   * @param _to the recipient's address
   * @param _amount the amount
   */
  function transfer(
    address payable _to,
    address _token,
    uint256 _amount
  ) public onlyOwner {
    if (_token == address(0x0)) {
      (bool success, ) = _to.call.value(_amount)("");
      require(success, "M: Transfer failed!");
    } else {
      IERC20 tkn = IERC20(_token);
      tkn.transfer(_to, _amount);
    }
  }

  // ---------------------
  // DEPLOY NEW CONTRACT
  // ---------------------
  /**
   * @notice Deploy new dethlify contract
   * @dev reverts if signature is invalid
   * @param _owner the contract owner
   * @param _heirs the contract heirs
   * @param _dist the initial ETH distribution
   * @param _lock the lock period
   * @param _proxy the address of the ManagerProxy
   * @param _name the requested ENS subdomain
   * @param _nonce the nonce needed for the signature message
   * @param _sig the signature
   */
  function deploy(
    address payable _owner,
    address[] memory _heirs,
    uint256[] memory _dist,
    uint256 _lock,
    address payable _proxy,
    string memory _name,
    uint256 _nonce,
    bytes memory _sig
  ) public payable {
    // verify signature
    require(isValidSigner(_name, _nonce, _sig), "M: Invalid Signature!");

    // deploy new contract
    Dethlify p = new Dethlify(_owner, _heirs, _dist, _lock, _proxy);
    address(p).transfer(msg.value);

    // set owner of subdomain to manager
    bytes32 labelHash = keccak256(abi.encodePacked(_name));
    bytes32 subNode = keccak256(abi.encodePacked(rootNode, labelHash));
    ens.setSubnodeRecord(rootNode, labelHash, address(this), address(ensResolver), 0);

    // set resolver address
    ensResolver.setAddr(subNode, address(p));

    // set name
    string memory fullName = getFullName(_name);
    ensResolver.setName(subNode, fullName);

    // make contract owner of the subdomain
    ens.setSubnodeOwner(subNode, labelHash, address(p));

    // make contract claim ENS name for reverse registry
    p.claimENS(_name);

    emit Deploy(address(p));
  }
}
