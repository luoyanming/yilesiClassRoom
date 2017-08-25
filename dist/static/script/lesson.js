/**
 * @author luoym
 * @email 13575458746@163.com
 * @descrip 
 * @version v1.0.0
 */
$(function(){var e,n=null;({init:function(){e=this,e.heartCount=0,e.UIInit(),e.sid=localStorage.getItem("sid"),e.token=localStorage.getItem("token"),e.sid&&e.token?e.webSocketInit():location.href="./index.html?from=lesson"},UIInit:function(){e.$loading=$(".loading"),e.$onlyone=$(".onlyone"),e.$list=$(".list"),e.$mask=$(".mask"),e.$progressBar=$("#progressBar"),e.$progressText=$("#progressText"),e.$update=$(".update")},webSocketInit:function(){"WebSocket"in window?n=new WebSocket("ws://"+CONFIG.online):alert("当前浏览器不支持 webSocket, 请更换最新版谷歌浏览器！"),n.onerror=function(){console.log("WebSocket连接发生错误")},n.onopen=function(){console.log("WebSocket连接成功"),e.sendHeartMsg(),e.sendMsg({bizType:10002,sid:e.sid,token:e.token,data:{loginType:2}})},n.onmessage=function(n){e.doReceiveMsg(n.data)},n.onclose=function(){console.log("WebSocket连接关闭")},window.onbeforeunload=function(){n.close()}},sendHeartMsg:function(){setInterval(function(){e.heartCount<3?e.sendMsg({bizType:10006,data:{}}):location.href=location.href},5e3)},doReceiveMsg:function(t){t=JSON.parse(t),console.log(t),10001==t.code?e.sendMsg({bizType:10001,data:{}}):10002==t.code?($("#avatar").attr("src",t.data.userface),$("#nickname").html(t.data.name),e.getCourseList()):10006==t.code?e.heartCount-=1:10009==t.code?(e.$update.fadeIn(300),e.updateBtnSureBind(),e.getCourseList()):80011==t.code&&(n.close(),location.href="./index.html?from=lesson")},sendMsg:function(e){n.send(JSON.stringify(e))},showMsg:function(e,n){$(".message")&&$(".message").length>0&&$(".message").remove(),$("body").append('<div class="message '+n+'">'+e+"</div>"),setTimeout(function(){var e=$(".message");e.addClass("message-show"),setTimeout(function(){e.removeClass("message-show")},1500)},200)},getCourseList:function(){$.ajax({url:CONFIG.apiOnline+"/index/course/list",dataType:"json",type:"post",data:{sid:e.sid,token:e.token,name:"",pageNo:1,pageSize:1e3},success:function(n){0==n.data.list.length?e.createOnlyone():e.createList(n.data.list)},error:function(){e.showMsg("获取课程列表失败，请刷新页面重试！","error")}})},createOnlyone:function(){e.$onlyone.fadeIn(300).find(".file-wrap").html(e.formUI("0")),e.$loading.fadeOut(200),e.inputFileBind()},createList:function(n){var t="";t+="<ul>",t+='<li class="list-item">',t+='<div class="upload-wrap">',t+='<div class="file-wrap">',t+=e.formUI("0"),t+="</div>",t+="</div>",t+='<p class="title">新建课程</p>',t+="</li>";for(var o=0;o<n.length;o++)t+='<li class="list-item">',n[o].picUrl?t+='<div class="upload-wrap">':t+='<div class="upload-wrap upload-wrap-nodata">',t+='<img src="'+n[o].picUrl+'" class="thumb">',t+='<div class="mask-plus"></div>',t+='<div class="file-wrap">',t+=e.formUI(n[o].id),t+="</div>",t+="</div>",t+='<p class="title">'+n[o].name+"</p>",t+="</li>";t+="</ul>",e.$list.html(t).fadeIn(300),e.$onlyone.empty(),e.$loading.fadeOut(200),e.inputFileBind()},formUI:function(e){return'<form id="form-'+e+'" data-id="'+e+'"><input type="file" name="file" class="input-file" id="file-'+e+'"></form>'},inputFileBind:function(){$("form .input-file").change(function(){var n=$(this).parent(),t=new FormData,o=n.attr("data-id"),s=$(this)[0].files[0].name.split("."),a=s[s.length-1];if("ppt"!==a&&"pptx"!==a)return e.showMsg("请上传 .ppt 或 .pptx 格式的文件！","error"),!1;t.append("file",$(this)[0].files[0]),t.append("sid",e.sid),t.append("token",e.token),t.append("courseId",o),t.append("deviceType",1),$.ajax({url:CONFIG.apiOnline+"/course/upload/ppt",type:"POST",data:t,dataType:"JSON",async:!0,cache:!1,contentType:!1,processData:!1,xhr:function(){var n=$.ajaxSettings.xhr();return n.upload.onloadstart=function(){e.$progressBar.css("width","1%"),e.$progressText.html("0%"),e.$mask.fadeIn(200),0!=o&&e.sendUploadMsg(o,"start")},n.upload.onprogress=e.onprogress,n},success:function(n){0==n.code?(e.showMsg("上传成功！正在同步列表...","success"),e.$mask.fadeOut(200),e.$loading.fadeIn(200),e.getCourseList()):e.showMsg(n.errorInfo,"error"),e.sendUploadMsg(o,"end")},error:function(){e.showMsg("文件上传失败！请重试！","error"),e.sendUploadMsg(o,"end");var t=n.parent();n.remove(),t.html(e.formUI(o)),e.inputFileBind()}})})},sendUploadMsg:function(n,t){e.sendMsg({bizType:10008,sid:e.sid,token:e.token,time:(new Date).getTime(),data:{courseId:n,updateType:"WEB",status:t}})},onprogress:function(n){var t=n.loaded,o=n.total,s=Math.floor(100*t/o);e.$progressBar.css("width",s+"%"),e.$progressText.html(s+"%")},updateBtnSureBind:function(){e.$update.find(".btn-sure").unbind("click"),e.$update.find(".btn-sure").on("click",function(){e.$update.fadeOut("300")})}}).init()});