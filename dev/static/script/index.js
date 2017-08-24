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
        that.flag = 'class';
        that.$qrcode = $('#qrcode');
        that.$loading = $('#loading');
        that.$reload = $('#reload');
        that.$buttonReload = $('#button-reload');
        that.$buttonClass = $('#button-class');
        that.$buttonLesson = $('#button-lesson');
        that.$textClass = $('#text-class');
        that.$textLesson = $('#text-lesson');

        that.buttonBind();
    },
    webSocketInit: function() {
        that.$qrcode.hide();
        that.$loading.fadeIn(200);
        that.$reload.hide();

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

                if(that.getQueryString('from') == 'lesson') {
                    that.$buttonLesson.fadeOut(200);
                    that.$buttonClass.fadeIn(200);
                    that.$textClass.parent().addClass('text-box-active');
                    that.flag = 'lesson';
                }
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

            if(that.flag == 'class') {
                // 跳转到课程播放页面
                location.href = './course.html';
            } else if(that.flag == 'lesson') {
                // 跳转到备课页面
                location.href = './lesson.html';
            }
        }
    },

    // 向服务端发送消息
    sendMsg: function(param) {
        ws.send(JSON.stringify(param));
    },

    // 按钮事件绑定
    buttonBind: function() {
        // 刷新按钮
        that.$buttonReload.on('click', function() {
            that.webSocketInit();
        });

        // 上课按钮
        that.$buttonClass.on('click', function() {
            that.$buttonLesson.fadeIn(200);
            that.$buttonClass.fadeOut(200);
            that.$textClass.parent().removeClass('text-box-active');
            that.flag = 'class';

            that.relaodQrcodeImg();
        });

        // 备课按钮
        that.$buttonLesson.on('click', function() {
            that.$buttonLesson.fadeOut(200);
            that.$buttonClass.fadeIn(200);
            that.$textClass.parent().addClass('text-box-active');
            that.flag = 'lesson';

            that.relaodQrcodeImg();
        });
    },

    // 重新显示二维码
    relaodQrcodeImg: function() {
        that.$qrcode.fadeOut(200);
        that.$loading.fadeIn(200);

        var reloadXF = setTimeout(function() {
            that.$qrcode.fadeIn(200);
            that.$loading.fadeOut(200);
            clearTimeout(reloadXF);
        }, 1000);
    },

    //
    getQueryString: function(name){
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i"),
            r = window.location.search.substr(1).match(reg);
        if (r != null) return unescape(r[2]); return null;
    }
};

INDEX.init();
