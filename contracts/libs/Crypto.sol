// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.10;

import "./ECDSA.sol";

/**
 * @title Crypto
 * @dev Helper contract that helps to generate valid hashes for the
 * ENS subdomain registry. It implements the ECDSA receover function
 * to recover the address of the signer.
 * @author Christian Engel - <chris@dethlify.com>
 */
contract Crypto {
  using ECDSA for bytes32;

  /**
   * @dev Generate the hash of hash(namehash(_name), _nonce).
   * This hashed is used to be signed by the Dethlify backend.
   * Without this hash it's not possible to register subdomains.
   *
   * @param _name the subdomain name
   * @param _nonce a counter to prevent replay attacks
   * @return the hash
   */
  function generateHash(string memory _name, uint256 _nonce) public pure returns (bytes32) {
    bytes32 labelHash = keccak256(abi.encodePacked(_name));
    return keccak256(abi.encodePacked(labelHash, _nonce));
  }

  /**
   * @dev Prefixes a given hash to a valid Ethereum Signed Message.
   *
   * @param _messageHash the non-prefixed message hash
   * @return the prefixed hash
   */
  function ethSignedHash(bytes32 _messageHash) public pure returns (bytes32) {
    return _messageHash.toEthSignedMessageHash();
  }

  /**
   * @dev Get the address of a signer.
   *
   * @param _hash the signed hash
   * @param _sig the signature
   * @return the address of the signer
   */
  function recover(bytes32 _hash, bytes memory _sig) public pure returns (address) {
    return _hash.recover(_sig);
  }
}
