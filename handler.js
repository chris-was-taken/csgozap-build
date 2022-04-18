const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
/*
let bots = [
    ["ximvtwl0062","8446trlEQOA","S6KTpOMYhb6teCjYMMNxRNF+Mkg=","kLdwlaWb//jBQpT1/BrDP4J1bAs=",1,false],
    ["cykanahoinugget","Im.Just.Bot312","ZeZqARKaWj0MObetHO1TeoJZ8Ms=","cy9nBLx5nrneMvBDyadl5j5jjLM=",2,false],
    ["rofligercopter","Im.Just.Bot312","FqN/drVFPrw32Gq39lImJ2WkBcE=","PMBCUIzBQYU8aTzCcS3Ekz8gK4s=",3,false],
];*/

if (cluster.isMaster) {
    console.log(`Leader ${process.pid} is running`);

    for (let i = 0; i <= 1; i++) {
        setTimeout(function () {
            cluster.fork()
        },60000*i)
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
        cluster.fork()
    });
} else {
    console.log(`Worker ${process.pid} started`);
/*    console.log("Current bot array is looking like dis")
    console.log(bots)
    bots.forEach(function (val,ind) {
        if(process.bot === undefined && val[5] == false) {
            bots[ind][5] = true
            process.bot = val;
        }
    })*/
    require('./app.js');
}
