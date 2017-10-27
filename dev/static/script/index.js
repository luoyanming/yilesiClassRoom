var that,
    ws = null;

var INDEX = {
    init: function() {
        // 进入页面清空sid和token
        localStorage.setItem('sid', '');
        localStorage.setItem('token', '');

        localStorage.removeItem('sessionType');
        localStorage.removeItem('picUrl');
        localStorage.removeItem('answerType');
        localStorage.removeItem('isAnswer');
        localStorage.removeItem('timeClock');
        localStorage.removeItem('answerNum');
        localStorage.removeItem('answerCharts');
        localStorage.removeItem('answerStudent');
        localStorage.removeItem('bindcardData');
        localStorage.removeItem('bindStudentData');
        localStorage.removeItem('canvasData');
        localStorage.removeItem('audioTime');
        localStorage.removeItem('zoom');

        that = this;
        // 心跳包计数
        that.heartCount = 0;

        that.UIInit();
    },
    UIInit: function() {
        
        that.$qrcodeClass = $('#qrcode-class');
        that.$qrcodeLesson = $('#qrcode-lesson');
        that.$qrcodeMaskClass = $("#qrcode-mask-class");
        that.$qrcodeMaskLesson = $("#qrcode-mask-lesson");
        that.$loading = $('#loading');
        that.$reload = $('#reload');
        that.$buttonReload = $('#button-reload');
        that.$buttonClass = $('#button-class');
        that.$buttonLesson = $('#button-lesson');
        that.$textClass = $('#text-class');
        that.$textLesson = $('#text-lesson');
        that.$buttonDownload = $('#button-download');
        that.$buttonDownloadClose = $('#button-download-close');
        that.$downloadModal = $('#modal-download');

        if(that.getQueryString('from') == 'lesson') {
            that.flag = 'lesson';
        } else {
            that.flag = 'class';
        }

        if(that.flag == 'class') {
            that.$buttonLesson.fadeIn(200);
            that.$buttonClass.fadeOut(200);
            that.$textClass.parent().removeClass('text-box-active');
        } else if(that.flag == 'lesson') {
            that.$buttonLesson.fadeOut(200);
            that.$buttonClass.fadeIn(200);
            that.$textClass.parent().addClass('text-box-active');
        }

        that.buttonBind();

        that.webSocketInit();
    },
    webSocketInit: function() {
        that.$qrcodeClass.hide();
        that.$qrcodeLesson.hide();
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
            that.$qrcodeClass.fadeOut(200);
            that.$qrcodeLesson.fadeOut(200);
            that.$qrcodeMaskClass.fadeOut(200);
            that.$qrcodeMaskLesson.fadeOut(200);
            that.$loading.fadeOut(200);
            that.$reload.fadeIn(200);
        };

        //连接成功建立的回调方法
        ws.onopen = function () {
            console.log("WebSocket连接成功");

            that.sendHeartMsg();

            if(that.flag == 'class') {
                that.sendMsg({
                    "bizType": 10000,
                    "data": {
                        "loginType": 1  // 1: 上课； 2: 备课
                    }
                });
            } else if(that.flag == 'lesson') {
                that.sendMsg({
                    "bizType": 10000,
                    "data": {
                        "loginType": 2  // 1: 上课； 2: 备课
                    }
                });
            }
        }

        //接收到消息的回调方法
        ws.onmessage = function (event) {
            that.doReceiveMsg(event.data);
        }

        //连接关闭的回调方法
        ws.onclose = function () {
            console.log("WebSocket连接关闭");
            that.$qrcodeClass.fadeOut(200);
            that.$qrcodeLesson.fadeOut(200);
            that.$qrcodeMaskClass.fadeOut(200);
            that.$qrcodeMaskLesson.fadeOut(200);
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
                if(that.flag == 'class') {
                    // 上课
                    that.$qrcodeClass.attr('src', res.data.qrCodeUrl).fadeIn(200);
                    that.$qrcodeMaskClass.fadeIn(200);
                } else {
                    // 备课
                    that.$qrcodeLesson.attr('src', res.data.qrCodeUrl).fadeIn(200);
                    that.$qrcodeMaskLesson.fadeIn(200);
                }
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

            that.$qrcodeLesson.fadeOut(200);
            that.$qrcodeMaskLesson.fadeOut(200);
            if(that.$qrcodeClass.attr('src')) {
                that.$qrcodeClass.fadeIn(200);
                that.$qrcodeMaskClass.fadeIn(200);
            } else {
                that.$loading.fadeIn(200);
                that.sendMsg({
                    "bizType": 10000,
                    "data": {
                        "loginType": 1  // 1: 上课； 2: 备课
                    }
                });
            }
        });

        // 备课按钮
        that.$buttonLesson.on('click', function() {
            that.$buttonLesson.fadeOut(200);
            that.$buttonClass.fadeIn(200);
            that.$textClass.parent().addClass('text-box-active');
            that.flag = 'lesson';

            that.$qrcodeClass.fadeOut(200);
            that.$qrcodeMaskClass.fadeOut(200);
            if(that.$qrcodeLesson.attr('src')) {
                that.$qrcodeLesson.fadeIn(200);
                that.$qrcodeMaskLesson.fadeIn(200);
            } else {
                that.$loading.fadeIn(200);
                that.sendMsg({
                    "bizType": 10000,
                    "data": {
                        "loginType": 2  // 1: 上课； 2: 备课
                    }
                });
            }
        });

        // 应用下载按钮
        that.$buttonDownload.on('click', function() {
            that.$downloadModal.fadeToggle();
        });

        that.$buttonDownloadClose.on('click', function() {
            that.$downloadModal.fadeToggle();
        });
    },

    // 重新显示二维码
    // relaodQrcodeImg: function() {
    //     that.$qrcodeClass.fadeOut(200);
    //     that.$qrcodeLesson.fadeOut(200);
    //     that.$loading.fadeIn(200);

    //     var reloadXF = setTimeout(function() {
    //         that.$qrcode.fadeIn(200);
    //         that.$loading.fadeOut(200);
    //         clearTimeout(reloadXF);
    //     }, 1000);
    // },

    //
    getQueryString: function(name){
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i"),
            r = window.location.search.substr(1).match(reg);
        if (r != null) return unescape(r[2]); return null;
    }
};

INDEX.init();
