// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

contract Store {
    mapping(address => uint256) public balances;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function withdraw() public onlyOwner {
        payable(owner).transfer(payable(this).balance);
    }

    event Withdraw(address indexed from, uint256 value);

    function withdrawUserBalance() public {
        uint256 amountToWithdraw = balances[msg.sender];
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amountToWithdraw);

        emit Withdraw(msg.sender, amountToWithdraw);
    }

    function balanceOf(address addr) public view returns (uint256) {
        return balances[addr];
    }

    receive() external payable {
        balances[msg.sender] += msg.value;
    }
}
