require('dotenv').config();
const fs = require('fs');
const path = require('path');
let request = require('request');
var WebSocket = require('ws');
var express = require('express');
const bodyParser = require('body-parser');
var app = express();
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '1000'
}));

function _get_file(filePath) {
    var content = fs.readFileSync(filePath).toString();
    return content;
}

function _log_file(filePath, text) {
    var stream = fs.createWriteStream("./" + filePath);
    stream.once('open', function(fd) {
        stream.write(text);
        stream.end();
    });
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function getTime() {
    var now = new Date();
    return ((now.getMonth() + 1) + '/' + (now.getDate()) + '/' + now.getFullYear() + " " + now.getHours() + ':'
                  + ((now.getMinutes() < 10) ? ("0" + now.getMinutes()) : (now.getMinutes())) + ':' + ((now.getSeconds() < 10) ? ("0" + now
                  .getSeconds()) : (now.getSeconds())));
}


var _data_path = 'data';
var _auth_path = 'auth.txt';
var _logs_path = 'logs.txt';



const wsServer = new WebSocket.Server({
    noServer: true
});

wsServer.on('connection', socket => {
    //console.log('Connected!');

    socket.on('message', (data) => {

        console.log('received: %s', data);

        _data_web = JSON.parse(data);

        switch (_data_web.type) {
            case 'excute': // TYPE == AUTH



                if (_data_web.token) {


                    const options = {
                        url: 'https://proxy.sabagame.com/main/authenticate?token=' + _data_web.token,
                        headers: {
                            'User-Agent': _data_web.useragent,
                            'authority': 'proxy.sabagame.com',
                            'sec-ch-ua': '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
                            'sec-ch-ua-mobile': '?0',
                            'accept': '*/*',
                            'origin': 'https://www.sabagame.com',
                            'sec-fetch-site': 'same-site',
                            'sec-fetch-mode': 'cors',
                            'sec-fetch-dest': 'empty',
                            'referer': 'https://www.sabagame.com/',
                            'accept-language': 'vi,vi-VN;q=0.9,en-US;q=0.8,en;q=0.7'
                        }
                    };


                    request(options, function(err, res, body) {
                        if (err) throw err;

                        json = JSON.parse(body);
                        if (json.isAuthenticated) {
                            console.log('LOGIN SUCCESS!');

                            var msg = JSON.stringify({
                                type: 'notify',
                                data: {
                                    action: 'auth',
                                    type: 'success',
                                    msg: 'STARTED EXCUTE...',
                                    user: {
                                        username: json.username,
                                        session: json.ss
                                    }
                                }
                            });
                            socket.send(msg); // send auth status    

                            _log_file(_data_path + '/' + _auth_path, body); // log auth

                            // CODE HERE

                            var prod_mode = _data_web.prod_mode; // chế độ test, không mất tiền
                            var bet_choice = _data_web.bet_choice; // even là chẵn, odd là lẻ
                            var bet_start = _data_web.bet_start; // bắt đầu bet bằng 1 đồng
                            var bet_change = _data_web.bet_loop; // 3 lần đổi bet 1 lần
                            var bet_false = 0; // số lần bet thua
                            var bet_false_money = 0; // tiền do bet thua cửa lần bet trước
                            var bet_multiply = _data_web.bet_multiply; // x2 nếu thua bet
                            var bet_chip = [1, 5, 10, 50, 100, 200, 500, 1000, 2000]; // mảng chứa các phỉnh bet
                            var bet_chip_pre = []; // mảng này sẽ chứa những phỉnh cần bet
                            var bet_first = 1;
                            var time_bet = randomIntFromInterval(1000, 3000); // thời gian đặt bet sau khi có kết quả
                            var round_id = '';
                            var total_thang = 0;
                            var total_thua = 0;
                            var total_chi = 0;
                            var total_thu = 0;
                            var name = '';
                            var current_money = 0;
                            var now_money = 0;
                            var is_get_info = 0
                            var total_chan = 0;
                            var total_le = 0;
                            var bridge = []; // mảng chứa 6 kết quả cuối cùng


                            // connect tới SABAGAME
                            const ws_options = {
                                headers: {
                                    "Pragma": "no-cache",
                                    "Origin": "https://www.sabagame.com",
                                    "Accept-Language": "vi,vi-VN;q=0.9,en-US;q=0.8,en;q=0.7",
                                    "User-Agent": _data_web.useragent,
                                    "Upgrade": "websocket",
                                    "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
                                    "Cache-Control": "no-cache",
                                    "Connection": "Upgrade",
                                    "Sec-WebSocket-Version": "13"
                                }
                            }



                            var current = new Date().toISOString();

                            var maingame = new WebSocket('wss://proxy.sabagame.com/main/websocket', ws_options);
                            maingame.on('open', function() {
                                maingame.send('{"authentication":{"username":"' + json.username + '","data":{"isAuthenticated":true,"username":"' + json.username + '","language":"vi-VN","ss":"' + json.ss + '","time":"' + current + '","isSSO":true}}}');
                            });
                            maingame.on('message', function(data, flags) {
                                //console.log(data);
                                var authen = JSON.parse(data);
                                if (is_get_info == 0) {
                                    if (authen.Authorized) {
                                        name = authen['user']['name'];
                                        current_money = authen['user']['red'];
                                        now_money = now_money + current_money;

                                        var msg = JSON.stringify({
                                            type: 'userinfo',
                                            data: {
                                                action: 'userinfo',
                                                msg: {
                                                    name: name,
                                                    current_money: current_money
                                                }
                                            }
                                        });
                                    }
                                    socket.send(msg); // send auth status      
                                    is_get_info = 1;
                                }

                            });



                            setTimeout(() => {
                                var sedie = new WebSocket('wss://proxy.sabagame.com/sedie/socket.io/?EIO=3&transport=websocket', ws_options);
                                sedie.on('open', function() {
                                    sedie.send('40/user/xocxoc,');
                                    sedie.send('42/user/xocxoc,["signin",{"isAuthenticated":true,"username":"' + json.username + '","language":"vi-VN","ss":"' + json.ss + '","isSSO":true,"time":"' + current + '"}]');
                                    //sedie.send('42/user/xocxoc,["inGame"]');
                                    setInterval(function() {
                                        sedie.send('2');
                                    }, 60000);
                                });



                                // Xử lý nhận dữ liệu từ SABAGAME
                                sedie.on('message', function(data, flags) {
                                    console.log(data);
                                    var _data = data.split("user/xocxoc,");

                                    if (typeof _data[1] !== 'undefined' && _data[1].length > 0) {
                                        var xocxoc_data = JSON.parse(_data[1]);
                                        if (typeof xocxoc_data[1] !== 'undefined') {
                                            var xocxoc = xocxoc_data[1];

                                            if (xocxoc['totalBets']) {
                                                //console.log('Total Chan: '+ xocxoc['totalBets']['even']+ ' --- Total Le: '+ xocxoc['totalBets']['odd']);

                                                var msg = JSON.stringify({
                                                    type: 'logs',
                                                    data: {
                                                        action: 'totalBets',
                                                        msg: {
                                                            even: xocxoc['totalBets']['even'],
                                                            odd: xocxoc['totalBets']['odd']
                                                        }
                                                    }
                                                });
                                                socket.send(msg); // send auth status    
                                            }



                                            /*** 
                                            if(xocxoc['user']) {
                                              console.log('User: '+ xocxoc['user']['name']+ ' --- Money: '+ xocxoc['user']['red']);
                                              name = xocxoc['user']['name'];
                                              current_money = xocxoc['user']['red'];

                                              var msg = JSON.stringify({
                                                type: 'userinfo',
                                                data: {
                                                  action: 'userinfo',
                                                  msg: {
                                                    name: name,
                                                    current_money: xocxoc['user']['red']
                                                  } 
                                                }
                                              });
                                              socket.send(msg); // send auth status    
                                            }
                                            */



                                            // nếu mà thắng

                                            if (xocxoc['status']) {
                                                if(xocxoc['status']['win']) { // check thắng hay thua
                                                    if (xocxoc['status']['bet']) {
                                                        if (prod_mode) {
                                                            total_thu = total_thu + xocxoc['status']['bet'];

                                                            now_money = now_money + xocxoc['status']['bet'];
                                                            var msg = JSON.stringify({
                                                                type: 'analytic',
                                                                data: {
                                                                    action: 'update_now_money',
                                                                    msg: {
                                                                        now_money: now_money,
                                                                        total_thu: total_thu
                                                                    }
                                                                }
                                                            });
                                                            socket.send(msg); // send auth status   
                                                        }
                                                    }
                                                }
                                            }


                                            if(xocxoc['finish']) {
                                                if (bet_first != 1) { // kiểm tra xem có phải round đầu hay không
                                                    console.log("-----------------------------------------------------------------------------------");
                                                    sedie.send('42/user/xocxoc,["getHistory",{"page":1}]'); // gửi mỗi khi kết thúc phiên để lấy lịch sử
                                                    console.log("-----------------------------------------------------------------------------------");
                                                }
                                            }




                                            if (xocxoc['finish']) { // kiểm tra mở bet hay chưa

                                                var _round_id = xocxoc['finish']['roundId'];

                                                if (xocxoc['finish']['settlementResult']['odd'] == false) { // check kết quả
                                                    var _result = 'even';
                                                } else {
                                                    var _result = 'odd';
                                                }




                                                round_id = _round_id + 1; // gán biến round id để lấy id phiên, vì check finish trước nên không lấy đc id phiên đầu


                                                if (bet_first != 1) { // kiểm tra xem có phải round đầu hay không


                                                    console.log('ROUND: ' + _round_id + ' --- KET QUA: ' + _result);

                                                    // xóa giá trị đầu và thêm vào giá trị cuối của mảng
                                                    if(bridge.length < 4) {
                                                        bridge.push(_result);
                                                    }else {
                                                        bridge.shift();
                                                        bridge.push(_result);
                                                    }

                                                    console.log(bridge);

                                                    var msg = JSON.stringify({
                                                        type: 'showtime',
                                                        data: {
                                                            action: 'bridge',
                                                            msg: {
                                                                bridge: bridge
                                                            }
                                                        }
                                                    });
                                                    socket.send(msg); // send total chan le    



                                                    // + total chan le
                                                    if(_result == 'even') {
                                                        total_chan = total_chan + 1;
                                                    }else {
                                                        total_le = total_le + 1;
                                                    }
                                                    var msg = JSON.stringify({
                                                        type: 'analytic',
                                                        data: {
                                                            action: 'total_chan_le',
                                                            msg: {
                                                                total_chan: total_chan,
                                                                total_le: total_le
                                                            }
                                                        }
                                                    });
                                                    socket.send(msg); // send total chan le    


                                                    if (_result == bet_choice) {
                                                        bet_false = 0;
                                                        bet_false_money = bet_start;
                                                        var status = 'Thắng';
                                                        total_thang = total_thang + 1;
                                                    } else {
                                                        bet_false = bet_false + 1; // +1 lần thua
                                                        var status = 'Thua';
                                                        total_thua = total_thua + 1;
                                                        if (bet_false_money == 0) { // ván trước thắng, nhưng ván này thua mà tiền bet hòa vốn
                                                            bet_false_money = bet_start * bet_multiply + bet_false; // đặt lại số tiền  thua
                                                        } else {
                                                            bet_false_money = bet_false_money * bet_multiply + bet_false; // đặt lại biến cho bằng số tiền cần gỡ
                                                        }

                                                    }


                                                    fs.appendFileSync(_data_path + '/' + _logs_path, status + "\n");
                                                    console.log('| Trạng thái       =====> Bạn ' + status);

                                                    var msg = JSON.stringify({
                                                        type: 'analytic',
                                                        data: {
                                                            action: 'result_bet',
                                                            msg: {
                                                                status: status,
                                                                total_thang: total_thang,
                                                                total_thua: total_thua,
                                                                result_bet_value: _result
                                                            }
                                                        }
                                                    });
                                                    socket.send(msg); // send auth status    

                                                } else {
                                                    bet_false_money = bet_start;
                                                }

                                                bet_first = 0; // xác nhận không phải round đầu nữa 
                                            }




                                            // xocxoc['remainingTime'] = 39s 
                                            // bắt đầu thực hiện hành động khi đếm ngược từ 29s trở xuống - chờ 10s
                                            if (xocxoc['remainingTime']) {

                                                // ĐỔI KIỂU BET
                                                if (bet_change == 0) { // nếu hết số lần đổi cửa thì đảo ngược giá trị của biến
                                                    if (bet_choice == 'even') {
                                                        bet_choice = 'odd';
                                                    } else {
                                                        bet_choice = 'even';
                                                    }
                                                    bet_change = 3;
                                                }
                                                console.log('-------NEXT------');
                                                console.log('| Bạn vừa đặt bet =====> ' + bet_choice);


                                                var msg = JSON.stringify({
                                                    type: 'analytic',
                                                    data: {
                                                        action: 'bet_choice',
                                                        msg: {
                                                            bet_choice: bet_choice
                                                        }
                                                    }
                                                });
                                                socket.send(msg); // send auth status    


                                                if (bet_first != 1) { // kiểm tra xem có phải round đầu hay không

                                                    var msg = JSON.stringify({
                                                        type: 'analytic',
                                                        data: {
                                                            action: 'bet_false_money',
                                                            msg: {
                                                                bet_money: bet_false_money
                                                            }
                                                        }
                                                    });
                                                    socket.send(msg); // send auth status    


                                                    console.log('| Bạn Cược         =====> ' + bet_false_money);
                                                } else {

                                                    var msg = JSON.stringify({
                                                        type: 'analytic',
                                                        data: {
                                                            action: 'bet_false_money',
                                                            msg: {
                                                                bet_money: bet_start
                                                            }
                                                        }
                                                    });
                                                    socket.send(msg); // send auth status    

                                                    console.log('| Bạn Cược         =====> ' + bet_start);
                                                }


                                                console.log('| Số lần thua      =====> ' + bet_false + ' lần');
                                                var msg = JSON.stringify({
                                                    type: 'analytic',
                                                    data: {
                                                        action: 'bet_false',
                                                        msg: {
                                                            bet_false: bet_false
                                                        }
                                                    }
                                                });
                                                socket.send(msg); // send auth status    

                                                setTimeout(function() {
                                                    // chạy loop đánh hết số tiền đang nợ
                                                    var mask_bet_false_money = bet_false_money; // gán mask cho số tiền thua để out khỏi vòng lặp khi lấy đc các phỉnh
                                                    while (true) {
                                                        for (let i = bet_chip.length - 1; i >= 0; i--) {
                                                            if (bet_chip[i] <= mask_bet_false_money) {
                                                                bet_chip_pre.push(bet_chip[i]);
                                                                mask_bet_false_money = mask_bet_false_money - bet_chip[i];
                                                                break;
                                                            }
                                                        }
                                                        if (mask_bet_false_money == 0) break;
                                                    }

                                                    fs.appendFileSync(_data_path + '/' + _logs_path, round_id + "|");
                                                    fs.appendFileSync(_data_path + '/' + _logs_path, bet_choice + "|");



                                                    var msg = JSON.stringify({
                                                        type: 'analytic',
                                                        data: {
                                                            action: 'round_id',
                                                            msg: {
                                                                round_id: round_id
                                                            }
                                                        }
                                                    });
                                                    socket.send(msg); // send auth status    

                                                    bet_chip_pre.forEach(function(item, index) {
                                                        setTimeout(function() {
                                                            // do whatever
                                                            if (prod_mode) {
                                                                sedie.send('42/user/xocxoc,["bet",{"amount":' + item + ',"betChoice":"' + bet_choice + '","freeBet":false}]');
                                                            }

                                                            total_chi = total_chi + item;
                                                            var msg = JSON.stringify({
                                                                type: 'logs',
                                                                data: {
                                                                    action: 'bet_game',
                                                                    msg: {
                                                                        bet_choice: bet_choice,
                                                                        bet_game: item,
                                                                        total_chi: total_chi
                                                                    }
                                                                }
                                                            });
                                                            socket.send(msg); // send auth status    

                                                            now_money = now_money - item;
                                                            var msg = JSON.stringify({
                                                                type: 'analytic',
                                                                data: {
                                                                    action: 'update_now_money',
                                                                    msg: {
                                                                        now_money: now_money,
                                                                        total_thu: total_thu
                                                                    }
                                                                }
                                                            });
                                                            socket.send(msg); // send auth status    

                                                            console.log('=> Đặt phỉnh: ' + item);

                                                            fs.appendFileSync(_data_path + '/' + _logs_path, item + "|");

                                                        }, time_bet * (index + 1));
                                                    });

                                                    // giảm số lần để thay bet
                                                    bet_change = bet_change - 1;

                                                    console.log('| BET chuyển kèo   =====> còn ' + bet_change + ' lần nữa');

                                                    bet_chip_pre = []; // làm trống mảng chứa các phỉnh

                                                    console.log("=================================\n");



                                                }, 10000); // 10s

                                            }

                                            // End Remain Time



                                            if(prod_mode) {
                                                // Lịch Sử 
                                                if(xocxoc['history']) {
                                                    var msg = JSON.stringify({
                                                        type: 'history',
                                                        data: {
                                                            action: 'history_bet',
                                                            msg: {
                                                                round_id: xocxoc['history']['betLogs'][0]['phien'],
                                                                betwin: xocxoc['history']['betLogs'][0]['betwin'],
                                                                even: xocxoc['history']['betLogs'][0]['even'], 
                                                                odd: xocxoc['history']['betLogs'][0]['odd'], 
                                                                result_even: xocxoc['history']['betLogs'][0]['settlementResult']['even'],
                                                                result_odd: xocxoc['history']['betLogs'][0]['settlementResult']['odd']
                                                            }
                                                        }
                                                    });
                                                    socket.send(msg); // send auth status    
                                                }                                            
                                            }



                                        }
                                    }
                                });
                                sedie.on('error', (err) => {
                                    console.log('Loi => ', err)
                                });

                            }, 3000);


                        } else {
                            var msg = JSON.stringify({
                                type: 'notify',
                                data: {
                                    action: 'auth',
                                    type: 'error',
                                    msg: 'Login False'
                                }
                            });
                            socket.send(msg); // send auth status    
                        }

                    });



                } else {
                    var msg = JSON.stringify({
                        type: 'notify',
                        data: {
                            action: 'auth',
                            type: 'error',
                            msg: 'Thiếu Token SABAGAME!'
                        }
                    });
                    socket.send(msg);
                }

                break;
            case 'stop':
                setTimeout(function() {
                    process.exit();
                }, 500);
                break;
            default:
                // code block
        }



    });

})




app.get('/', function(req, res) {
    // res.sendFile(path.join(__dirname + '/views/index.html'));
    res.render("index.ejs", {
        port: process.env.PORT
    });
});

const server = app.listen(process.env.PORT, () => console.log(`Started server at port: ${process.env.PORT}`));

server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request);
    });
});
