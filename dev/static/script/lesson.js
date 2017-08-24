$(function() {
    var that,
        ws = null;

    var LESSON = {
        init: function() {
            that = this;
            // 心跳包计数
            that.heartCount = 0;
            that.UIInit();

            that.sid = localStorage.getItem('sid');
            that.token = localStorage.getItem('token');
            if(that.sid && that.token) {
                that.webSocketInit();
            } else {
                location.href = './index.html';
            }
        },

        //  
        UIInit: function() {
            that.$loading = $('.loading');
            that.$onlyone = $('.onlyone');
            that.$list = $('.list');
            that.$mask = $('.mask');
            that.$progressBar = $('#progressBar');
            that.$progressText = $('#progressText');
            that.$update = $('.update');
        },

        webSocketInit: function() {
            //判断当前浏览器是否支持WebSocket
            if ('WebSocket' in window) {
                ws = new WebSocket('ws://' + CONFIG.online);
            } else {
                alert('当前浏览器不支持 webSocket, 请更换最新版谷歌浏览器！')
            }

            //连接发生错误的回调方法
            ws.onerror = function () {
                console.log("WebSocket连接发生错误");
            };

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

            if(res.code == 10001) {
                // 心跳包
                that.sendMsg({
                    "bizType": 10001,
                    "data": {}
                });
            } else if(res.code == 10002) {
                // 登陆成功
                $('#avatar').attr('src', res.data.userface);
                $('#nickname').html(res.data.name);

                that.getCourseList();
            } else if(res.code == 10006) {
                // 收到服务端返回的心跳包回复，心跳计数-1
                that.heartCount -= 1;
            } else if(res.code == 10009) {
                // 刷新list
                that.$update.fadeIn(300);
                that.updateBtnSureBind();
                that.getCourseList();
            } else if(res.code == 80011) {
                // 关闭同屏
                ws.close();
                location.href = './index.html?from=lesson';
            }
        },

        // 向服务端发送消息
        sendMsg: function(param) {
            ws.send(JSON.stringify(param));
        },

        // 页面上部提示信息
        showMsg: function(msg, type) {
            if($('.message') && $('.message').length > 0) {
                $('.message').remove();
            }

            $('body').append('<div class="message '+ type +'">'+ msg +'</div>');

            setTimeout(function() {
                var message = $('.message');
                message.addClass('message-show');

                setTimeout(function() {
                    message.removeClass('message-show');
                }, 1500);
            }, 200);
        },

        // 获取课程列表
        getCourseList: function() {
            $.ajax({
                url: CONFIG.apiOnline + '/index/course/list',
                dataType: 'json',
                type: 'post',
                data: {
                    sid: that.sid,
                    token: that.token,
                    name: '',
                    pageNo: 1,
                    pageSize: 1000
                },
                success:function(res) {
                    if(res.data.list.length == 0) {
                        that.createOnlyone();
                    } else {
                        that.createList(res.data.list);
                    }
                },
                error: function() {
                    that.showMsg('获取课程列表失败，请刷新页面重试！', 'error');
                }
            });
        },

        // 课程列表为空的时候
        createOnlyone: function() {
            that.$onlyone.fadeIn(300).find('.file-wrap').html(that.formUI('0'));
            that.$loading.fadeOut(200);

            that.inputFileBind();
        },

        // 显示课程列表
        createList: function(dataList) {
            var temp = '';
            temp += '<ul>';
            temp += '<li class="list-item">';
            temp += '<div class="upload-wrap">';
            temp += '<div class="file-wrap">';
            temp += that.formUI('0');
            temp += '</div>';
            temp += '</div>';
            temp += '<p class="title">新建课程</p>';
            temp += '</li>';
            for(var i = 0; i < dataList.length; i++) {
                temp += '<li class="list-item">';
                if(dataList[i].picUrl){
                    temp += '<div class="upload-wrap">';
                } else {
                    temp += '<div class="upload-wrap upload-wrap-nodata">';
                }
                temp += '<img src="'+ dataList[i].picUrl +'" class="thumb">';
                temp += '<div class="mask-plus"></div>';
                temp += '<div class="file-wrap">';
                temp += that.formUI(dataList[i].id);
                temp += '</div>';
                temp += '</div>';
                temp += '<p class="title">'+ dataList[i].name +'</p>';
                temp += '</li>';
            }
            temp += '</ul>';

            that.$list.html(temp).fadeIn(300);
            that.$onlyone.empty();
            that.$loading.fadeOut(200);
            that.inputFileBind();
        },

        // 创建上传表单
        formUI: function(id) {
            return '<form id="form-'+ id +'" data-id="'+ id +'"><input type="file" name="file" class="input-file" id="file-'+ id +'"></form>';
        },

        // 上传事件绑定
        inputFileBind: function() {
            var inputfile = $('form .input-file');

            // inputfile.unbind('change');
            inputfile.change(function() {
                var formWrap = $(this).parent(),
                    formData = new FormData(),
                    courseID = formWrap.attr('data-id');

                var fileTypeArr = $(this)[0].files[0].name.split('.'),
                    fileType = fileTypeArr[fileTypeArr.length - 1];
                if(fileType !== 'ppt' && fileType !== 'pptx') {
                    that.showMsg('请上传 .ppt 或 .pptx 格式的文件！', 'error');
                    return false;
                }

                formData.append('file', $(this)[0].files[0]);
                formData.append('sid', that.sid);
                formData.append('token', that.token);
                formData.append('courseId', courseID);
                formData.append('deviceType', 1);

                $.ajax({
                    url: CONFIG.apiOnline + '/course/upload/ppt',
                    type: 'POST',
                    data: formData,
                    dataType: 'JSON',
                    async: true,
                    cache: false,
                    contentType: false,
                    processData: false,
                    xhr: function() {
                        var xhr = $.ajaxSettings.xhr();

                        xhr.upload.onloadstart = function(){
                            that.$progressBar.css('width' , '1%');
                            that.$progressText.html('0%');
                            that.$mask.fadeIn(200);

                            if(courseID != 0) {
                                // 编辑课程
                                // 向服务端发送上传开始请求
                                that.sendUploadMsg(courseID, 'start');
                            }
                        };

                        xhr.upload.onprogress = that.onprogress;

                        return xhr;
                    },  
                    success: function (res) {
                        if(res.code == 0) {
                            that.showMsg('上传成功！正在同步列表...', 'success');
                            that.$mask.fadeOut(200);
                            that.$loading.fadeIn(200);

                            that.getCourseList();
                        } else {
                            that.showMsg(res.errorInfo, 'error');
                        }

                        that.sendUploadMsg(courseID, 'end');
                    },
                    error: function () {
                        that.showMsg('文件上传失败！请重试！', 'error');
                        that.sendUploadMsg(courseID, 'end');

                        var formBox = formWrap.parent();
                        formWrap.remove();
                        formBox.html(that.formUI(courseID));

                        that.inputFileBind();
                    }
                });

            });
        },

        // 发送上传开始和结束请求
        sendUploadMsg: function(id, type) {
            that.sendMsg({
                "bizType": 10008,
                "sid": that.sid,
                "token": that.token,
                "time": (new Date()).getTime(),
                "data": {
                    "courseId": id,
                    "updateType": "WEB",
                    "status": type
                }
            });
        },

        // 上传进度条
        onprogress: function(evt) {
            var loaded = evt.loaded,
                total = evt.total,
                per = Math.floor(100*loaded/total);

            // progressBar.css('width' , per + '%');
            that.$progressBar.css('width' , per + '%');
            that.$progressText.html(per + '%');
        },

        //
        updateBtnSureBind: function() {
            that.$update.find('.btn-sure').unbind('click');
            that.$update.find('.btn-sure').on('click', function() {
                that.$update.fadeOut('300');
            });
        }
    };

    LESSON.init();
});
