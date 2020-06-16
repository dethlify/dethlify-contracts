# Dethlify Smart Contracts

Smart contracts for [Dethlify](https://dethlify.com), a type of smart contract wallet that enables trustless inheritance.

## About

Dethlify is built with upgradability in mind. Therefore most of the logic is deployed in multiple `modules`. These modules are accessed using the `delegatecall` function in Solidity. To find out more about how [Dethlify](https://dethlify.com) works, check out our [documentation page](https://docs.dethlify.com).

## Code Organization

The Dethlify smart contracts are organized in four main folders:

- `contracts/administration/`: Contains the logic for our admin contracts
- `contracts/main/`: Contains the logic for all modules and user contracts
- `contracts/interfaces/`: Contains contract interfaces
- `contracts/libs/`: Contains contract libraries

## Quick Setup

To install the dependencies with npm:

`npm install`

## Compile

For now we are using [truffle](https://github.com/trufflesuite/truffle). To compile all contracts, run:

`npm run compile`

## Tests

First run ganache-cli:

`npm run ganache`

Then run the tests in a second terminal session:

`npm run test`

To generate JUnit report, change the `reporter` value to `mocha-junit-reporter` in `truffle-config.js`.

## Coverage

To generate a coverage report simply run this command:

`npm run test:coverage`

## License

See [LICENSE](LICENSE).
