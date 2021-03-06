$(function() {
var that,
    ws = null;

var INDEX = {
    init: function() {
        if (document.referrer == '') {
            localStorage.setItem('sid', '');
            localStorage.setItem('token', '');

            this.clearLocalStorage();

            localStorage.removeItem('bindcardData');
            localStorage.removeItem('bindStudentData');
            localStorage.removeItem('zoom');
            localStorage.removeItem('PresentationStep');
        }

        that = this;
        that.UIInit();


        that.$connection.hide();
        that.$screen.hide();
        that.showLoading('正在连接爱智慧岛课堂...');

        that.sid = localStorage.getItem('sid');
        that.token = localStorage.getItem('token');
        if (that.sid && that.token) {
            that.webSocketInit();
        } else {
            location.href = './index.html?from=class&v=' + CONFIG.version;
        }

        // 心跳包计数
        that.heartCount = 0;

        $(window).unbind('resize');
        $(window).on('resize', function() {
            // 登陆成功之后的操作
            if (localStorage.getItem('picUrl')) {
                // 如果有缓存（表示上课过程中刷新页面）
                that.showImage(localStorage.getItem('answerType'), localStorage.getItem('isAnswer'), localStorage.getItem('picUrl'), localStorage.getItem('htmlUrl'), '');
            } else {
                that.$connection.fadeIn(200);
                that.$screen.fadeIn(200);
                that.$loading.fadeOut(200);
            }

            // 刷新页面，图片显示完成后显示缓存内容
            that.showSessionMask();
        });

        window.addEventListener('message', function(e) {
            console.log(e)
            localStorage.setItem('PresentationStep', e.data)
            console.log('PresentationStep: ', localStorage.getItem('PresentationStep'))
        }, false)
    },
    UIInit: function() {
        that.audioCurrenttimeTimeout;

        that.$course = $('#course');
        that.$connection = $('#connection');
        that.$loading = $('#loading');
        that.$screen = $('#screen');
        that.$courseImg = $('#courseImg');
        that.$courseIframe = $('#courseIframe');
        that.$audioBox = $('#audioBox');
        that.$audio = $('#audio');
        that.$toolbar = $('#toolbar');
        that.$buttonVoice = $('#button-voice');
        that.$buttonVoice.hide();
        that.$buttonRefresh = $('#button-refresh');
        that.$buttonFullscreen = $('#button-fullscreen');
        that.$bindcard = $('#bindcard');
        that.$bindlist = $('#bindlist');

        that.checkBrowserAutoPlayAudio().then(autoplay => {
            // console.log(autoplay)
            if (autoplay) {
                that.$buttonVoice.addClass('voice-on').show();
                that.$audioBox.find('.audiotips').hide();
                // document.getElementById('audio').removeAttribute('autoplay');
                document.getElementById('audio').removeAttribute('mute');
            } else {
                that.$buttonVoice.removeClass('voice-on').show();
                that.$audioBox.find('.audiotips').show();
                // document.getElementById('audio').autoplay = 'autoplay';
                document.getElementById('audio').muted = true;
            }
        })

        that.$buttonVoice.unbind('click');
        that.$buttonVoice.on('click', that.buttonVoiceBind);

        that.$buttonRefresh.unbind('click');
        that.$buttonRefresh.on('click', that.buttonRefreshBind);

        that.$buttonFullscreen.unbind('click');
        that.$buttonFullscreen.on('click', that.buttonFullscreenBind);
    },
    webSocketInit: function() {
        //判断当前浏览器是否支持WebSocket
        if ('WebSocket' in window) {
            ws = new WebSocket('ws://' + CONFIG.online);
        } else {
            alert('当前浏览器不支持 webSocket, 请更换最新版谷歌浏览器！');
        }

        //连接发生错误的回调方法
        // ws.onerror = function () {
        //     console.log("连接爱智慧岛课堂失败，点击确定重连");
        //     ws = null;
        //     ws.close();
        //     that.webSocketInit();
        // };

        //连接成功建立的回调方法
        ws.onopen = function() {
            console.log("WebSocket连接成功");

            that.sendHeartMsg();

            // 向服务端发送登录请求
            that.sendMsg({
                "bizType": 10002,
                "sid": that.sid,
                "token": that.token,
                "data": {
                    "loginType": 2
                }
            });
        }

        //接收到消息的回调方法
        ws.onmessage = function(event) {
            that.doReceiveMsg(event.data);
        }

        //连接关闭的回调方法
        ws.onclose = function() {
            console.log("WebSocket连接关闭");

            ws.close();
            ws = null;

            if (that.closeType == 'tick') {
                // 被踢、退出同屏
            } else {
                that.$screen.hide();
                that.showLoading('连接已断开，正在重新连接，请稍候');
                that.webSocketInit();
            }
        }

        //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口。
        window.onbeforeunload = function() {
            that.sendMsg({
                bizType: 10011,
                sid: that.sid,
                token: that.token,
                data: {
                    opType: 1001101
                }
            });
            ws.close();
        }
    },

    // 清除缓存
    clearLocalStorage: function() {
        localStorage.removeItem('sessionType');
        localStorage.removeItem('picUrl');
        localStorage.removeItem('htmlUrl');
        localStorage.removeItem('htmlPicList');
        localStorage.removeItem('answerType');
        localStorage.removeItem('isAnswer');
        localStorage.removeItem('timeClock');
        localStorage.removeItem('answerNum');
        localStorage.removeItem('answerCharts');
        localStorage.removeItem('answerStudent');
        localStorage.removeItem('unAnswerStudent');
        // localStorage.removeItem('bindcardData');
        // localStorage.removeItem('bindStudentData');
        localStorage.removeItem('canvasData');
        localStorage.removeItem('audioTime');
        localStorage.removeItem('scale');
        localStorage.removeItem('audioStatus');
        $('.imgbox').removeAttr('style');
        $('.canvas').removeAttr('style');
    },

    // 向服务端发送心跳包
    sendHeartMsg: function() {
        var XF = setInterval(function() {
            if (that.heartCount < 3) {
                that.sendMsg({
                    "bizType": 10006,
                    "data": {}
                });
            } else {
                // clearInterval(XF);
                location.href = location.href;
            }
        }, 5000);
    },

    // 处理接收到的消息
    doReceiveMsg: function(res) {
        res = JSON.parse(res);
        // console.log(res)

        if (res.code == -1) {

        } else if (res.code == 10001) {
            // 心跳包
            that.sendMsg({
                "bizType": 10001,
                "data": {}
            });
        } else if (res.code == 10002) {
            // 登陆成功
            if (localStorage.getItem('picUrl')) {
                // 如果有缓存（表示上课过程中刷新页面）
                that.showImage(localStorage.getItem('answerType'), localStorage.getItem('isAnswer'), localStorage.getItem('picUrl'), localStorage.getItem('htmlUrl'), '');
            } else {
                that.$connection.fadeIn(200);
                that.$screen.fadeIn(200);
                that.$loading.fadeOut(200);
            }

            // 刷新页面，图片显示完成后显示缓存内容
            that.showSessionMask();
        } else if (res.code == 10006) {
            // 收到服务端返回的心跳包回复，心跳计数-1
            that.heartCount -= 1;
        } else if (res.code == 10007) {
            // 账号在其它地方登陆，当前页面被踢下线
            that.closeType = 'tick';
            ws.close();
            alert('您的账号已在其它地点登录，将被强制下线！');
            location.href = './index.html?from=class&v=' + CONFIG.version;
        } else if (res.code == 10014) {
            // 音频操作
            var audio = document.getElementById('audio');

            switch (res.data.opType) {
            case 1: // 开始
                audio.play();
                localStorage.setItem('audioStatus', '1');
                break;
            case 2: // 暂停
                audio.pause();
                localStorage.setItem('audioStatus', '2');
                break;
            case 3: // 重新播放
                audio.currentTime = 0;
                that.setStorageAudioTime(0);
                that.sendAudioMsg(1);
                audio.play();
                localStorage.setItem('audioStatus', '1');
                break;
            case 4: // 前进
                if (audio.currentTime > audio.duration - parseInt(res.data.seconds)) {
                    audio.currentTime = audio.duration;
                } else {
                    audio.currentTime = audio.currentTime + parseInt(res.data.seconds);
                }

                that.setStorageAudioTime(audio.currentTime);
                that.sendAudioMsg(1);
                audio.play();
                localStorage.setItem('audioStatus', '1');
                break;
            case 5: // 后退
                if (audio.currentTime < parseInt(res.data.seconds)) {
                    audio.currentTime = 0;
                } else {
                    audio.currentTime = audio.currentTime - parseInt(res.data.seconds);
                }

                that.setStorageAudioTime(audio.currentTime);
                that.sendAudioMsg(1);
                audio.play();
                localStorage.setItem('audioStatus', '1');
                break;
            default:
                return;
            }
        } else if (res.code == 10015) {
            // PPT动画操作
            if (res.data.pptOpType == 1) {
                // 上一步
                // courseIframe.window.Presentation.Prev();
                that.usePresentation(1)

                // 缓存当前第几步动画
                setTimeout(function() {
                    // localStorage.setItem('PresentationStep', courseIframe.window.Presentation.CurrentStatus().step);
                    // localStorage.setItem('PresentationStep', that.usePresentation(3));
                    that.usePresentation(3)
                }, 200);

                // 发送回执
                that.sendMsg({
                    "bizType": 10015,
                    "sid": that.sid,
                    "token": that.token,
                    "data": {
                        "sourceType": "web",
                        "pptOpType": 1
                    }
                });
            } else if (res.data.pptOpType == 2) {
                // 下一步
                // courseIframe.window.Presentation.Next();
                that.usePresentation(2)
                // 缓存当前第几步动画
                setTimeout(function() {
                    // localStorage.setItem('PresentationStep', courseIframe.window.Presentation.CurrentStatus().step);
                    // localStorage.setItem('PresentationStep', that.usePresentation(3));
                    that.usePresentation(3)
                }, 200);
                // 发送回执
                that.sendMsg({
                    "bizType": 10015,
                    "sid": that.sid,
                    "token": that.token,
                    "data": {
                        "sourceType": "web",
                        "pptOpType": 2
                    }
                });
            }
        } else if (res.code == 80002) {
            // 结束录制
            this.clearLocalStorage();

            that.$connection.fadeIn(200);
            that.$screen.find('#canvas').remove();
            that.$screen.find('.state-before').remove();
            that.$screen.find('.state-doing').remove();
            that.$screen.find('.state-after').remove();
            that.$screen.find('.chart').remove();
            that.$screen.find('.student').remove();
            that.$screen.find('.unAnswer-student').remove();
            that.$courseImg.hide();
            $('#courseIframe').remove();
            that.$audioBox.hide();
            // that.$audioBox.find('#audio').remove();
            document.getElementById('audio').src = '';
            that.$buttonVoice.hide();
            that.$screen.fadeIn(200);
            that.$loading.fadeOut(200);
        } else if (res.code == 80003) {
            // console.log(res)
            // 课件图片
            clearInterval(that.audioCurrenttimeTimeout);

            localStorage.removeItem('zoom');
            localStorage.removeItem('PresentationStep');

            localStorage.setItem('sessionType', '0');
            if (res.data.picHtmlArray) {
                // 初次上课清除缓存
                this.clearLocalStorage();
                localStorage.setItem('recordType', res.data.recordType);

                that.showImage(res.data.answerType, res.data.isAnswer, res.data.picUrl, res.data.htmlUrl, res.data.picHtmlArray);

            } else {
                that.showImage(res.data.answerType, res.data.isAnswer, res.data.picUrl, res.data.htmlUrl, '');
            }
        } else if (res.code == 80004) {
            // 开始答题
            localStorage.setItem('sessionType', '2');
            that.$screen.find('.state-before').remove();
            that.$screen.find('.state-after').remove();
            that.$screen.find('.chart').remove();
            that.startAnswer();
        } else if (res.code == 80005) {
            // 结束答题
            localStorage.setItem('sessionType', '3');
            that.endAnswer();
        } else if (res.code == 80006) {
            // 显示答题结果图表
            localStorage.setItem('sessionType', '4');
            localStorage.setItem('answerCharts', JSON.stringify(res.data.answerInfo));
            that.showAnswerCharts();
        } else if (res.code == 80007) {
            // 显示学生列表
            localStorage.setItem('sessionType', '5');
            localStorage.setItem('answerStudent', JSON.stringify(res.data));
            that.showStudent();
        } else if (res.code == 80008) {
            // 收到服务端的答题学生人数
            localStorage.setItem('answerNum', res.data.answerNum);
            that.$screen.find('.state-doing .text-number .number').html('答题人数：' + res.data.answerNum + '人');
        } else if (res.code == 80009) {
            // 关闭答题结果
            localStorage.setItem('sessionType', '3');
            that.$screen.find('.chart').remove();
            that.endAnswer();
        } else if (res.code == 80010) {
            // 关闭学生姓名页面
            localStorage.setItem('sessionType', '4');
            that.$screen.find('.student').remove();
            that.showAnswerCharts();
        } else if (res.code == 80011) {
            // 关闭同屏
            that.closeType = 'tick';
            ws.close();
            location.href = './index.html?from=class&v=' + CONFIG.version;
        } else if (res.code == 80013) {
            // 显示建班页面
            localStorage.setItem('sessionType', '80');
            localStorage.setItem('bindcardData', JSON.stringify(res.data));
            that.showBindCard();
        } else if (res.code == 80014) {
            // 建班查看学生列表
            localStorage.setItem('sessionType', '80');
            localStorage.setItem('bindStudentData', JSON.stringify(res.data));
            that.showBindStudent();
        } else if (res.code == 80015) {
            // 关闭学生列表
            that.$bindcard.removeClass('bindcard-active').hide();
            that.$connection.fadeIn(300);
        } else if (res.code == 80016) {
            // 显示已绑学生人数
            var bindcardData = JSON.parse(localStorage.getItem('bindcardData'));
            bindcardData.stuNum = res.data.stuNum;
            localStorage.setItem('bindcardData', JSON.stringify(bindcardData));
            that.$bindcard.find(".card-info span").html(res.data.stuNum);
        } else if (res.code == 80017) {
            // 画笔开始
            var canvasData = [];

            if (!localStorage.getItem('canvasData')) {
                canvasData = [];
            } else {
                canvasData = JSON.parse(localStorage.getItem('canvasData'));

                for (var i = 0; i < canvasData.length; i++) {
                    if (canvasData[i].picUrl == localStorage.getItem('picUrl')) {
                        that.canvasInit();
                        return;
                    }
                }
            }

            canvasData.push({
                'picUrl': localStorage.getItem('picUrl'),
                'data': {
                    'width': res.data.initData.width,
                    'height': res.data.initData.height
                }
            });
            localStorage.setItem('canvasData', JSON.stringify(canvasData));

            that.canvasInit();
        } else if (res.code == 80018) {
            // 画布上的点
            var canvasData = JSON.parse(localStorage.getItem('canvasData')),
                points = res.data.points[0],
                picUrl = localStorage.getItem('picUrl');

            for (var i = 0; i < canvasData.length; i++) {
                if (canvasData[i].picUrl == picUrl) {
                    var data = canvasData[i].data;

                    if (data.lines) {
                        for (var j = 0; j < data.lines.length; j++) {
                            if (data.lines[j].lineId == points.lineId) {

                                if (!data.lines[j].location) {
                                    data.lines[j].location = [];
                                }

                                data.lines[j].location.push({
                                    'x': points.x,
                                    'y': points.y
                                });

                                localStorage.setItem('canvasData', JSON.stringify(canvasData));
                                that.drawCanvas();
                                return;
                            }
                        }

                        data.lines.push({
                            'lineId': points.lineId,
                            'color': points.color,
                            'isEraser': points.isEraser,
                            'location': [{
                                'x': points.x,
                                'y': points.y
                            }]
                        });

                        localStorage.setItem('canvasData', JSON.stringify(canvasData));
                        that.drawCanvas();
                        return;
                    } else {
                        data.lines = [];
                        data.lines.push({
                            'lineId': points.lineId,
                            'color': points.color,
                            'isEraser': points.isEraser,
                            'location': [{
                                'x': points.x,
                                'y': points.y
                            }]
                        });

                        localStorage.setItem('canvasData', JSON.stringify(canvasData));
                        that.drawCanvas();
                        return;
                    }
                }
            }
        } else if (res.code == 80019) {
            // 放大漫游
            localStorage.setItem('zoom', JSON.stringify(res.data.zoomObj));

            that.zoomAndMove();
        } else if (res.code == 80020) {
            // 清除画布
            var canvasData = JSON.parse(localStorage.getItem('canvasData')),
                picUrl = localStorage.getItem('picUrl');

            for (var i = 0; i < canvasData.length; i++) {
                if (canvasData[i].picUrl == picUrl) {
                    canvasData[i].data.lines = [];
                    localStorage.setItem('canvasData', JSON.stringify(canvasData));

                    var canvas = document.getElementById('canvas'),
                        context = canvas.getContext('2d');

                    context.clearRect(0, 0, $('#canvas').width(), $('#canvas').height());
                }
            }
        } else if (res.code == 80021) {
            // 显示 尚未答题学生
            localStorage.setItem('sessionType', '6');
            localStorage.setItem('unAnswerStudent', JSON.stringify(res.data));
            that.$screen.find('.state-doing').hide();
            that.showUnAnswerStudent();
        } else if (res.code == 80022) {
            // 关闭 尚未答题学生
            // localStorage.setItem('sessionType', '3');
            that.$screen.find('.unAnswer-student').remove();
            that.$screen.find('.state-doing').show();
            localStorage.setItem('sessionType', '2');
            that.$screen.find('.state-before').remove();
            that.$screen.find('.state-after').remove();
            that.$screen.find('.chart').remove();
            that.startAnswer();
        }
    },

    // 向服务端发送消息
    sendMsg: function(param) {
        ws.send(JSON.stringify(param));
    },

    // 显示课程图片
    showImage: function(answerType, isAnswer, picurl, htmlUrl, htmlPicList) {
        if (picurl != localStorage.getItem('picUrl')) {
            // 如果url和缓存的不一致，表示切换课件，将播放状态置位：2
            // 1：正在播放； 2：暂停
            localStorage.setItem('audioStatus', '2');
            that.sendAudioMsg(2);
            that.showTipsText('暂停中...');
        }
        localStorage.setItem('picUrl', picurl);
        localStorage.setItem('htmlUrl', htmlUrl);
        localStorage.setItem('answerType', answerType);
        localStorage.setItem('isAnswer', isAnswer ? 'true' : '');

        that.$connection.hide();
        that.$screen.hide();
        that.$courseImg.hide();
        $('#courseIframe').remove();
        that.$screen.find('#canvas').remove();
        that.$screen.find('.state-before').remove();
        that.$screen.find('.state-doing').remove();
        that.$screen.find('.state-after').remove();
        that.$screen.find('.chart').remove();
        that.$screen.find('.student').remove();
        that.$screen.find('.unAnswer-student').remove();
        // that.$audioBox.find('#audio').remove();
        document.getElementById('audio').src = '';
        that.$audioBox.hide();
        that.showLoading('正在同步显示手机屏幕，请稍候');

        if (localStorage.getItem('zoom')) {
            that.zoomAndMove();
        }

        if (htmlUrl) {
            // 加载html页面
            that.$buttonVoice.fadeOut(200);

            // var htmlUrl = 'http://b.yilesi.cn/Slide10.html';

            var iframe = document.createElement("iframe");
            iframe.id = 'iframe';
            iframe.src = htmlUrl;
            iframe.style.display = 'none';

            if (iframe.attachEvent) {
                iframe.attachEvent("onload", function() {
                    // that.$screen.find('.imgbox').append('<iframe width="100%" height="100%" src="'+ htmlUrl +'" name="courseIframe" id="courseIframe"></iframe>');
                    that.afterShowImage();
                    $('#iframe').remove();
                    $('#courseIframe').show();

                    that.showPresentation();

                    that.preloadImageHtml(picurl, htmlUrl, htmlPicList);
                });
            } else {
                iframe.onload = function() {
                    // that.$screen.find('.imgbox').append('<iframe width="100%" height="100%" src="'+ htmlUrl +'" name="courseIframe" id="courseIframe"></iframe>');
                    that.afterShowImage();
                    $('#iframe').remove();
                    $('#courseIframe').show();

                    that.showPresentation();

                    that.preloadImageHtml(picurl, htmlUrl, htmlPicList);
                };
            }

            that.$screen.find('.imgbox').append('<iframe width="100%" height="100%" src="' + htmlUrl + '" name="courseIframe" id="courseIframe" style="display: none;"></iframe>');
            document.body.appendChild(iframe);
        } else {
            // 判断课件类型是图片还是MP3

            var picArr = picurl.split('.'),
                picType = picArr[picArr.length - 1];

            if (picType == 'mp3') {
                that.$buttonVoice.fadeIn(200);
                document.getElementById('audio').src = picurl;
                that.handleAudioEvents();
            } else {
                // 图片
                that.$buttonVoice.fadeOut(200);

                var img = new Image(),
                    pageWidth = window.innerWidth,
                    pageHeight = window.innerHeight - 42,
                    pageBL,
                    orientation;

                if (typeof pageWidth != 'number') {
                    if (document.compatMode == 'CSS1Compat') {
                        pageWidth = document.documentElement.clientWidth;
                        pageHeight = document.documentElement.clientHeight - 42;
                    } else {
                        pageWidth = document.body.clientWidth;
                        pageHeight = document.body.clientHeight - 42;
                    }
                }

                pageBL = pageWidth / pageHeight;
                img.crossOrigin = 'anonymous';

                img.onload = function(e) {
                    // 获取图片元信息
                    EXIF.getData(img, function() {
                        orientation = EXIF.getTag(this, 'Orientation');

                        var imgW = img.width,
                            imgH = img.height;

                        switch (orientation) {
                        case undefined: // 原图
                            var imgBL = imgW / imgH;
                            if (imgBL > pageBL) {
                                that.$courseImg.css({
                                    'width': '100%',
                                    'height': 'auto',
                                    '-webkit-transform': 'translate3d(-50%, -50%, 0) rotate(0deg)',
                                    '-moz-transform': 'translate3d(-50%, -50%, 0) rotate(0deg)',
                                    '-ms-transform': 'translate3d(-50%, -50%, 0) rotate(0deg)',
                                    '-o-transform': 'translate3d(-50%, -50%, 0) rotate(0deg)',
                                    'transform': 'translate3d(-50%, -50%, 0) rotate(0deg)'
                                });
                            } else {
                                that.$courseImg.css({
                                    'width': 'auto',
                                    'height': '100%',
                                    '-webkit-transform': 'translate3d(-50%, -50%, 0) rotate(0deg)',
                                    '-moz-transform': 'translate3d(-50%, -50%, 0) rotate(0deg)',
                                    '-ms-transform': 'translate3d(-50%, -50%, 0) rotate(0deg)',
                                    '-o-transform': 'translate3d(-50%, -50%, 0) rotate(0deg)',
                                    'transform': 'translate3d(-50%, -50%, 0) rotate(0deg)'
                                });
                            }

                            break;
                        case 1: // 原图
                            var imgBL = imgW / imgH;
                            if (imgBL > pageBL) {
                                that.$courseImg.css({
                                    'width': '100%',
                                    'height': 'auto',
                                    '-webkit-transform': 'translate3d(-50%, -50%, 0) rotate(0deg)',
                                    '-moz-transform': 'translate3d(-50%, -50%, 0) rotate(0deg)',
                                    '-ms-transform': 'translate3d(-50%, -50%, 0) rotate(0deg)',
                                    '-o-transform': 'translate3d(-50%, -50%, 0) rotate(0deg)',
                                    'transform': 'translate3d(-50%, -50%, 0) rotate(0deg)'
                                });
                            } else {
                                that.$courseImg.css({
                                    'width': 'auto',
                                    'height': '100%',
                                    '-webkit-transform': 'translate3d(-50%, -50%, 0) rotate(0deg)',
                                    '-moz-transform': 'translate3d(-50%, -50%, 0) rotate(0deg)',
                                    '-ms-transform': 'translate3d(-50%, -50%, 0) rotate(0deg)',
                                    '-o-transform': 'translate3d(-50%, -50%, 0) rotate(0deg)',
                                    'transform': 'translate3d(-50%, -50%, 0) rotate(0deg)'
                                });
                            }

                            break;
                        case 3: // 逆时针 180
                            var imgBL = imgW / imgH;
                            if (imgBL > pageBL) {
                                that.$courseImg.css({
                                    'width': '100%',
                                    'height': 'auto',
                                    '-webkit-transform': 'translate3d(-50%, -50%, 0) rotate(-180deg)',
                                    '-moz-transform': 'translate3d(-50%, -50%, 0) rotate(-180deg)',
                                    '-ms-transform': 'translate3d(-50%, -50%, 0) rotate(-180deg)',
                                    '-o-transform': 'translate3d(-50%, -50%, 0) rotate(-180deg)',
                                    'transform': 'translate3d(-50%, -50%, 0) rotate(-180deg)'
                                });
                            } else {
                                that.$courseImg.css({
                                    'width': 'auto',
                                    'height': '100%',
                                    '-webkit-transform': 'translate3d(-50%, -50%, 0) rotate(-180deg)',
                                    '-moz-transform': 'translate3d(-50%, -50%, 0) rotate(-180deg)',
                                    '-ms-transform': 'translate3d(-50%, -50%, 0) rotate(-180deg)',
                                    '-o-transform': 'translate3d(-50%, -50%, 0) rotate(-180deg)',
                                    'transform': 'translate3d(-50%, -50%, 0) rotate(-180deg)'
                                });
                            }
                            break;
                        case 6: // 逆时针270
                            var imgBL = imgH / imgW;
                            if (imgBL > pageBL) {
                                that.$courseImg.css({
                                    'width': 'auto',
                                    'height': pageWidth,
                                    '-webkit-transform': 'translate3d(-50%, -50%, 0) rotate(-270deg)',
                                    '-moz-transform': 'translate3d(-50%, -50%, 0) rotate(-270deg)',
                                    '-ms-transform': 'translate3d(-50%, -50%, 0) rotate(-270deg)',
                                    '-o-transform': 'translate3d(-50%, -50%, 0) rotate(-270deg)',
                                    'transform': 'translate3d(-50%, -50%, 0) rotate(-270deg)'
                                });
                            } else {
                                that.$courseImg.css({
                                    'width': pageHeight,
                                    'height': 'auto',
                                    '-webkit-transform': 'translate3d(-50%, -50%, 0) rotate(-270deg)',
                                    '-moz-transform': 'translate3d(-50%, -50%, 0) rotate(-270deg)',
                                    '-ms-transform': 'translate3d(-50%, -50%, 0) rotate(-270deg)',
                                    '-o-transform': 'translate3d(-50%, -50%, 0) rotate(-270deg)',
                                    'transform': 'translate3d(-50%, -50%, 0) rotate(-270deg)'
                                });
                            }

                            break;
                        case 8: // 逆时针90
                            var imgBL = imgH / imgW;
                            if (imgBL > pageBL) {
                                that.$courseImg.css({
                                    'width': 'auto',
                                    'height': pageWidth,
                                    '-webkit-transform': 'translate3d(-50%, -50%, 0) rotate(-90deg)',
                                    '-moz-transform': 'translate3d(-50%, -50%, 0) rotate(-90deg)',
                                    '-ms-transform': 'translate3d(-50%, -50%, 0) rotate(-90deg)',
                                    '-o-transform': 'translate3d(-50%, -50%, 0) rotate(-90deg)',
                                    'transform': 'translate3d(-50%, -50%, 0) rotate(-90deg)'
                                });
                            } else {
                                that.$courseImg.css({
                                    'width': pageHeight,
                                    'height': 'auto',
                                    '-webkit-transform': 'translate3d(-50%, -50%, 0) rotate(-90deg)',
                                    '-moz-transform': 'translate3d(-50%, -50%, 0) rotate(-90deg)',
                                    '-ms-transform': 'translate3d(-50%, -50%, 0) rotate(-90deg)',
                                    '-o-transform': 'translate3d(-50%, -50%, 0) rotate(-90deg)',
                                    'transform': 'translate3d(-50%, -50%, 0) rotate(-90deg)'
                                });
                            }

                            break;
                        default:

                        }

                        that.$courseImg.attr('src', picurl).show();

                        that.afterShowImage();
                        that.preloadImageHtml(picurl, htmlUrl, htmlPicList);
                    });
                };

                img.src = picurl;
            }
        }
    },

    // 预加载
    preloadImageHtml: function(picUrl, htmlUrl, htmlPicList) {
        if (htmlPicList && htmlPicList.length > 0) {
            localStorage.setItem('htmlPicList', htmlPicList);
        }

        var htmlPicListArray = localStorage.getItem('htmlPicList');
        htmlPicListArray = htmlPicListArray.split(',');

        // console.table(htmlPicListArray)

        var index = 0,
            totalLength = htmlPicListArray.length,
            preloadArray = [];
        if (htmlUrl) {
            // html
            index = htmlPicListArray.indexOf(htmlUrl);
        } else {
            // 图片或MP3
            index = htmlPicListArray.indexOf(picUrl);
        }

        if (totalLength < 7) {
            preloadArray = htmlPicListArray;
        } else {
            if (index < 3) {
                preloadArray.push(htmlPicListArray[0])
                preloadArray.push(htmlPicListArray[1])
                preloadArray.push(htmlPicListArray[2])
                preloadArray.push(htmlPicListArray[3])
                preloadArray.push(htmlPicListArray[4])
            } else if (index > totalLength - 3) {
                preloadArray.push(htmlPicListArray[totalLength - 1])
                preloadArray.push(htmlPicListArray[totalLength - 2])
                preloadArray.push(htmlPicListArray[totalLength - 3])
                preloadArray.push(htmlPicListArray[totalLength - 4])
                preloadArray.push(htmlPicListArray[totalLength - 5])
            } else {
                preloadArray.push(htmlPicListArray[index - 3])
                preloadArray.push(htmlPicListArray[index - 2])
                preloadArray.push(htmlPicListArray[index - 1])
                preloadArray.push(htmlPicListArray[index])
                preloadArray.push(htmlPicListArray[index + 1])
                preloadArray.push(htmlPicListArray[index + 2])
                preloadArray.push(htmlPicListArray[index + 3])
            }
        }


        for (var i = 0; i < preloadArray.length; i++) {
            var preloadItem = preloadArray[i],
                preloadItemIndex = htmlPicListArray.indexOf(preloadItem),
                preloadItemArr = preloadItem.split('.'),
                preloadItemArrLength = preloadItemArr.length,
                preloadItemType = preloadItemArr[preloadItemArrLength - 1];

            if (preloadItemType == 'html') {
                if ($('#iframe-' + preloadItemIndex).length == 0) {
                    var iframe = document.createElement("iframe");
                    iframe.id = 'iframe-' + preloadItemIndex;
                    iframe.src = preloadArray[i];
                    iframe.style.display = 'none';

                    document.body.appendChild(iframe);
                }
            } else if (preloadItemType == 'mp3') {

            } else {
                var img = new Image();
                img.src = preloadItem;
            }
        }
    },


    // 预加载课件图片
    preloadImages: function(list) {
        var images = [];

        for (var i = 0; i < list.length; i++) {
            var picArr = list[i].split('.'),
                picType = picArr[picArr.length - 1];

            if (picType == 'mp3') {

            } else {
                images[i] = new Image();
                images[i].src = list[i];
            }
        }
    },

    // 预加载html
    preloadHtmls: function(list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i]) {
                var iframe = document.createElement("iframe");
                iframe.id = 'iframe-' + i;
                iframe.src = list[i];
                iframe.style.display = 'none';

                document.body.appendChild(iframe);
            }
        }
    },

    // ppt动画缓存步骤播放
    showPresentation: function() {
        if (localStorage.getItem('PresentationStep')) {
            setTimeout(function() {
                // var step = parseInt(localStorage.getItem('PresentationStep')) + 1,
                //     slide = parseInt(courseIframe.window.Presentation.CurrentStatus().slide);

                // courseIframe.window.Presentation.JumpToAnim(step, slide);

                var step = parseInt(localStorage.getItem('PresentationStep')) + 1;

                that.usePresentation(5, step);
            }, 500);
        }
    },

    // ppt调用方法
    usePresentation: function(type, step) {
        // $('#tmp_frame').remove();

        var data = {
            'type': type,
            'step': step || ''
        }

        document.getElementById('tmp_iframe').contentWindow.postMessage(JSON.stringify(data), '*');

    // setTimeout(function() {
    //     if(type == 3) {
    //         //获取第几步
    //         return 0;
    //     }             
    // }, 500)
    },

    // 音频事件绑定
    handleAudioEvents: function() {
        var audio = document.getElementById('audio');

        // 准备就绪
        audio.onloadedmetadata = function() {
            if (that.getStorageAudioTime()) {
                audio.currentTime = that.getStorageAudioTime();
            }

            that.showDuration(audio.duration);

            that.showCurrentTime(audio.currentTime);
            that.setStorageAudioTime(audio.currentTime);
            that.$audioBox.find('.progress-bar').css('width', audio.currentTime / audio.duration * 100 + '%');
            // 定时获取当前播放时间，显示进度条
            clearInterval(that.audioCurrenttimeTimeout);
            that.audioCurrenttimeTimeout = setInterval(function() {
                that.showCurrentTime(audio.currentTime);
                that.setStorageAudioTime(audio.currentTime);
                that.$audioBox.find('.progress-bar').css('width', audio.currentTime / audio.duration * 100 + '%');
            }, 1000);

            that.sendAudioMsg(2);

            if (localStorage.getItem('audioStatus') == '1') {
                audio.play();
            }

            that.$audioBox.show();
            that.afterShowImage();
        };

        // 开始播放
        audio.onplay = function() {
            that.sendAudioMsg(1);
            that.showTipsText('正在播放中...');
        };

        // 暂停
        audio.onpause = function() {
            that.sendAudioMsg(2);
            that.showTipsText('暂停中...');
        };

        // 结束
        audio.onended = function() {
            audio.currentTime = 0;
            that.setStorageAudioTime(0);
            that.sendAudioMsg(2);
            that.showTipsText('播放结束...');
        };
    },

    // 判断浏览器是否能自动播放音频
    checkBrowserAutoPlayAudio: function() {
        // var audio = document.createElement('audio');
        // audio.src = 'data:audio/mpeg;base64,/+MYxAAAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
        // document.body.appendChild(audio);

        // try {
        //     audio.play();
        //     audio.pause();
        //     audio.remove();
        //     return true;
        // } catch (e) {
        //     console.error(e)
        //     return false;
        // }


        return new Promise(resolve => {
            let audio = document.createElement('audio');
            audio.src = 'data:audio/mpeg;base64,/+MYxAAAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
            document.body.appendChild(audio);
            let autoplay = true;
            audio.play().then(() => {
                autoplay = true;
            }).catch(err => {
                autoplay = false;
            }).finally(() => {
                audio.remove();
                resolve(autoplay);
            });
        });
    },

    // 发送音频状态
    sendAudioMsg: function(type) {
        // 1开始 2暂停 3重新播放 4前进 5后退 6准备就绪
        that.sendMsg({
            "bizType": 10014,
            "sid": that.sid,
            "token": that.token,
            "data": {
                "sourceType": "web",
                "mediaType": "audio",
                "opType": type
            }
        });
    },

    // 缓存音频播放时长
    setStorageAudioTime: function(time) {
        var picurl = localStorage.getItem('picUrl'),
            audioTime = JSON.parse(localStorage.getItem('audioTime'));

        if (audioTime) {
            for (var i = 0; i < audioTime.length; i++) {
                if (picurl == audioTime[i].picUrl) {
                    audioTime[i].time = time;
                    localStorage.setItem('audioTime', JSON.stringify(audioTime));
                    return false;
                }
            }

            audioTime.push({
                'picUrl': picurl,
                'time': time
            });
            localStorage.setItem('audioTime', JSON.stringify(audioTime));
            return false;
        } else {
            audioTime = new Array();
            audioTime.push({
                'picUrl': picurl,
                'time': time
            });
            localStorage.setItem('audioTime', JSON.stringify(audioTime));
            return false;
        }
    },

    // 获取缓存的音频播放时长
    getStorageAudioTime: function() {
        var picurl = localStorage.getItem('picUrl'),
            audioTime = JSON.parse(localStorage.getItem('audioTime')),
            time;

        if (audioTime) {
            for (var i = 0; i < audioTime.length; i++) {
                if (picurl == audioTime[i].picUrl) {
                    time = audioTime[i].time;
                }
            }
        } else {
            time = 0;
        }

        return time;
    },

    // 显示课件之外内容
    afterShowImage: function() {
        that.$loading.fadeOut(200);
        that.$screen.fadeIn(200);

        if (!localStorage.getItem('sessionType') || localStorage.getItem('sessionType') == '0') {
            that.showProblem(); // 课件题目
        }

        that.canvasInit();
    },

    // 显示音频提示内容
    showTipsText: function(text) {
        that.$audioBox.find('.text').html(text);
    },

    // 显示音频时长
    showDuration: function(time) {
        that.$audioBox.find('.duration-time').html(that.concatMinuteSecond(time));
    },

    // 显示音频当前播放时间
    showCurrentTime: function(time) {
        that.$audioBox.find('.current-time').html(that.concatMinuteSecond(time));
    },

    // 显示缓存的内容
    showSessionMask: function() {
        if (!localStorage.getItem('sessionType')) {
            return false;
        }

        var sType = parseInt(localStorage.getItem('sessionType'));

        switch (sType) {
        case 0: //课件无答题

            break;
        case 2: //开始答题
            that.startAnswer();
            break;
        case 3: //结束答题
            that.endAnswer();
            break;
        case 4: //答题结果图表
            that.showAnswerCharts();
            break;
        case 5: //答题学生列表
            that.showStudent();
            break;
        case 6: //尚未答题学生列表
            that.showUnAnswerStudent();
            break;
        case 80: //显示绑卡界面
            that.showBindCard();
            break;
        case 81: //显示绑卡学生列表
            that.showBindStudent();
            break;
        default:
            return;
        }
    },

    // 显示题目
    showProblem: function() {
        var answerType = parseInt(localStorage.getItem('answerType')); // 0:无题目 1:单选 2:多选 3:判断

        if (answerType != 0) {
            // 有题目
            if (localStorage.getItem('isAnswer')) {
                // 已答题
                var str = '';
                if(localStorage.getItem('recordType') != 1) { 
                    str += '<div class="state-after">';
                } else {
                    str += '<div class="state-after" style="height: 104px;">';
                }
                if(localStorage.getItem('recordType') != 1) { 
                    str += '<div class="button-detail">查看结果</div>';
                    str += '<p class="text">重新答题</p>';
                } else {
                    str += '<div class="button-detail">重新答题</div>';
                }
                str += '</div>';

                that.$screen.append(str);
            } else {
                switch (answerType) {
                case 1: //单选
                    that.$screen.append('<div class="state-before">答题(单选)</div>');
                    break;
                case 2: //多选
                    that.$screen.append('<div class="state-before">答题(多选)</div>');
                    break;
                case 3: //判断
                    that.$screen.append('<div class="state-before">答题(判断)</div>');
                    break;
                default:
                    that.$screen.append('');
                }
            }
        }
    },

    // 开始答题
    startAnswer: function() {
        var str = '',
            time;

        if (localStorage.getItem('timeClock')) {
            time = JSON.parse(localStorage.getItem('timeClock'));
        } else {
            time = {
                minutes: '00',
                seconds: '00'
            }
        }
        if(localStorage.getItem('recordType') != 1) { 
            str += '<div class="state-doing">';
        } else {
            str += '<div class="state-doing" style="height: 104px;">';
        }
        str += '<p class="text text-time">答题时间：00:' + time.minutes + ':' + time.seconds + '</p>';
        if(localStorage.getItem('recordType') != 1) { 
            str += '<p class="text text-number clearfix"><span class="number">答题人数：' + localStorage.getItem('answerNum') + '人</span><span class="btn-unAnswer">未答</span></p>';
        }
        str += '<div class="button-stop">结束答题</div>';
        str += '</div>';

        that.$screen.find('.state-doing').remove();
        that.$screen.append(str);
        that.timeClock();
    },

    // 结束答题
    endAnswer: function() {
        var str = '';
        if(localStorage.getItem('recordType') != 1) { 
            str += '<div class="state-after">';
        } else {
            str += '<div class="state-after" style="height: 104px;">';
        }
        if(localStorage.getItem('recordType') != 1) { 
            str += '<div class="button-detail">查看结果</div>';
            str += '<p class="text">重新答题</p>';
        } else {
            str += '<div class="button-detail">重新答题</div>';
        }
        str += '</div>';

        // 清除定时器
        clearInterval(that.XF);
        localStorage.removeItem('timeClock');
        that.$screen.find('.state-before').remove();
        that.$screen.find('.state-doing').remove();
        that.$screen.find('.state-after').remove();
        that.$screen.append(str);
    },

    // 显示答题结果
    showAnswerCharts: function() {
        var info = JSON.parse(localStorage.getItem('answerCharts')),
            titlesArr = [],
            optionsArr = [];

        console.log(info)

        if (info.answerType == 3) {
            // 判断题
            titlesArr = ["✓", "✕", '误按', '未答题'];
            optionsArr = [
                {
                    'value': info.numTrue,
                    'width': '',
                    'bgcolor': '#38A0FF',
                    'percent': info.truePercentage
                },
                {
                    'value': info.numFalse,
                    'width': '',
                    'bgcolor': '#FFFD38',
                    'percent': info.falsePercentage
                },
                {
                    'value': info.wrongNum,
                    'width': '',
                    'bgcolor': '#D9D9D9',
                    'percent': info.wrongPercentage
                },
                {
                    'value': info.giveupNum,
                    'width': '',
                    'bgcolor': '#D9D9D9',
                    'percent': info.giveupPercentage
                }
            ];

            if (info.answer == '0' || info.answer == 0) {
                optionsArr[1].bgcolor = '#1EC51D';
                info.answer = "✕";
            } else if (info.answer == '1' || info.answer == 1) {
                optionsArr[0].bgcolor = '#1EC51D';
                info.answer = "✓";
            }
        } else if (info.answerType == 1) {
            // 单选
            titlesArr = ['A', 'B', 'C', 'D', 'E', 'F', '误按', '未答题'];
            optionsArr = [
                {
                    'value': info.numA,
                    'width': '',
                    'bgcolor': '#38A0FF',
                    'percent': info.aPercentage
                },
                {
                    'value': info.numB,
                    'width': '',
                    'bgcolor': '#FFFD38',
                    'percent': info.bPercentage
                },
                {
                    'value': info.numC,
                    'width': '',
                    'bgcolor': '#D71616',
                    'percent': info.cPercentage
                },
                {
                    'value': info.numD,
                    'width': '',
                    'bgcolor': '#D68A16',
                    'percent': info.dPercentage
                },
                {
                    'value': info.numE,
                    'width': '',
                    'bgcolor': '#7A38FF',
                    'percent': info.ePercentage
                },
                {
                    'value': info.numF,
                    'width': '',
                    'bgcolor': '#C238FF',
                    'percent': info.fPercentage
                },
                {
                    'value': info.wrongNum,
                    'width': '',
                    'bgcolor': '#D9D9D9',
                    'percent': info.wrongPercentage
                },
                {
                    'value': info.giveupNum,
                    'width': '',
                    'bgcolor': '#D9D9D9',
                    'percent': info.giveupPercentage
                }
            ];

            var index = titlesArr.indexOf(info.answer);
            optionsArr[index].bgcolor = "#1EC51D";
        } else if (info.answerType == 2) {
            // 多选
            // titlesArr = ['A', 'B', 'C', 'D', 'E', 'F', '答对', '误按', '未答题'];
            titlesArr = ['答对', '答错', '未答题'];
            optionsArr = [
                // { 'value': info.numA, 'width': '', bgcolor: '#38A0FF' },
                // { 'value': info.numB, 'width': '', bgcolor: '#FFFD38' },
                // { 'value': info.numC, 'width': '', bgcolor: '#D71616' },
                // { 'value': info.numD, 'width': '', bgcolor: '#D68A16' },
                // { 'value': info.numE, 'width': '', bgcolor: '#7A38FF' },
                // { 'value': info.numF, 'width': '', bgcolor: '#C238FF' },
                {
                    'value': info.rightNum,
                    'width': '',
                    'bgcolor': '#1EC51D',
                    'percent': info.rightPercentage
                },
                {
                    'value': info.totalWrongNum,
                    'width': '',
                    'bgcolor': '#D9D9D9',
                    'percent': info.totalWrongPercentage
                },
                {
                    'value': info.giveupNum,
                    'width': '',
                    'bgcolor': '#D9D9D9',
                    'percent': info.giveupPercentage
                }
            ];
        }

        var compareArr = [];
        for (var m = 0; m < optionsArr.length; m++) {
            compareArr.push(optionsArr[m].value);
        }
        compareArr.sort(that.compare);
        var max = compareArr.pop();
        for (var i = 0; i < optionsArr.length; i++) {
            optionsArr[i].width = parseInt(optionsArr[i].value) / parseInt(max) * 75;
        }

        var str = '';
        str += '<div class="chart">';
        str += '<div class="chart-box flex-h">';
        str += '<div class="time">答题时间：00:' + that.transMinute(Math.floor(info.costTime / 60)) + ':' + that.transSecond(info.costTime % 60) + '&nbsp;&nbsp;&nbsp;&nbsp;答案：' + info.answer + '</div>';
        str += '<div class="titles">';
        for (var j = 0; j < titlesArr.length; j++) {
            str += '<p class="titles-item">' + titlesArr[j] + '</p>';
        }
        str += '</div>';
        str += '<div class="options flex-a-i">';
        for (var k = 0; k < optionsArr.length; k++) {
            str += '<div class="options-item flex-h">';
            str += '<p class="color-line" style="width: ' + optionsArr[k].width + '%; background: ' + optionsArr[k].bgcolor + ';"></p>';
            str += '<p class="text">' + optionsArr[k].value + '人/'+ optionsArr[k].percent +'</p>';
            str += '</div>';
        }
        str += '</div>';
        str += '</div>';
        str += '</div>';

        that.$screen.find('.state-after').remove();
        that.$screen.append(str);
    },

    // 显示答题学生列表
    showStudent: function() {
        var data = JSON.parse(localStorage.getItem('answerStudent')),
            text = '';

        switch (parseInt(data.answerType)) {
        case 0:
            text = "选择✕的学生";
            break;
        case 1:
            text = "选择✓的学生";
            break;
        case 2:
            text = "选择" + data.rightAnswer + "的学生";
            break;
        case 3:
            text = "答错的学生";
            break;
        case 4:
            text = "未答题的学生";
            break;
        case 7:
            text = "误按的学生";
            break;
        default:
            text = "选择" + data.answerType + "的学生"
        }

        var str = '';
        str += '<div class="student">';
        str += '<div class="student-box">';
        str += "<h2>" + text + "</h2>";
        str += '<div class="s-list">';
        for (var i = 0; i < data.studentList.length; i++) {
            if (data.studentList[i].name) {
                if (data.studentList[i].status == 0) {
                    str += '<p>' + data.studentList[i].name + '</p>';
                } else {
                    if (data.answerType == 3) {
                        str += '<p class="grey ">' + data.studentList[i].name + '<br /><span class="answear">' + data.studentList[i].answer + '<span></p>';
                    } else {
                        str += '<p class="grey">' + data.studentList[i].name + '</p>';
                    }
                }
            } else {
                if (data.studentList[i].status == 0) {
                    str += '<p>&nbsp;</p>';
                } else {
                    str += '<p class="grey">&nbsp;</p>';
                }
            }
        }
        str += '</div>';
        str += '</div>';
        str += '</div>';

        that.$screen.find('.chart').remove();
        that.$screen.append(str);
    },

    // 显示尚未答题学生列表
    showUnAnswerStudent: function() {
        var data = JSON.parse(localStorage.getItem('unAnswerStudent')),
            str = '';

        if (data.studentList.length == 0) {
            str += '<div class="unAnswer-student">';
            str += '<div class="no-list">全部回答完毕</div>';
            str += '</div>';
        } else {
            str += '<div class="unAnswer-student">';
            str += '<div class="student-box">';
            str += "<h2>尚未答题学生</h2>";

            for (var i = 0; i < data.studentList.length; i++) {
                if (data.studentList[i].name) {
                    if (data.studentList[i].status == 0) {
                        str += '<p>' + data.studentList[i].name + '</p>';
                    } else {
                        str += '<p class="grey">' + data.studentList[i].name + '</p>';
                    }
                } else {
                    if (data.studentList[i].status == 0) {
                        str += '<p>&nbsp;</p>';
                    } else {
                        str += '<p class="grey">&nbsp;</p>';
                    }
                }
            }
            str += '</div>';
            str += '</div>';
        }

        that.$screen.find('.state-after').remove();
        that.$screen.append(str);

        that.timeClock();
    },

    // 显示班级绑卡界面
    showBindCard: function() {
        var data = JSON.parse(localStorage.getItem('bindcardData')),
            cardList = ['A', 'B', 'C', 'D', 'E', 'F', '', '1', '0'],
            cardSelectList = data.code.split(''),
            cardHeaderItem = that.$bindcard.find('.card-header .card-item'),
            cardMainItem = that.$bindcard.find('.card-main .card-item');

        cardMainItem.removeClass('selected');
        for (var i = 0; i < cardSelectList.length; i++) {
            if (cardSelectList[i] == '0') {
                cardHeaderItem.eq(i).html('✕');
            } else if (cardSelectList[i] == '1') {
                cardHeaderItem.eq(i).html('✓');
            } else {
                cardHeaderItem.eq(i).html(cardSelectList[i]);
            }

            var index = cardList.indexOf(cardSelectList[i]);
            cardMainItem.eq(index).addClass('selected');
        }
        that.$bindcard.find(".card-info span").html(data.stuNum),
        that.$bindcard.show();

        var cardH = that.$bindcard.height(),
            scale = cardH / 1200;
            // cardBoxH = that.$bindcard.find('.bindcard-box').height(),
            // scale = cardH/cardBoxH;

        that.$bindcard.find('.bindcard-box').css({
            '-webkit-transform': 'translate3d(-50%, -50%, 0) scale(' + scale + ')',
            '-moz-transform': 'translate3d(-50%, -50%, 0) scale(' + scale + ')',
            '-ms-transform': 'translate3d(-50%, -50%, 0) scale(' + scale + ')',
            'transform': 'translate3d(-50%, -50%, 0) scale(' + scale + ')'
        });


        window.showBindStudentXF = setInterval(function() {
            that.showBindStudent();
        }, 30);
    },

    // 显示绑卡学生列表
    showBindStudent: function() {
        var studentData = localStorage.getItem('bindStudentData');

        if (!studentData) {
            return false;
        }

        var data = JSON.parse(studentData);

        if (data.studentList && data.studentList.length > 0) {
            var temp = '';

            for (var i = 0; i < data.studentList.length; i++) {
                if (data.studentList[i].name) {
                    if (data.studentList[i].status == 0) {
                        temp += '<li class="list-item">' + data.studentList[i].name + '</li>';
                    } else {
                        temp += '<li class="list-item grey">' + data.studentList[i].name + '</li>';
                    }
                } else {
                    if (data.studentList[i].status == 0) {
                        temp += '<li class="list-item">&nbsp;</li>';
                    } else {
                        temp += '<li class="list-item grey">&nbsp;</li>';
                    }
                }

            }

            that.$bindlist.find('ul').html(temp);
        } else {
            that.$bindlist.find('ul').html('<li class="no-data">暂无绑定的学生</li>');
        }

        clearInterval(window.showBindStudentXF);


        that.$connection.hide();
        that.$bindcard.addClass('bindcard-active').fadeIn(300);
    },

    // loading
    showLoading: function(text) {
        that.$loading.find('.text').html(text);
        that.$loading.fadeIn(200);
    },

    // 答题计时
    timeClock: function() {
        clearInterval(that.XF);
        if (localStorage.getItem('timeClock')) {
            var cTimeClock = JSON.parse(localStorage.getItem('timeClock')),
                cMinutes = parseInt(cTimeClock.minutes),
                cSeconds = parseInt(cTimeClock.seconds);

            that.clock = cMinutes * 60 + cSeconds;
        } else {
            that.clock = 0;
            that.seconds = 0;
            that.minutes = 0;
        }

        that.XF = setInterval(function() {
            that.clock += 1;
            that.seconds = that.clock % 60;
            that.minutes = Math.floor(that.clock / 60);
            var time = {
                minutes: that.transMinute(that.minutes),
                seconds: that.transSecond(that.seconds)
            };
            that.$screen.find('.state-doing .text-time').html('答题时间：00:' + time.minutes + ':' + time.seconds);

            localStorage.setItem('timeClock', JSON.stringify(time));
        }, 1000);
    },


    // 初始化画布
    canvasInit: function() {
        var picUrl = localStorage.getItem('picUrl'),
            canvasData = JSON.parse(localStorage.getItem('canvasData'));

        if (!canvasData) {
            return false;
        }

        for (var i = 0; i < canvasData.length; i++) {
            if (canvasData[i].picUrl == localStorage.getItem('picUrl')) {
                var data = canvasData[i].data,
                    cw = data.width,
                    ch = data.height,
                    pageWidth = window.innerWidth,
                    pageHeight = window.innerHeight - 42;

                if (typeof pageWidth != 'number') {
                    if (document.compatMode == 'CSS1Compat') {
                        pageWidth = document.documentElement.clientWidth;
                        pageHeight = document.documentElement.clientHeight - 42;
                    } else {
                        pageWidth = document.body.clientWidth;
                        pageHeight = document.body.clientHeight - 42;
                    }
                }
                var pageBL = pageWidth / pageHeight;

                var imgW = $('#courseImg').width(),
                    imgH = $('#courseImg').height(),
                    imgBL = imgW / imgH,
                    imgScale;

                if (imgBL > pageBL) {
                    imgScale = pageWidth / cw;
                    cw = pageWidth;
                    ch = ch * imgScale;
                } else {
                    imgScale = pageHeight / ch;
                    cw = cw * imgScale;
                    ch = pageHeight;
                }

                localStorage.setItem('scale', imgScale);
                that.createCanvas(cw, ch);
                return;
            }
        }
    },

    // 创建 画布
    createCanvas: function(cw, ch) {
        $('.canvas').html('<canvas id="canvas" width="' + cw + '" height="' + ch + '"></canvas>');

        that.drawCanvas();
    },

    // 绘制图像
    drawCanvas: function() {
        var picUrl = localStorage.getItem('picUrl'),
            canvasData = JSON.parse(localStorage.getItem('canvasData')),
            canvas = document.getElementById('canvas'),
            context = canvas.getContext('2d');

        context.clearRect(0, 0, $('#canvas').width(), $('#canvas').height());

        for (var i = 0; i < canvasData.length; i++) {
            if (canvasData[i].picUrl == localStorage.getItem('picUrl')) {
                var lines = canvasData[i].data.lines,
                    scale = localStorage.getItem('scale');

                if (!lines) {
                    return false;
                }


                context.lineCap = 'round';
                context.lineJoin = "round";
                for (var l = 0; l < lines.length; l++) {
                    var color = lines[l].color,
                        isEraser = lines[l].isEraser,
                        location = lines[l].location;

                    if (color == '-2681322') {
                        color = '#D71616'; //red
                    } else if (color == '-13065985') {
                        color = '#38A0FF'; // blue
                    } else {
                        // color = 'rgba(0, 0, 0, 0)';
                    }

                    if (isEraser) {
                        context.globalCompositeOperation = "destination-out";
                        context.lineWidth = 40 * parseFloat(localStorage.getItem('scale'));
                    } else {
                        context.globalCompositeOperation = "source-over";
                        context.lineWidth = 4 * parseFloat(localStorage.getItem('scale'));;
                    }
                    context.beginPath();
                    context.strokeStyle = color;
                    for (var p = 0; p < location.length - 1; p++) {
                        context.moveTo(parseFloat(location[p].x) * scale, parseFloat(location[p].y) * scale);
                        context.lineTo(parseFloat(location[p + 1].x) * scale, parseFloat(location[p + 1].y) * scale);
                    }
                    context.closePath();
                    context.stroke();
                }


                return;
            }
        }
    },

    // 缩放和漫游
    zoomAndMove: function() {
        var zoom = JSON.parse(localStorage.getItem('zoom'));

        var x = zoom.translateX / zoom.width / zoom.zoom * 100,
            y = zoom.translateY / zoom.height / zoom.zoom * 100;

        $('.imgbox').css({
            '-webkit-transform': 'scale(' + zoom.zoom + ') translate3d(' + x + '%, ' + y + '%, 0)',
            '-moz-transform': 'scale(' + zoom.zoom + ') translate3d(' + x + '%, ' + y + '%, 0)',
            '-ms-transform': 'scale(' + zoom.zoom + ') translate3d(' + x + '%, ' + y + '%, 0)',
            '-o-transform': 'scale(' + zoom.zoom + ') translate3d(' + x + '%, ' + y + '%, 0)',
            'transform': 'scale(' + zoom.zoom + ') translate3d(' + x + '%, ' + y + '%, 0)'
        });

        $('.canvas').css({
            '-webkit-transform': 'scale(' + zoom.zoom + ') translate3d(' + x + '%, ' + y + '%, 0)',
            '-moz-transform': 'scale(' + zoom.zoom + ') translate3d(' + x + '%, ' + y + '%, 0)',
            '-ms-transform': 'scale(' + zoom.zoom + ') translate3d(' + x + '%, ' + y + '%, 0)',
            '-o-transform': 'scale(' + zoom.zoom + ') translate3d(' + x + '%, ' + y + '%, 0)',
            'transform': 'scale(' + zoom.zoom + ') translate3d(' + x + '%, ' + y + '%, 0)'
        });
    },

    // 转换 minute
    transMinute: function(minute) {
        if (minute < 10) {
            return '0' + minute;
        } else {
            return minute;
        }
    },

    // 转换 second
    transSecond: function(second) {
        if (second < 10) {
            return '0' + second;
        } else {
            return second;
        }
    },

    // 拼接minute second
    concatMinuteSecond: function(time) {
        time = parseInt(time);

        var m = Math.floor(time / 60),
            s = time % 60;

        return that.transMinute(m) + ':' + that.transSecond(s);
    },

    // 比较大小
    compare: function(value1, value2) {
        if (value1 < value2) {
            return -1;
        } else if (value1 > value2) {
            return 1;
        } else {
            return 0;
        }
    },

    // 点击播放声音控制按钮
    buttonVoiceBind: function() {
        var audio = document.getElementById('audio');

        if (that.$buttonVoice.hasClass('voice-on')) {
            that.$buttonVoice.removeClass('voice-on');
            audio.muted = true;
            that.$audioBox.find('.audiotips').fadeIn(200);
        } else {
            var audio = document.getElementById('audio');
            that.$buttonVoice.addClass('voice-on');
            that.$audioBox.find('.audiotips').fadeOut(200);
            audio.muted = false;
        }
    },

    // 点击刷新按钮事件
    buttonRefreshBind: function() {
        location.href = location.href;
    },

    // 点击全屏按钮事件
    buttonFullscreenBind: function() {
        var isFullscreen = that.isFullscreenForNoScroll();

        if (isFullscreen) {
            that.cancleFullscreen();
        } else {
            that.launchFullscreen(document.documentElement);
        }
    },

    // 展示全屏
    launchFullscreen: function(element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    },

    // 退出全屏
    cancleFullscreen: function() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    },

    // 判断无滚动条页面是否全屏
    isFullscreenForNoScroll: function() {
        var explorer = window.navigator.userAgent.toLowerCase();
        if (explorer.indexOf('chrome') > 0) {
            // webkit
            if (document.body.scrollHeight === window.screen.height && document.body.scrollWidth === window.screen.width) {
                return true;
            } else {
                return false;
            }
        } else {
            // IE 9+  fireFox
            if (window.outerHeight === window.screen.height && window.outerWidth === window.screen.width) {
                return true;
            } else {
                return false;
            }
        }
    }
};

INDEX.init();
});
