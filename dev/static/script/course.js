var that,
    ws = null;

var INDEX = {
    init: function() {
        if(document.referrer == '') {
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
        }

        that = this;
        that.UIInit();

        that.$connection.hide();
        that.$screen.hide();
        that.showLoading('正在连接易乐思课堂...');

        that.sid = localStorage.getItem('sid');
        that.token = localStorage.getItem('token');
        if(that.sid && that.token) {
            that.webSocketInit();
        } else {
            location.href = './index.html?from=class';
        }

        // 心跳包计数
        that.heartCount = 0;

        $(window).unbind('resize');
        $(window).on('resize', function() {
            location.href = location.href;
        });
    },
    UIInit: function() {
        that.$course = $('#course');
        that.$connection = $('#connection');
        that.$loading = $('#loading');
        that.$screen = $('#screen');
        that.$courseImg = $('#courseImg');
        that.$toolbar = $('#toolbar');
        that.$buttonRefresh = $('#button-refresh');
        that.$buttonFullscreen = $('#button-fullscreen');
        that.$bindcard = $('#bindcard');
        that.$bindlist = $('#bindlist');

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
        //     console.log("连接易乐思课堂失败，点击确定重连");
        //     ws = null;
        //     ws.close();
        //     that.webSocketInit();
        // };

        //连接成功建立的回调方法
        ws.onopen = function () {
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
        ws.onmessage = function (event) {
            that.doReceiveMsg(event.data);
        }

        //连接关闭的回调方法
        ws.onclose = function () {
            console.log("WebSocket连接关闭");

            ws.close();
            ws = null;
            that.$screen.hide();
            that.showLoading('连接已断开，正在重新连接，请稍候');
            that.webSocketInit();
        }

        //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口。
        window.onbeforeunload = function () {
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

        if(res.code == -1) {

        } else if(res.code == 10001) {
            // 心跳包
            that.sendMsg({
                "bizType": 10001,
                "data": {}
            });
        } else if(res.code == 10002) {
            // 登陆成功
            if(localStorage.getItem('picUrl')) {
                // 如果有缓存（表示上课过程中刷新页面）
                that.showImage(localStorage.getItem('picUrl'), localStorage.getItem('answerType'), localStorage.getItem('isAnswer'));
            } else {
                that.$connection.fadeIn(200);
                that.$screen.fadeIn(200);
                that.$loading.fadeOut(200);
            }

            // 刷新页面，图片显示完成后显示缓存内容
            that.showSessionMask();
        } else if(res.code == 10006) {
            // 收到服务端返回的心跳包回复，心跳计数-1
            that.heartCount -= 1;
        } else if(res.code == 10007) {
            // 账号在其它地方登陆，当前页面被踢下线
            ws.close();
            alert('您的账号已在其它地点登录，将被强制下线！');
            location.href = './index.html?from=class';
        } else if(res.code == 80002) {
            // 结束录制
            localStorage.removeItem('sessionType');
            localStorage.removeItem('picUrl');
            localStorage.removeItem('answerType');
            localStorage.removeItem('isAnswer');
            localStorage.removeItem('timeClock');
            localStorage.removeItem('answerNum');
            localStorage.removeItem('answerCharts');
            localStorage.removeItem('answerStudent');
            // localStorage.removeItem('bindcardData');
            // localStorage.removeItem('bindStudentData');
            localStorage.removeItem('canvasData');

            that.$connection.fadeIn(200);
            that.$screen.find('#canvas').remove();
            that.$screen.find('.state-before').remove();
            that.$screen.find('.state-doing').remove();
            that.$screen.find('.state-after').remove();
            that.$screen.find('.chart').remove();
            that.$screen.find('.student').remove();
            that.$courseImg.hide();
            that.$screen.fadeIn(200);
            that.$loading.fadeOut(200);
        } else if(res.code == 80003) {
            // 课件图片
            localStorage.setItem('sessionType', '0');
            if(res.data.picList) {
                that.showImage(res.data.picUrl, res.data.answerType, res.data.isAnswer, res.data.picList);
            } else {
                that.showImage(res.data.picUrl, res.data.answerType, res.data.isAnswer);
            }
        } else if(res.code == 80004) {
            // 开始答题
            localStorage.setItem('sessionType', '2');
            that.$screen.find('.state-before').remove();
            that.$screen.find('.state-after').remove();
            that.$screen.find('.chart').remove();
            that.startAnswer();
        } else if(res.code == 80005) {
            // 结束答题
            localStorage.setItem('sessionType', '3');
            that.endAnswer();
        } else if(res.code == 80006) {
            // 显示答题结果图表
            localStorage.setItem('sessionType', '4');
            localStorage.setItem('answerCharts', JSON.stringify(res.data.answerInfo));
            that.showAnswerCharts();
        } else if(res.code == 80007) {
            // 显示学生列表
            localStorage.setItem('sessionType', '5');
            localStorage.setItem('answerStudent', JSON.stringify(res.data));
            that.showStudent();
        } else if(res.code == 80008) {
            // 收到服务端的答题学生人数
            localStorage.setItem('answerNum', res.data.answerNum);
            that.$screen.find('.state-doing .text-number').html('答题人数：' + res.data.answerNum + '人');
        } else if(res.code == 80009) {
            // 关闭答题结果
            localStorage.setItem('sessionType', '3');
            that.$screen.find('.chart').remove();
            that.endAnswer();
        } else if(res.code == 80010) {
            // 关闭学生姓名页面
            localStorage.setItem('sessionType', '4');
            that.$screen.find('.student').remove();
            that.showAnswerCharts();
        } else if(res.code == 80011) {
            // 关闭同屏
            ws.close();
            location.href = './index.html?from=class';
        } else if(res.code == 80013) {
            // 显示建班页面
            localStorage.setItem('sessionType', '80');
            localStorage.setItem('bindcardData', JSON.stringify(res.data));
            that.showBindCard();
        } else if(res.code == 80014) {
            // 建班查看学生列表
            localStorage.setItem('sessionType', '81');
            localStorage.setItem('bindStudentData', JSON.stringify(res.data));
            that.showBindStudent();
        } else if(res.code == 80015) {
            // 关闭学生列表
            that.$bindcard.removeClass('bindcard-active').hide();
            that.$bindlist.hide();
            that.$connection.fadeIn(300);
        } else if(res.code == 80016) {
            // 显示已绑学生人数
            var bindcardData = JSON.parse(localStorage.getItem('bindcardData'));
            bindcardData.stuNum = res.data.stuNum;
            localStorage.setItem('bindcardData', JSON.stringify(bindcardData));
            that.$bindcard.find(".card-info span").html(res.data.stuNum);
        } else if(res.code == 80017) {
            // 画笔开始
            var canvasData = [];

            if(!localStorage.getItem('canvasData')) {
                canvasData = [];
            } else {
                canvasData = JSON.parse(localStorage.getItem('canvasData'));

                for(var i = 0; i < canvasData.length; i++) {
                    if(canvasData[i].picUrl == localStorage.getItem('picUrl')) {
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
        } else if(res.code == 80018) {
            // 画布上的点
            var canvasData = JSON.parse(localStorage.getItem('canvasData')),
                points = res.data.points[0],
                picUrl = localStorage.getItem('picUrl');

            for(var i = 0; i < canvasData.length; i++) {
                if(canvasData[i].picUrl == picUrl) {
                    var data = canvasData[i].data;

                    if(data.lines) {
                        for(var j = 0; j < data.lines.length; j++) {
                            if(data.lines[j].lineId == points.lineId) {

                                if(!data.lines[j].location){
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
        }
    },

    // 向服务端发送消息
    sendMsg: function(param) {
        ws.send(JSON.stringify(param));
    },

    // 显示课程图片
    showImage: function(picurl, answerType, isAnswer, piclist) {
        localStorage.setItem('picUrl', picurl);
        localStorage.setItem('answerType', answerType);
        localStorage.setItem('isAnswer', isAnswer ? 'true' : '');

        that.$connection.hide();
        that.$screen.hide();
        that.$courseImg.hide();
        that.showLoading('正在同步显示手机屏幕，请稍候');

        that.$screen.find('#canvas').remove();
        that.$screen.find('.state-before').remove();
        that.$screen.find('.state-doing').remove();
        that.$screen.find('.state-after').remove();
        that.$screen.find('.chart').remove();
        that.$screen.find('.student').remove();

        var img = new Image(),
            pageWidth = window.innerWidth,
            pageHeight = window.innerHeight - 42,
            pageBL;

        if(typeof pageWidth != 'number') {
            if(document.compatMode == 'CSS1Compat') {
                pageWidth = document.documentElement.clientWidth;
                pageHeight = document.documentElement.clientHeight - 42;
            } else {
                pageWidth = document.body.clientWidth;
                pageHeight = document.body.clientHeight - 42;
            }
        }

        pageBL = pageWidth/pageHeight;
        img.src = picurl;
        img.onload = function() {
            var imgW = img.width,
                imgH = img.height,
                imgBL = imgW/imgH;

            if(imgBL > pageBL) {
                that.$courseImg.css({ 'width': '100%', 'height': 'auto'});
            } else {
                that.$courseImg.css({ 'height': '100%', 'width': 'auto'});
            }

            that.$loading.fadeOut(200);
            that.$courseImg.attr('src', picurl).show();
            that.$screen.fadeIn(200);

            that.canvasInit();

            if(piclist) {
                that.preloadImages(piclist);
            }
        }
    },

    // 显示缓存的内容
    showSessionMask: function() {
        var sType = parseInt(localStorage.getItem('sessionType'));

        switch (sType) {
            case 0: //课件无答题
                that.showProblem();
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
            case 80: //显示绑卡界面
                console.log(80)
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
        answerType = parseInt(localStorage.getItem('answerType'));  // 0:无题目 1:单选 2:多选 3:判断
                
        if(answerType != 0) {
            // 有题目
            if(localStorage.getItem('isAnswer')) {
                // 已答题
                var str = '';
                str += '<div class="state-after">';
                str += '<div class="button-detail">查看结果</div>';
                str += '<p class="text">重新答题</p>';
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
                    default :
                        that.$screen.append('');
                }
            }
        }
    },

    // 开始答题
    startAnswer: function() {
        var str = '',
            time;
        
        if(localStorage.getItem('timeClock')) {
            time = JSON.parse(localStorage.getItem('timeClock'));
        } else {
            time = {
                minutes: '00',
                seconds: '00'
            }
        }
        str += '<div class="state-doing">';
        str += '<p class="text text-time">答题时间：00:'+ time.minutes +':'+ time.seconds + '</p>';
        str += '<p class="text text-number">答题人数：'+ localStorage.getItem('answerNum') +'人</p>';
        str += '<div class="button-stop">结束答题</div>';
        str += '</div>';

        that.$screen.find('.state-doing').remove();
        that.$screen.append(str);
        that.timeClock();
    },

    // 结束答题
    endAnswer: function() {
        var str = '';
        str += '<div class="state-after">';
        str += '<div class="button-detail">查看结果</div>';
        str += '<p class="text">重新答题</p>';
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

        if(info.answerType == 3) {
            // 判断题
            titlesArr = ["✓", "✕", '未答题'];
            optionsArr = [
                { 'value': info.numTrue, 'width': '', bgcolor: '#38A0FF' },
                { 'value': info.numFalse, 'width': '', bgcolor: '#FFFD38' },
                { 'value': info.giveupNum, 'width': '', bgcolor: '#D9D9D9' }
            ];

            if(info.answer == '0' || info.answer == 0) {
                optionsArr[1].bgcolor = '#1EC51D';
            } else if(info.answer == '1' || info.answer == 1) {
                optionsArr[0].bgcolor = '#1EC51D';
            }
        } else if(info.answerType == 1) {
            // 单选
            titlesArr = ['A', 'B', 'C', 'D', 'E', 'F', '未答题'];
            optionsArr = [
                { 'value': info.numA, 'width': '', bgcolor: '#38A0FF' },
                { 'value': info.numB, 'width': '', bgcolor: '#FFFD38' },
                { 'value': info.numC, 'width': '', bgcolor: '#D71616' },
                { 'value': info.numD, 'width': '', bgcolor: '#D68A16' },
                { 'value': info.numE, 'width': '', bgcolor: '#7A38FF' },
                { 'value': info.numF, 'width': '', bgcolor: '#C238FF' },
                { 'value': info.giveupNum, 'width': '', bgcolor: '#D9D9D9' }
            ];

            var index = titlesArr.indexOf(info.answer);
            optionsArr[index].bgcolor = "#1EC51D";
        } else if(info.answerType == 2) {
            // 多选
            titlesArr = ['A', 'B', 'C', 'D', 'E', 'F', '答对', '未答题'];
            optionsArr = [
                { 'value': info.numA, 'width': '', bgcolor: '#38A0FF' },
                { 'value': info.numB, 'width': '', bgcolor: '#FFFD38' },
                { 'value': info.numC, 'width': '', bgcolor: '#D71616' },
                { 'value': info.numD, 'width': '', bgcolor: '#D68A16' },
                { 'value': info.numE, 'width': '', bgcolor: '#7A38FF' },
                { 'value': info.numF, 'width': '', bgcolor: '#C238FF' },
                { 'value': info.rightNum, 'width': '', bgcolor: '#1EC51D' },
                { 'value': info.giveupNum, 'width': '', bgcolor: '#D9D9D9' }
            ];
        }

        var compareArr = [];
        for(var m = 0; m < optionsArr.length; m++) {
            compareArr.push(optionsArr[m].value);
        }
        compareArr.sort(that.compare);
        var max = compareArr.pop();
        for(var i = 0; i < optionsArr.length; i++) {
            optionsArr[i].width = parseInt(optionsArr[i].value)/parseInt(max) * 90;
        }

        var str = '';
        str += '<div class="chart">';
        str += '<div class="chart-box flex-h">';
        str += '<div class="time">答题时间：00:'+ that.transMinute(Math.floor(info.costTime/60)) +':'+ that.transSecond(info.costTime%60) +'</div>';
        str += '<div class="titles">';
        for(var j = 0; j < titlesArr.length; j++) {
            str += '<p class="titles-item">'+ titlesArr[j] +'</p>';
        }
        str += '</div>';
        str += '<div class="options flex-a-i">';
        for(var k = 0; k < optionsArr.length; k++) {
            str += '<div class="options-item flex-h">';
            str += '<p class="color-line" style="width: '+ optionsArr[k].width +'%; background: '+ optionsArr[k].bgcolor +';"></p>';
            str += '<p class="text">'+ optionsArr[k].value +'人</p>';
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
                text = "答对(" + data.rightAnswer + ")的学生";
                break;
            case 4:
                text = "未答题的学生";
                break;
            default:
                text = "选择" + data.answerType + "的学生"
        }

        var str = '';
        str += '<div class="student">';
        str += '<div class="student-box">';
        str += "<h2>" + text + "</h2>";
        for(var i = 0; i < data.studentList.length; i++) {
            str += '<p>'+ data.studentList[i].name +'</p>';
        }
        str += '</div>';
        str += '</div>';

        that.$screen.find('.chart').remove();
        that.$screen.append(str);
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
            if(cardSelectList[i] == '0') {
                cardHeaderItem.eq(i).html('✕');
            } else if(cardSelectList[i] == '1') {
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
            cardBoxH = that.$bindcard.find('.bindcard-box').height(),
            scale = cardH/cardBoxH;

        that.$bindcard.find('.bindcard-box').css({
            '-webkit-transform': 'translate3d(-50%, -50%, 0) scale('+ scale +')',
               '-moz-transform': 'translate3d(-50%, -50%, 0) scale('+ scale +')',
                '-ms-transform': 'translate3d(-50%, -50%, 0) scale('+ scale +')',
                    'transform': 'translate3d(-50%, -50%, 0) scale('+ scale +')'
        });
        console.log(data)

        that.$connection.hide();
        that.$bindlist.hide();
        that.$bindcard.addClass('bindcard-active').fadeIn(300);
    },

    // 显示绑卡学生列表
    showBindStudent: function() {
        var data = JSON.parse(localStorage.getItem('bindStudentData'));

        if(data.studentList && data.studentList.length > 0) {
            var temp = '';
            for(var i = 0; i < data.studentList.length; i++) {
                temp += '<li class="list-item">'+ data.studentList[i] +'</li>';
            }

            that.$bindlist.find('ul').html(temp);
        } else {
            that.$bindlist.find('ul').html('<li class="no-data">暂无绑定的学生</li>');
        }

        that.$bindcard.removeClass('bindcard-active').hide();
        that.$bindlist.fadeIn(300);
    },

    // loading
    showLoading: function(text) {
        that.$loading.find('.text').html(text);
        that.$loading.fadeIn(200);
    },

    // 答题计时
    timeClock: function() {
        clearInterval(that.XF);
        if(localStorage.getItem('timeClock')) {
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
            that.seconds = that.clock%60;
            that.minutes = Math.floor(that.clock/60);
            var time = {
                minutes: that.transMinute(that.minutes),
                seconds: that.transSecond(that.seconds)
            };
            that.$screen.find('.state-doing .text-time').html('答题时间：00:'+ time.minutes +':'+ time.seconds);

            localStorage.setItem('timeClock', JSON.stringify(time));
        }, 1000);
    },

    // 预加载课件图片
    preloadImages: function(list) {
        var images = [];

        for(var i = 0; i < list.length; i++) {
            images[i] = new Image();
            images[i].src = list[i];
        }
    },

    // 初始化画布
    canvasInit: function() {
        var picUrl = localStorage.getItem('picUrl'),
            canvasData = JSON.parse(localStorage.getItem('canvasData'));

        if(!canvasData) {
            return false;
        }

        for(var i = 0; i < canvasData.length; i++) {
            if(canvasData[i].picUrl == localStorage.getItem('picUrl')) {
                var data = canvasData[i].data,
                    cw = data.width,
                    ch = data.height,
                    pageWidth = window.innerWidth,
                    pageHeight = window.innerHeight - 42;

                if(typeof pageWidth != 'number') {
                    if(document.compatMode == 'CSS1Compat') {
                        pageWidth = document.documentElement.clientWidth;
                        pageHeight = document.documentElement.clientHeight - 42;
                    } else {
                        pageWidth = document.body.clientWidth;
                        pageHeight = document.body.clientHeight - 42;
                    }
                }
                var pageBL = pageWidth/pageHeight;
                
                var imgW = $('#courseImg').width(),
                    imgH = $('#courseImg').height(),
                    imgBL = imgW/imgH,
                    imgScale;

                if(imgBL > pageBL) {
                    imgScale = pageWidth/cw;
                    cw = pageWidth;
                    ch = ch * imgScale;
                } else {
                    imgScale = pageHeight/ch;
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
        $('.canvas').html('<canvas id="canvas" width="'+ cw +'" height="'+ ch +'"></canvas>');

        that.drawCanvas();
    },

    // 绘制图像
    drawCanvas: function() {
        var picUrl = localStorage.getItem('picUrl'),
            canvasData = JSON.parse(localStorage.getItem('canvasData')),
            canvas = document.getElementById('canvas'),
            context = canvas.getContext('2d');

        context.clearRect(0, 0, $('#canvas').width(), $('#canvas').height());

        for(var i = 0; i < canvasData.length; i++) {
            if(canvasData[i].picUrl == localStorage.getItem('picUrl')) {
                var lines = canvasData[i].data.lines,
                    scale = localStorage.getItem('scale');

                if(!lines) {
                    return false;
                }

                
                context.lineCap = 'round';
                context.lineJoin = "round";
                for(var l = 0; l < lines.length; l++) {
                    var color = lines[l].color,
                        isEraser = lines[l].isEraser,
                        location = lines[l].location;

                    if(color == '-2681322') {
                        color = '#D71616';  //red
                    } else if(color == '-13065985') {
                        color = '#38A0FF';  // blue
                    } else {
                        // color = 'rgba(0, 0, 0, 0)';
                    }

                    if(isEraser) {
                        context.globalCompositeOperation = "destination-out";
                        context.lineWidth = 40 * parseFloat(localStorage.getItem('scale'));
                    } else {
                        context.globalCompositeOperation = "source-over";
                        context.lineWidth = 4 * parseFloat(localStorage.getItem('scale'));;
                    }
                    context.beginPath();
                    context.strokeStyle = color;
                    for(var p = 0; p < location.length - 1; p++) {
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

    // 转换 minute
    transMinute: function(minute) {
        if(minute < 10) {
            return '0' + minute;
        } else {
            return minute;
        }
    },

    // 转换 second
    transSecond: function(second) {
        if(second < 10) {
            return '0' + second;
        } else {
            return second;
        }
    },

    // 比较大小
    compare: function(value1, value2) {
        if(value1 < value2) {
            return -1;
        } else if(value1 > value2) {
            return 1;
        } else {
            return 0;
        }
    },

    // 点击刷新按钮事件
    buttonRefreshBind: function() {
        location.href = location.href;
    },

    // 点击全屏按钮事件
    buttonFullscreenBind: function() {
        var isFullscreen = that.$buttonFullscreen.attr('data-fullscreen');
        if(isFullscreen == 'true') {
            that.cancleFullscreen();
        } else {
            that.launchFullscreen(document.documentElement);
            that.$buttonFullscreen.attr('data-fullscreen', 'true');
        }
    },

    // 展示全屏
    launchFullscreen: function(element) {
        if(element.requestFullscreen) {
            element.requestFullscreen();
        } else if(element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if(element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if(element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }

        that.$buttonFullscreen.attr('data-fullscreen', 'true');
    },

    // 退出全屏
    cancleFullscreen: function() {
        if(document.exitFullscreen) {
            document.exitFullscreen();
        } else if(document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if(document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if(document.msExitFullscreen) {
            document.msExitFullscreen();
        }

        that.$buttonFullscreen.attr('data-fullscreen', 'false');
    }
};

INDEX.init();
