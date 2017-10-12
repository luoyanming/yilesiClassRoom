/**
 * @author luoym
 * @email 13575458746@163.com
 * @descrip 
 * @version v1.0.0
 */
$(function(){var e,t=null;({init:function(){e=this,e.heartCount=0,e.UIInit(),e.sid=localStorage.getItem("sid"),e.token=localStorage.getItem("token"),e.sid&&e.token?e.webSocketInit():location.href="./index.html?from=lesson"},UIInit:function(){e.$buttonLogout=$("#buttonLogout"),e.$loading=$(".loading"),e.$onlyone=$(".onlyone"),e.$list=$(".list"),e.$mask=$(".mask"),e.$progressBar=$("#progressBar"),e.$progressText=$("#progressText"),e.$update=$(".update"),e.$buttonLogout.on("click",function(){e.sendMsg({bizType:10011,sid:e.sid,token:e.token,data:{opType:1001101}}),t.close(),window.location.href="./index.html?from=lesson"})},webSocketInit:function(){"WebSocket"in window?t=new WebSocket("ws://"+CONFIG.online):alert("当前浏览器不支持 webSocket, 请更换最新版谷歌浏览器！"),t.onerror=function(){console.log("WebSocket连接发生错误")},t.onopen=function(){console.log("WebSocket连接成功"),e.sendHeartMsg(),e.sendMsg({bizType:10002,sid:e.sid,token:e.token,data:{loginType:2}})},t.onmessage=function(t){e.doReceiveMsg(t.data)},t.onclose=function(){console.log("WebSocket连接关闭")},window.onbeforeunload=function(){e.sendMsg({bizType:10011,sid:e.sid,token:e.token,data:{opType:1001101}}),t.close()}},sendHeartMsg:function(){setInterval(function(){e.heartCount<3?e.sendMsg({bizType:10006,data:{}}):location.href=location.href},5e3)},doReceiveMsg:function(o){o=JSON.parse(o),console.log(o),10001==o.code?e.sendMsg({bizType:10001,data:{}}):10002==o.code?($("#avatar").attr("src",o.data.userface),$("#nickname").html(o.data.name),e.getCourseList()):10006==o.code?e.heartCount-=1:10007==o.code?(t.close(),alert("您的账号已在其它地点登录，将被强制下线！"),location.href="./index.html"):10009==o.code?(o.data.refresh?(e.$mask.fadeOut(200),e.$loading.fadeIn(200)):(e.$update.fadeIn(300),e.updateBtnSureBind()),e.getCourseList()):80011==o.code&&(t.close(),location.href="./index.html?from=lesson")},sendMsg:function(e){t.send(JSON.stringify(e))},showMsg:function(e,t){$(".message")&&$(".message").length>0&&$(".message").remove(),$("body").append('<div class="message '+t+'">'+e+"</div>"),setTimeout(function(){var e=$(".message");e.addClass("message-show"),setTimeout(function(){e.removeClass("message-show")},1500)},200)},getCourseList:function(){$.ajax({url:CONFIG.apiOnline+"/index/course/list",dataType:"json",type:"post",data:{sid:e.sid,token:e.token,name:"",pageNo:1,pageSize:1e3},success:function(t){0==t.data.list.length?e.createOnlyone():e.createList(t.data.list)},error:function(){e.showMsg("获取课程列表失败，请刷新页面重试！","error")}})},createOnlyone:function(){e.$onlyone.fadeIn(300).find(".file-wrap").html(e.formUI("0")),e.$loading.fadeOut(200),e.inputFileBind()},createList:function(t){var o="";o+="<ul>",o+='<li class="list-item">',o+='<div class="upload-wrap">',o+='<div class="file-wrap">',o+=e.formUI("0"),o+="</div>",o+="</div>",o+='<p class="title">新建课程</p>',o+="</li>";for(var n=0;n<t.length;n++)o+='<li class="list-item">',o+='<div class="upload-wrap">',""==t[n].picUrl?o+='<img src="./static/images/course-default.png" class="thumb">':o+='<img src="'+t[n].picUrl+'" class="thumb">',o+='<div class="mask-plus"></div>',o+='<div class="file-wrap">',o+=e.formUI(t[n].id),o+="</div>",o+="</div>",t[n].name.length>8?o+='<p class="title">'+t[n].name.substring(0,8)+"...</p>":o+='<p class="title">'+t[n].name+"</p>",o+="</li>";o+="</ul>",e.$list.html(o).fadeIn(300),e.$onlyone.empty(),e.$loading.fadeOut(200),e.inputFileBind()},formUI:function(e){return'<form id="form-'+e+'" data-id="'+e+'"><input type="file" name="file" class="input-file" id="file-'+e+'"></form>'},inputFileBind:function(){$("form .input-file").change(function(){var t=$(this).parent(),o=new FormData,n=t.attr("data-id"),s=$(this)[0].files[0].name,a=s.split("."),i=a[a.length-1];if("ppt"!==i&&"pptx"!==i)return e.showMsg("请上传 .ppt 或 .pptx 格式的文件！","error"),!1;o.append("file",$(this)[0].files[0]),o.append("sid",e.sid),o.append("token",e.token),o.append("deviceType",1),0!=n?(o.append("tempCourseId",n),o.append("courseId",n),e.uploadppt(n,a[0],o)):(o.append("tempCourseId",0),$.ajax({url:CONFIG.apiOnline+"/course/add",dataType:"json",type:"post",data:{sid:e.sid,token:e.token,pptName:a[0]},success:function(t){0==t.code?(o.append("courseId",t.data.courseId),e.uploadppt(t.data.courseId,a[0],o)):e.showMsg(t.errorInfo,"error")},error:function(){e.showMsg("新增课程失败，请刷新页面重试！","error")}}))})},uploadppt:function(t,o,n){$.ajax({url:CONFIG.apiOnline+"/course/upload/ppt",type:"POST",data:n,dataType:"JSON",async:!0,cache:!1,contentType:!1,processData:!1,xhr:function(){var t=$.ajaxSettings.xhr();return t.upload.onloadstart=function(){e.$progressBar.css("width","1%"),e.$progressText.html("正在上传：<span >0%</span>"),e.$mask.fadeIn(200)},t.upload.onprogress=e.onprogress,t},success:function(t){0==t.code?e.showMsg("上传成功！正在同步列表...","success"):e.showMsg(t.errorInfo,"error")},error:function(){e.showMsg("文件上传失败！请重试！","error"),e.$mask.fadeOut(200);var t=formWrap.parent();formWrap.remove(),t.html(e.formUI(courseID)),e.inputFileBind()}})},sendUploadMsg:function(t,o){e.sendMsg({bizType:10008,sid:e.sid,token:e.token,time:(new Date).getTime(),data:{courseId:t,updateType:"WEB",status:o}})},onprogress:function(t){var o=t.loaded,n=t.total,a=Math.floor(100*o/n);e.$progressBar.css("width",a+"%"),e.$progressText.html(a+"%"),100==a?e.$progressText.html("正在生成课程，请您稍作等待..."):e.$progressText.html("正在上传：<span >"+s+"%</span>")},updateBtnSureBind:function(){e.$update.find(".btn-sure").unbind("click"),e.$update.find(".btn-sure").on("click",function(){e.$update.fadeOut("300")})}}).init()});