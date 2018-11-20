/**
 * @author luoym
 * @email 13575458746@163.com
 * @descrip 
 * @version v2.0.1
 */
"use strict";var that,ws=null,INDEX={init:function(){localStorage.setItem("sid",""),localStorage.setItem("token",""),localStorage.removeItem("sessionType"),localStorage.removeItem("picUrl"),localStorage.removeItem("htmlUrl"),localStorage.removeItem("answerType"),localStorage.removeItem("isAnswer"),localStorage.removeItem("timeClock"),localStorage.removeItem("answerNum"),localStorage.removeItem("answerCharts"),localStorage.removeItem("answerStudent"),localStorage.removeItem("unAnswerStudent"),localStorage.removeItem("bindcardData"),localStorage.removeItem("bindStudentData"),localStorage.removeItem("canvasData"),localStorage.removeItem("audioTime"),localStorage.removeItem("zoom"),localStorage.removeItem("scale"),localStorage.removeItem("audioStatus"),(that=this).heartCount=0,that.UIInit()},UIInit:function(){that.$qrcodeClass=$("#qrcode-class"),that.$qrcodeLesson=$("#qrcode-lesson"),that.$qrcodeMaskClass=$("#qrcode-mask-class"),that.$qrcodeMaskLesson=$("#qrcode-mask-lesson"),that.$loading=$("#loading"),that.$reload=$("#reload"),that.$buttonReload=$("#button-reload"),that.$buttonClass=$("#button-class"),that.$buttonLesson=$("#button-lesson"),that.$textClass=$("#text-class"),that.$textLesson=$("#text-lesson"),that.$screenCode=$("#screen-code"),that.$buttonDownload=$("#button-download"),that.$buttonDownloadClose=$("#button-download-close"),that.$downloadModal=$("#modal-download"),"lesson"==that.getQueryString("from")?that.flag="lesson":that.flag="class","class"==that.flag?(that.$buttonLesson.fadeIn(200),that.$buttonClass.fadeOut(200),that.$textClass.parent().removeClass("text-box-active")):"lesson"==that.flag&&(that.$buttonLesson.fadeOut(200),that.$buttonClass.fadeIn(200),that.$textClass.parent().addClass("text-box-active")),that.buttonBind(),that.webSocketInit()},webSocketInit:function(){that.$qrcodeClass.hide(),that.$qrcodeLesson.hide(),that.$loading.fadeIn(200),that.$reload.hide(),"WebSocket"in window?ws=new WebSocket("ws://"+CONFIG.online):alert("当前浏览器不支持 webSocket, 请更换最新版谷歌浏览器！"),ws.onerror=function(){console.log("WebSocket连接发生错误"),that.$qrcodeClass.fadeOut(200),that.$qrcodeLesson.fadeOut(200),that.$qrcodeMaskClass.fadeOut(200),that.$qrcodeMaskLesson.fadeOut(200),that.$loading.fadeOut(200),that.$reload.fadeIn(200)},ws.onopen=function(){console.log("WebSocket连接成功"),that.sendHeartMsg(),"class"==that.flag?that.sendMsg({bizType:1e4,data:{loginType:1}}):"lesson"==that.flag&&that.sendMsg({bizType:1e4,data:{loginType:2}})},ws.onmessage=function(t){that.doReceiveMsg(t.data)},ws.onclose=function(){console.log("WebSocket连接关闭"),that.$qrcodeClass.fadeOut(200),that.$qrcodeLesson.fadeOut(200),that.$qrcodeMaskClass.fadeOut(200),that.$qrcodeMaskLesson.fadeOut(200),that.$loading.fadeOut(200),that.$reload.fadeIn(200)},window.onbeforeunload=function(){ws.close()}},sendHeartMsg:function(){setInterval(function(){that.heartCount<3?that.sendMsg({bizType:10006,data:{}}):location.href=location.href},5e3)},doReceiveMsg:function(a){if(a=JSON.parse(a),console.log(a),1e4==a.code){var t=new Image;t.src=a.data.qrCodeUrl,t.onload=function(){"class"==that.flag?(that.$qrcodeClass.attr("src",a.data.qrCodeUrl).fadeIn(200),that.$qrcodeMaskClass.fadeIn(200)):(that.$qrcodeLesson.attr("src",a.data.qrCodeUrl).fadeIn(200),that.$qrcodeMaskLesson.fadeIn(200));var t=a.data.screenCode;that.$screenCode.html("<span>"+t.substring(0,1)+"</span><span>"+t.substring(1,2)+"</span><span>"+t.substring(2,3)+"</span><span>"+t.substring(3,4)+"</span>"),that.$loading.fadeOut(200)}}else 10001==a.code?that.sendMsg({bizType:10001,data:{}}):10006==a.code?that.heartCount-=1:80001==a.code&&(localStorage.setItem("sid",a.data.sid),localStorage.setItem("token",a.data.token),"class"==that.flag?location.href="./course.html?v="+CONFIG.version:"lesson"==that.flag&&(location.href="./lesson.html?v="+CONFIG.version))},sendMsg:function(t){ws.send(JSON.stringify(t))},buttonBind:function(){that.$buttonReload.on("click",function(){that.webSocketInit()}),that.$buttonClass.on("click",function(){that.$buttonLesson.fadeIn(200),that.$buttonClass.fadeOut(200),that.$textClass.parent().removeClass("text-box-active"),that.flag="class",that.$qrcodeLesson.fadeOut(200),that.$qrcodeMaskLesson.fadeOut(200),that.$qrcodeClass.attr("src")?(that.$qrcodeClass.fadeIn(200),that.$qrcodeMaskClass.fadeIn(200)):(that.$loading.fadeIn(200),that.sendMsg({bizType:1e4,data:{loginType:1}}))}),that.$buttonLesson.on("click",function(){that.$buttonLesson.fadeOut(200),that.$buttonClass.fadeIn(200),that.$textClass.parent().addClass("text-box-active"),that.flag="lesson",that.$qrcodeClass.fadeOut(200),that.$qrcodeMaskClass.fadeOut(200),that.$qrcodeLesson.attr("src")?(that.$qrcodeLesson.fadeIn(200),that.$qrcodeMaskLesson.fadeIn(200)):(that.$loading.fadeIn(200),that.sendMsg({bizType:1e4,data:{loginType:2}}))}),that.$buttonDownload.on("click",function(){that.$downloadModal.fadeToggle()}),that.$buttonDownloadClose.on("click",function(){that.$downloadModal.fadeToggle()})},getQueryString:function(t){var a=new RegExp("(^|&)"+t+"=([^&]*)(&|$)","i"),e=window.location.search.substr(1).match(a);return null!=e?unescape(e[2]):null}};INDEX.init();