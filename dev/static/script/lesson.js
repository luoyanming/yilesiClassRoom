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
                location.href = './index.html?from=lesson&v=' + CONFIG.version;
            }
        },

        //  
        UIInit: function() {
            that.$buttonLogout = $("#buttonLogout")
            that.$loading = $('.loading');
            that.$onlyone = $('.onlyone');
            that.$list = $('.list');
            that.$update = $('.update');
            that.$failure = $('.failure');
            that.courseIdArr = [];

            that.$buttonLogout.on("click", function() {
                that.sendMsg({
                    bizType: 10011,
                    sid: that.sid,
                    token: that.token,
                    data: {
                        opType: 1001101
                    }
                });
                ws.close();
                location.href = './index.html?from=lesson&v=' + CONFIG.version;
            })
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
            // console.log(res)

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
            } else if(res.code == 10007) {
                // 账号在其它地方登陆，当前页面被踢下线
                ws.close();
                alert('您的账号已在其它地点登录，将被强制下线！');
                location.href = './index.html?v=' + CONFIG.version;
            } else if(res.code == 10009) {
                // 刷新list
                if($('.onlyone').css('display') == 'block' ) {
                    // 无课程时
                    that.getCourseList();
                    return false;
                }

                var uploadWrap = $('#form-' + res.data.courseId).parent().parent();

                if(res.data.errorInfo) {
                    // ppt转换失败
                    
                    if(res.data.addType == 2) {
                        // web add
                        uploadWrap.parent().remove();
                    }

                    that.$failure.find('.text').html(res.data.errorInfo);
                    that.$failure.fadeIn(300);
                    that.failureBtnSureBind();

                    var formParent = $('#form-' + res.data.courseId).parent();
                    $('#form-' + res.data.courseId).remove();
                    // formParent.parent().find('.text').show();
                    $('#progress-' + res.data.courseId).remove();
                    $('#load-' + res.data.courseId).remove();
                    formParent.html(that.formUI(res.data.courseId));
                    that.inputFileBind();

                    return false;
                } else {
                    // PPT 转换成功

                    if(res.data.addType == 0) {
                        // edit or web add
                        if(res.data.picUrl == '') {
                            uploadWrap.find('.thumb').attr('src', './static/images/course-default.png');
                        } else {
                            uploadWrap.find('.thumb').attr('src', res.data.picUrl);
                        }

                        if(that.courseIdArr.indexOf(res.data.courseId) == -1) {
                            // 如果课程不存在，app新增
                            that.courseIdArr.push(res.data.courseId);
                            that.courseAppAddUI(res.data.courseId, res.data.picUrl, res.data.courseName);
                        }
                    } else if(res.data.addType == 1) {
                        that.courseIdArr.push(res.data.courseId);
                        that.courseAppAddUI(res.data.courseId, res.data.picUrl, res.data.courseName);
                    } else if(res.data.addType == 2) {
                        // web add
                        that.courseIdArr.push(res.data.courseId);
                        if(res.data.picUrl == '') {
                            uploadWrap.find('.thumb').attr('src', './static/images/course-default.png');
                        } else {
                            uploadWrap.find('.thumb').attr('src', res.data.picUrl);
                        }
                    } else if(res.data.addType == 4) {
                        // app delete
                        $('#form-' + res.data.courseId).parent().parent().parent().remove();

                        for(var i = 0; i < that.courseIdArr.length; i++) {
                            if(res.data.courseId == that.courseIdArr[i]) {
                                that.courseIdArr.splice(i, 1);
                            }
                        }
                    }

                    if(res.data.courseName.length > 8) {
                        uploadWrap.parent().find('.title').html(res.data.courseName.substring(0, 8) +'...');
                    } else {
                        uploadWrap.parent().find('.title').html(res.data.courseName);
                    }

                    $('#progress-' + res.data.courseId).remove();
                    $('#load-' + res.data.courseId).remove();
                    

                    if(!res.data.refresh) {
                        that.$update.fadeIn(300);
                        that.updateBtnSureBind();
                    }
                }
            } else if(res.code == 1000901) {
                // // 刷新整个页面
                // alert(1)
                // ws.close();
                // location.href = './lesson.html?&v=' + CONFIG.version;
            } else if(res.code == 80011) {
                // 关闭同屏
                ws.close();
                location.href = './index.html?from=lesson&v=' + CONFIG.version;
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
                        that.createList(res.data.list, res.data.notEndCourseIds);
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
        createList: function(dataList, noContainIds) {
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
                that.courseIdArr.push(dataList[i].id);

                temp += '<li class="list-item">';
                temp += '<div class="upload-wrap">';
                if(dataList[i].picUrl == '') {
                    temp += '<img src="./static/images/course-default.png" class="thumb">';
                } else {
                    temp += '<img src="'+ dataList[i].picUrl +'" class="thumb">';
                }
                temp += '<div class="mask-plus"></div>';
                temp += '<div class="file-wrap">';
                temp += that.formUI(dataList[i].id);
                temp += '</div>';

                    console.log(0)
                if(noContainIds.indexOf(dataList[i].id) > -1) {
                    console.log(1)
                    temp += that.loadUI(dataList[i].id);
                }
                temp += '</div>';
                if(dataList[i].name.length > 8) {
                    temp += '<p class="title">'+ dataList[i].name.substring(0, 8) +'...</p>';
                } else {
                    temp += '<p class="title">'+ dataList[i].name +'</p>';
                }
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

            inputfile.unbind('change');
            inputfile.change(function() {
                var formWrap = $(this).parent(),
                    formData = new FormData(),
                    courseID = formWrap.attr('data-id');

                    // console.log($(this)[0].files[0])

                var fileName = $(this)[0].files[0].name,
                    fileSize = $(this)[0].files[0].size,
                    fileTypeArr = fileName.split('.'),
                    fileType = (fileTypeArr[fileTypeArr.length - 1]).toLowerCase(),
                    fileTitle = fileName.substring(0, fileName.length - fileType.length - 1),
                    typeArray = ['ppt', 'pptx', 'pdf', 'mp3', 'jpg', 'png', 'jpeg'];
                
                // if(fileType !== 'application/vnd.ms-powerpoint' && fileType !== 'application/vnd.openxmlformats-officedocument.presentationml.presentation' && fileType !== 'audio/mp3' && fileType !== 'image/jpg' && fileType !== 'image/jpeg' && fileType !== 'image/png') {
                //     that.showMsg('请上传 .ppt、.pptx、.mp3、jpg、jpeg、png 格式的文件！', 'error');
                //     that.reBindUpload(courseID);
                //     return false;
                // }
                if(typeArray.indexOf(fileType) < 0) {
                    that.showMsg('请上传 .ppt、.pptx、.pdf、.mp3、jpg、jpeg、png 格式的文件！', 'error');
                    that.reBindUpload(courseID);
                    return false;
                }  

                if(fileSize > 100*1024*1024) {
                    that.$failure.find('.text').html('您上传的PPT《'+ fileName +'》大小超过限制，请上传小于100MB的PPT！');
                    that.$failure.fadeIn(300);
                    that.failureBtnSureBind();
                    that.reBindUpload(courseID);
                    return false;
                }

                formData.append('file', $(this)[0].files[0]);
                formData.append('sid', that.sid);
                formData.append('token', that.token);
                formData.append('deviceType', 1);

                if(courseID != 0) {
                    // 编辑课程
                    formData.append('tempCourseId', courseID);
                    formData.append('courseId', courseID);

                    that.uploadppt(0, courseID, fileTitle, formData);
                } else {
                    formData.append('tempCourseId', 0);

                    // 新增课程
                    $.ajax({
                        url: CONFIG.apiOnline + '/course/add',
                        dataType: 'json',
                        type: 'post',
                        data: {
                            sid: that.sid,
                            token: that.token,
                            pptName: fileTypeArr[0]
                        },
                        success:function(res) {
                            if(res.code == 0) {
                                formData.append('courseId', res.data.courseId);

                                that.uploadppt(1, res.data.courseId, fileTitle, formData);
                            } else {
                                that.showMsg(res.errorInfo, 'error');
                            }
                        },
                        error: function() {
                            that.showMsg('新增课程失败，请刷新页面重试！', 'error');
                        }
                    });
                }

            });
        },

        // 上传ppt
        uploadppt: function(type, id, name, formData) {
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
                        if(type == 0) {
                            // edit
                            $('#form-' + id).parent().parent().append(that.progressUI(id));
                        } else if(type == 1) {
                            // add
                            $('#form-0').attr('data-id', id).attr('id', 'form-' + id);
                            $('#file-0').attr('id', 'file-' + id);

                            if($('.onlyone').css('display') == 'block' ) {
                                // 无课程时新增
                                $('#form-' + id).parent().parent().find('.text').hide();
                                $('#form-' + id).parent().parent().append(that.progressUI(id));
                                $('#form-' + id).parent().parent().prepend('<img src="./static/images/course-default.png" class="thumb">');
                            } else {
                                // 有课程时新增
                                var temp = '',
                                    str = '';

                                temp += '<li class="list-item">';
                                temp += '<div class="upload-wrap">';
                                temp += '<div class="file-wrap">';
                                temp += that.formUI('0');
                                temp += '</div>';
                                temp += '</div>';
                                temp += '<p class="title">新建课程</p>';
                                temp += '</li>';


                                str += '<img src="./static/images/course-default.png" class="thumb">';
                                str += '<div class="mask-plus"></div>';

                                $('#form-' + id).parent().parent().append(that.progressUI(id));
                                $('#form-' + id).parent().parent().prepend(str);
                                if(name.length > 8) {
                                    $('#form-' + id).parent().parent().parent().find('.title').html(name.substring(0, 8) +'...');
                                } else {
                                    $('#form-' + id).parent().parent().parent().find('.title').html(name);
                                }

                                that.$list.find('ul').prepend(temp);
                                that.inputFileBind();
                            }
                        }
                    };

                    xhr.upload.onprogress = function(evt) {
                        that.onprogress(id, evt);
                    }

                    return xhr;
                },  
                success: function (res) {
                    that.reBindUpload(id);

                    if(res.code == 0) {
                        that.courseIdArr.push(id);

                        $('#form-' + id).parent().parent().append(that.loadUI(id));

                        $('#progress-' + id).hide();
                        $('#load-' + id).fadeIn();
                    } else {
                        that.showMsg(res.errorInfo, 'error');
                    }
                },
                error: function () {
                    that.showMsg('文件上传失败！请重试！', 'error');

                    that.reBindUpload(id);
                }
            });
        },

        // 重新绑定上传
        reBindUpload: function(id) {
            var formParent = $('#form-' + id).parent();

            $('#form-' + id).remove();
            formParent.html(that.formUI(id));
            formParent.parent().find('.text').show();

            that.inputFileBind();
        },

        // 创建课程上传进度条
        progressUI: function(id) {
            var ptr = '';

            ptr += '<div class="mask-progress" id="progress-'+ id +'">';
            ptr += '<div class="progress-box">';
            ptr += '<div class="progress-bar" style="width: 1%;"></div>';
            ptr += '</div>';
            ptr += '<div class="progress-text">0%</div>';
            ptr += '</div>';

            return ptr;
        },

        // 创建课程生成loading
        loadUI: function(id) {
            var ptr = '';

            ptr += '<div class="load" id="load-'+ id +'">';
            ptr += '<div class="load-icon"></div>';
            ptr += '<div class="load-text">课件生成中...</div>';
            ptr += '</div>';

            return ptr;
        },

        // app 新增时创建课程UI
        courseAppAddUI: function(id, picUrl, name) {
            var temp = '';

            temp += '<li class="list-item">';
            temp += '<div class="upload-wrap">';
            if(picUrl == '') {
                temp += '<img src="./static/images/course-default.png" class="thumb">';
            } else {
                temp += '<img src="'+ picUrl +'" class="thumb">';
            }
            temp += '<div class="mask-plus"></div>';
            temp += '<div class="file-wrap">';
            temp += that.formUI(id);
            temp += '</div>';
            temp += '</div>';
            if(name.length > 8) {
                temp += '<p class="title">'+ name.substring(0, 8) +'...</p>';
            } else {
                temp += '<p class="title">'+ name +'</p>';
            }
            temp += '</li>';

            that.$list.find('ul li').eq(0).after(temp);
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
        onprogress: function(id, evt) {
            var loaded = evt.loaded,
                total = evt.total,
                per = Math.floor(100*loaded/total),
                progress = $('#progress-' + id);

            progress.find('.progress-bar').css('width' , per + '%');
            progress.find('.progress-text').html(per + '%');
        },

        //
        updateBtnSureBind: function() {
            that.$update.find('.btn-sure').unbind('click');
            that.$update.find('.btn-sure').on('click', function() {
                that.$update.fadeOut('300');
            });
        },

        failureBtnSureBind: function() {
            that.$failure.find('.btn-sure').unbind('click');
            that.$failure.find('.btn-sure').on('click', function() {
                that.$failure.fadeOut('300');
            });
        }
    };

    LESSON.init();
});
