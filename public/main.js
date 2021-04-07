$(document).ready(function() {
    $('#user_info').hide();
    $('#stop').hide();

    $('#audio').bootstrapToggle({
        on: 'Bật',
        off: 'Tắt'
    });
    $('#thong_ke_bet').bootstrapToggle({
        on: 'Bật',
        off: 'Tắt'
    });
    $('#prod_mode').bootstrapToggle({
        on: 'Bật',
        off: 'Tắt'
    });

    // auto scroll game logs
    window.setInterval(function() {
        var elem = document.getElementById('logs');
        elem.scrollTop = elem.scrollHeight;
    }, 300);


    $('#token').on('change', function() {
        // Explode Token
        var regex_token = $('#token').val().split('token=');
        if (regex_token[1]) {
            $('#token').val(regex_token[1]);
        }

        if ($('#token').val() == '') {
            $('#userinfo').html();
        }

    });
});

var ws = new WebSocket("ws://localhost:"+port);

// KẾT NỐI ĐƯỢC TỚI SV
ws.onopen = function() {

    $(document).ready(function() {

        $('#excute').click(function() {

            var prod_mode = $('#prod_mode').prop('checked');
            var bet_choice = $('#bet_choice').val();
            var bet_start = $('#bet_start').val();
            var bet_loop = $('#bet_loop').val();
            var bet_multiply = $('#bet_multiply').val();

            var msg = JSON.stringify({
                type: 'excute',
                token: $('#token').val(),
                useragent: navigator.userAgent,
                prod_mode: prod_mode,
                bet_choice: bet_choice,
                bet_start: bet_start,
                bet_loop: bet_loop,
                bet_multiply: bet_multiply
            });
            ws.send(msg);

        });

        $('#stop').click(function() {
            var msg = JSON.stringify({
                type: 'stop'
            });
            ws.send(msg);
            play_audio('stop');
        });

    });



};


