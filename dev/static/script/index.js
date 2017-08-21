var that,
    ws = null;

var INDEX = {
    init: function() {
        // 进入页面清空sid和token
        localStorage.setItem('sid', '');
        localStorage.setItem('token', '');

        localStorage.removeItem('picUrl');
        localStorage.removeItem('answerType');
        localStorage.removeItem('isAnswer');

        that = this;
        // 心跳包计数
        that.heartCount = 0;
        that.UIInit();
        that.webSocketInit();
    },
    UIInit: function() {
        that.$qrcode = $('#qrcode');
        that.$loading = $('#loading');
        that.$reload = $('#reload');
        that.$buttonReload = $('#button-reload');

        that.$buttonReload.unbind('click');
        that.$buttonReload.on('click', that.buttonReloadBind);
    },
    webSocketInit: function() {
        that.$qrcode.fadeOut(200);
        that.$loading.fadeIn(200);
        that.$reload.fadeOut(200);

        //判断当前浏览器是否支持WebSocket
        if ('WebSocket' in window) {
            ws = new WebSocket('ws://' + CONFIG.online);
        } else {
            alert('当前浏览器不支持 webSocket, 请更换最新版谷歌浏览器！')
        }

        //连接发生错误的回调方法
        ws.onerror = function () {
            console.log("WebSocket连接发生错误");
            that.$qrcode.fadeOut(200);
            that.$loading.fadeOut(200);
            that.$reload.fadeIn(200);
        };

        //连接成功建立的回调方法
        ws.onopen = function () {
            console.log("WebSocket连接成功");

            that.sendHeartMsg();

            that.sendMsg({
                "bizType": 10000,
                "data": {}
            });
        }

        //接收到消息的回调方法
        ws.onmessage = function (event) {
            that.doReceiveMsg(event.data);
        }

        //连接关闭的回调方法
        ws.onclose = function () {
            console.log("WebSocket连接关闭");
            that.$qrcode.fadeOut(200);
            that.$loading.fadeOut(200);
            that.$reload.fadeIn(200);
        }

        //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口。
        window.onbeforeunload = function () {
            ws.close();
        }
    },

    // 向服务端发送心跳包
    sendHeartMsg: function() {
        var XF = setInterval(function() {
            if(that.heartCount < 3) {
                that.sendMsg({
                    "bizType": 10006,
                    "data": {}
                });
            } else {
                // clearInterval(XF);
                location.href = location.href;
            }
        },5000);
    },

    // 处理接收到的消息
    doReceiveMsg: function(res) {
        res = JSON.parse(res);  
        console.log(res)

        if(res.code == 10000) {
            // 二维码
            var img = new Image();
            img.src = res.data.qrCodeUrl;
            img.onload = function() {
                that.$qrcode.attr('src', res.data.qrCodeUrl).fadeIn(200);
                that.$loading.fadeOut(200);
            }
        } else if(res.code == 10001) {
            // 心跳包
            that.sendMsg({
                "bizType": 10001,
                "data": {}
            });
        } else if(res.code == 10006) {
            // 收到服务端返回的心跳包回复，心跳计数-1
            that.heartCount -= 1;
        }else if(res.code == 80001) {
            // app扫描登录，保存sid和token
            localStorage.setItem('sid', res.data.sid);
            localStorage.setItem('token', res.data.token);

            // 跳转到课程播放页面
            location.href = './course.html';
        }
    },

    // 向服务端发送消息
    sendMsg: function(param) {
        ws.send(JSON.stringify(param));
    },

    // 点击刷新按钮事件
    buttonReloadBind: function() {
        that.webSocketInit();
    }
};

INDEX.init();
