const cpanfileParse = require('../');
cpanfileParse.parseCpanfile(__dirname + '/cpanfile').then((res) => console.log(res));
