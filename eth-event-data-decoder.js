// Load the Web3.js library
const Web3 = require('web3');
// change provider to your unique endpoint
const provider = '';
const web3Provider = new Web3.providers.HttpProvider(provider);
const web3 = new Web3(web3Provider);
const { parse } = require("csv-parse");

// array to xlsx, make sure txndata.csv has a header
var fs = require('fs');
const writeStream = fs.createWriteStream('txndata.csv');
const writeStream2 = fs.createWriteStream('timestamps.csv');
let comma = ",";
txnarray = [];

// Get data of transactions from txndata and store into valhallatxns

// create a read stream into valhallatxns.csv, this reads row by row and parses each transaction
fs.createReadStream("valhallatxns.csv")
  .pipe(parse({ delimiter: ",", from_line: 2 }))
  .on("data", function (row) {

    // Get the transaction receipt for a row
    web3.eth.getTransactionReceipt(row[0]).then((result) => {
        console.log("working on txn: ", row[0]);
        // write the transaction and a comma to delimit data
        writeStream.write(row[0]);
        writeStream.write(comma);

        // transfer log refers to the correct transfer log that contains the contract transfer event we want
        let transferLog = 0
        // here we check if the transfer event hash is the first topic, then confirm it comes from the valhalla address. If true then set to j
        for (var j=0; j<result.logs.length; j++) {
            if (result.logs[j].topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
                // check if valhalla
                if (result.logs[j].address == "0x231d3559aa848Bf10366fB9868590F01d34bF240") {
                    transferLog = j
                }
            }
        }
        // given the correct transfer log, we need to create the event abi to decode the paramters
        let addressFrom = result.logs[transferLog].topics[1];
        let addressTo = result.logs[transferLog].topics[2].replace("0x", "");
        let nftId = result.logs[transferLog].topics[3].replace("0x", "");
        // topic data is the event abi that we need to decode
        let topicData = addressFrom.concat(addressTo).concat(nftId);
        // decode topic data
        let decodedData = web3.eth.abi.decodeParameters(['address', 'address', 'uint256'], topicData);
        // write the decoded data into the csv delimited by comma
        for(var i=0;i<decodedData.__length__;i++){
            writeStream.write(decodedData[i]);
            writeStream.write(comma);
        }
        let wethTransferLog = -1
        // see if any WETH was transacted for the NFT
        for (var j=0; j<result.logs.length; j++) {
            if (result.logs[j].topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
                if (result.logs[j].address == "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2") {
                    // multiple transfers of weth may happen, so lets confirm address from and address to are the intended ones
                    let addressFromWETH = result.logs[j].topics[1];
                    let addressToWETH = result.logs[j].topics[2].replace("0x", "");
                    let topicDataWETH = addressFromWETH.concat(addressToWETH)
                    let decodedDataWETH = web3.eth.abi.decodeParameters(['address', 'address'], topicDataWETH);
                    if (decodedDataWETH[0] == decodedData[1] && decodedDataWETH[1] == decodedData[0]) {
                        wethTransferLog = j
                    }
                }
            }
        }
        if (wethTransferLog > -1) {
            writeStream.write(parseInt(result.logs[wethTransferLog].data, 16).toString())
            writeStream.write(comma);
        }
        else {
            writeStream.write("0");
            writeStream.write(comma);
        }
    });
    // at the very end, we'd also like other meta data - here i want to know the time stamp and append to the very end
    // using a different write stream since itll be easier to append this data in python later
    web3.eth.getTransactionReceipt(row[0]).then((result) => {
        web3.eth.getBlock(result.blockNumber).then((blockData) => {
            writeStream2.write(blockData.timestamp.toString());
            writeStream2.write(comma);
        });
    })
})
