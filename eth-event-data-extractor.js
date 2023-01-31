// Load the Web3.js library
const Web3 = require('web3');
// change provider to your unique endpoint
const provider = '';
const web3Provider = new Web3.providers.HttpProvider(provider);
const web3 = new Web3(web3Provider);

// array to xlsx
var fs = require('fs');
const writeStream = fs.createWriteStream('data.csv');

// this abi belongs to Valhalla
var abi_ = [
{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},
{"indexed":true,"internalType":"address","name":"to","type":"address"},
{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"}]

// smart contact address for valhalla
const smartContractAddress = "0x231d3559aa848Bf10366fB9868590F01d34bF240"
const contract = new web3.eth.Contract(abi_, smartContractAddress)

var transactionHashArr = [];
let string = ","

// the starting block and the ending block, iterates every 100 blocks as quicknode will throttle extraction
for( var j = 16441066; j < 16443002; j = j + 100) {
  var k = j + 100
  // get past events that are transfers
  contract.getPastEvents('Transfer', {
    fromBlock: j,
    toBlock: k
  }, function(error, events){
    if(!error){
        for(var i=0;i<events.length;i++){
            transactionHashArr.push(events[i].transactionHash)
            writeStream.write(events[i].transactionHash);
            writeStream.write(string);
        }
        //temp = ('[ "' + transactionHashArr.join('","') + '" ]\n')
        //writeStream.write(temp);
    }
  })
}