// SOCKET NHẬN TỪ SV VỀ
ws.onmessage = function(data) {
    //console.log(data); 
    var _data = JSON.parse(data.data);

    switch (_data.type) {
        case 'notify':
            // authen 
            if (_data.data.action == 'auth') {
                cuteToast({
                    type: _data.data.type,
                    message: _data.data.msg,
                    timer: 5000
                });

                if (_data.data.type == 'success') {
                    $('#user_info').html('<div class="row" id="userinfo"><div class="col-lg-4 col-md-4"><b>Username:</b></div><div class="col-lg-8 col-md-8"><input style="height: 22px;" type="text" readonly id="username" class="form-control" value="' + _data.data.user.username + '"></div><br><div class="col-lg-4 col-md-4"><b>Session:</b></div><div class="col-lg-8 col-md-8"><input style="height: 22px;" type="text" readonly id="username" class="form-control" value="' + _data.data.user.session + '"></div></div>');
                    $('#user_info').show();
                    $('#stop').show();
                    $('#excute').hide();
                } else {
                    $('#user_info').hide();
                    $('#stop').hide();
                    $('#excute').show();
                }

            }
            break;

        case 'userinfo':
            // get user info - money
            if (_data.data.action == 'userinfo') {
                $('#userinfo').prepend('<div class="col-lg-4 col-md-4"><b>Name:</b></div><div class="col-lg-8 col-md-8"><input style="height: 22px;" type="text" readonly id="name" class="form-control" value="' + _data.data.msg.name + '"></div><br>');
                $('#curent_money').html(_data.data.msg.current_money);
                $('#now_money').html(_data.data.msg.current_money);
            }
            break;

        case 'logs':
            // logs 
            if ($($('#thong_ke_bet')).prop("checked")) {
                if (_data.data.action == 'totalBets') {
                    $('#logs').append('Total Chẵn: ' + _data.data.msg.even + ' ---- Total Lẻ: ' + _data.data.msg.odd + '<br>');
                }
            }

            // bet game
            if (_data.data.action == 'bet_game') {
                if (_data.data.msg.bet_choice == 'even') {
                    var choice = "Chẵn";
                } else {
                    var choice = "Lẻ";
                }

                $('#logs').append('===> Cược <b>' + choice + '</b> Phỉnh: <b>' + _data.data.msg.bet_game + '</b><br>');
                $('#total_chi').html(_data.data.msg.total_chi);
            }

            break;

        case 'analytic':
            // kết quả bet
            if (_data.data.action == 'result_bet') {
                $('#result_bet').html(_data.data.msg.status);
                if (_data.data.msg.status == 'Thắng') {
                    play_audio('thang');
                } else {
                    play_audio('thua');
                }
                $('#total_thang').html(_data.data.msg.total_thang);
                $('#total_thua').html(_data.data.msg.total_thua);
                $('#logs').append('===> Kết Quả: ' + _data.data.msg.status + '<br>');
                show_result(_data.data.msg.result_bet_value);
                setTimeout(function() {
                    show_result('');
                }, 5000);
                $('#round_id').html('Đang lấy...');
            }

            // bet bạn đang chọn
            if (_data.data.action == 'bet_choice') {
                if (_data.data.msg.bet_choice == 'even') {
                    var bet_dat = 'Chẵn';
                } else {
                    var bet_dat = 'Lẻ';
                }
                // show_result(_data.data.msg.bet_choice);
                play_audio('bet');
                $('#bet_choicing').html(bet_dat);
                $('#logs').append('===> Đang Đặt <b>' + bet_dat + '</b><br>');
            }

            // tiền đang bet
            if (_data.data.action == 'bet_false_money') {
                $('#bet_money').html(_data.data.msg.bet_money);
                play_audio('cuoc-bet');
            }

            // số lần đang thua so với lúc đầu
            if (_data.data.action == 'bet_false') {
                $('#bet_false').html(_data.data.msg.bet_false);
                $('#logs').append('===> Đang thua <b>' + _data.data.msg.bet_false + '</b> lần <br>');

            }
            
            // total chan va lẻ
            if (_data.data.action == 'total_chan_le') {
                $('#total_chan').html(_data.data.msg.total_chan);
                $('#total_le').html(_data.data.msg.total_le);
            }

            // chuyển round mới
            if (_data.data.action == 'round_id') {
                $('#round_id').html('#' + _data.data.msg.round_id);
                $('#result_bet').html('Đang chờ ...');
                play_audio('finish');
                $('#round_id').addClass('red');
                setTimeout(function() {
                    $('#round_id').removeClass('red');
                }, 3000);
                $('#logs').append('#Round ID: <b>' + _data.data.msg.round_id + '</b><br>');
            }

            // cập nhật tiền hiện tại
            if (_data.data.action == 'update_now_money') {
                $('#now_money').html(_data.data.msg.now_money);
                $('#total_thu').html(_data.data.msg.total_thu);
            }


            break;


        case 'history':
            if(_data.data.action == 'history_bet') {
                var round_id = _data.data.msg.round_id;
                var bet_win = _data.data.msg.betwin;
                var bet_even = _data.data.msg.even;
                var bet_odd = _data.data.msg.odd;
                if(_data.data.msg.result_even == true) {
                    var result = 'Chẵn';
                }else {
                    var result = 'Lẻ';
                }
            }

            if(round_id) {
                var history_row = '<tr><th scope="row" class="text-center">#'+round_id+'</th><td class="text-center">'+bet_even+'</td><td class="text-center">'+bet_odd+'</td><td class="text-center">'+result+'</td><td class="text-center">'+bet_win+'</td></tr>';
                    $('#lichsu').prepend(history_row);
            }
        break;

        case 'showtime':
            if(_data.data.action == 'bridge') {
                var bridge = _data.data.msg.bridge;

                if(Object.keys(bridge).length >= 4) {
                    if(bridge[0] == 'even' &&
                        bridge[1] == 'even' &&
                        bridge[2] == 'odd' &&
                        bridge[3] == 'odd'){
                        console.log('SHOW TIME: 2 chẵn 2 lẻ => '+getTime());
                    }else if(bridge[0] == 'odd' &&
                            bridge[1] == 'odd' &&
                            bridge[2] == 'even' &&
                            bridge[3] == 'even') {
                            console.log('SHOW TIME: 2 lẻ 2 chẵn => '+getTime());
                    }                    
                }
            }
        break;



        default:
            // code block
    }
}

ws.onclose = function() {
    // websocket is closed.
    console.log("Connection is closed...");
    cuteToast({
        type: "error",
        message: "Connection is closed...",
        timer: 5000
    });
};

function show_result(bet) {
    switch (bet) {
        case 'even':
            $('#die-chan').removeClass('die-current');
            $('#die-le').removeClass('die-current');
            $('#die-chan').addClass('die-current');
            break;
        case 'odd':
            $('#die-chan').removeClass('die-current');
            $('#die-le').removeClass('die-current');
            $('#die-le').addClass('die-current');
            break;
        default:
            $('#die-chan').removeClass('die-current');
            $('#die-le').removeClass('die-current');
            break;
    }
}

function play_audio(type) {
    if ($($('#audio')).prop("checked")) {
        var audio = new Audio('media/' + type + '.mp3');
        audio.play();
    }

}

function getTime() {
    var now = new Date();
    return ((now.getMonth() + 1) + '/' + (now.getDate()) + '/' + now.getFullYear() + " " + now.getHours() + ':'
                  + ((now.getMinutes() < 10) ? ("0" + now.getMinutes()) : (now.getMinutes())) + ':' + ((now.getSeconds() < 10) ? ("0" + now
                  .getSeconds()) : (now.getSeconds())));
}