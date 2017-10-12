/**
 * @author luoym
 * @email 13575458746@163.com
 * @descrip 
 * @version v1.0.0
 */
$(function(){var e,t=null;({init:function(){e=this,e.heartCount=0,e.UIInit(),e.sid=localStorage.getItem("sid"),e.token=localStorage.getItem("token"),e.sid&&e.token?e.webSocketInit():location.href="./index.html?from=lesson"},UIInit:function(){e.$buttonLogout=$("#buttonLogout"),e.$loading=$(".loading"),e.$onlyone=$(".onlyone"),e.$list=$(".list"),e.$update=$(".update"),e.$buttonLogout.on("click",function(){e.sendMsg({bizType:10011,sid:e.sid,token:e.token,data:{opType:1001101}}),t.close(),window.location.href="./index.html?from=lesson"})},webSocketInit:function(){"WebSocket"in window?t=new WebSocket("ws://"+CONFIG.online):alert("当前浏览器不支持 webSocket, 请更换最新版谷歌浏览器！"),t.onerror=function(){console.log("WebSocket连接发生错误")},t.onopen=function(){console.log("WebSocket连接成功"),e.sendHeartMsg(),e.sendMsg({bizType:10002,sid:e.sid,token:e.token,data:{loginType:2}})},t.onmessage=function(t){e.doReceiveMsg(t.data)},t.onclose=function(){console.log("WebSocket连接关闭")},window.onbeforeunload=function(){e.sendMsg({bizType:10011,sid:e.sid,token:e.token,data:{opType:1001101}}),t.close()}},sendHeartMsg:function(){setInterval(function(){e.heartCount<3?e.sendMsg({bizType:10006,data:{}}):location.href=location.href},5e3)},doReceiveMsg:function(a){if(a=JSON.parse(a),console.log(a),10001==a.code)e.sendMsg({bizType:10001,data:{}});else if(10002==a.code)$("#avatar").attr("src",a.data.userface),$("#nickname").html(a.data.name),e.getCourseList();else if(10006==a.code)e.heartCount-=1;else if(10007==a.code)t.close(),alert("您的账号已在其它地点登录，将被强制下线！"),location.href="./index.html";else if(10009==a.code){if("block"==$(".onlyone").css("display"))return e.getCourseList(),!1;var s=$("#form-"+a.data.courseId).parent().parent();if(0==a.data.addType||2==a.data.addType)""==a.data.picUrl?s.find(".thumb").attr("src","./static/images/course-default.png"):s.find(".thumb").attr("src",a.data.picUrl);else if(1==a.data.addType){var n="";n+='<li class="list-item">',n+='<div class="upload-wrap">',""==a.data.picUrl?n+='<img src="./static/images/course-default.png" class="thumb">':n+='<img src="'+a.data.picUrl+'" class="thumb">',n+='<div class="mask-plus"></div>',n+='<div class="file-wrap">',n+=e.formUI(a.data.courseId),n+="</div>",n+="</div>",a.data.courseName.length>8?n+='<p class="title">'+a.data.courseName.substring(0,8)+"...</p>":n+='<p class="title">'+a.data.courseName+"</p>",n+="</li>",e.$list.find("ul li").eq(0).after(n)}else 4==a.data.addType&&$("#form-"+a.data.courseId).parent().parent().parent().remove();a.data.courseName.length>8?s.parent().find(".title").html(a.data.courseName.substring(0,8)+"..."):s.parent().find(".title").html(a.data.courseName),$("#progress-"+a.data.courseId).remove(),$("#load-"+a.data.courseId).remove(),a.data.refresh||(e.$update.fadeIn(300),e.updateBtnSureBind())}else 80011==a.code&&(t.close(),location.href="./index.html?from=lesson")},sendMsg:function(e){t.send(JSON.stringify(e))},showMsg:function(e,t){$(".message")&&$(".message").length>0&&$(".message").remove(),$("body").append('<div class="message '+t+'">'+e+"</div>"),setTimeout(function(){var e=$(".message");e.addClass("message-show"),setTimeout(function(){e.removeClass("message-show")},1500)},200)},getCourseList:function(){$.ajax({url:CONFIG.apiOnline+"/index/course/list",dataType:"json",type:"post",data:{sid:e.sid,token:e.token,name:"",pageNo:1,pageSize:1e3},success:function(t){0==t.data.list.length?e.createOnlyone():e.createList(t.data.list)},error:function(){e.showMsg("获取课程列表失败，请刷新页面重试！","error")}})},createOnlyone:function(){e.$onlyone.fadeIn(300).find(".file-wrap").html(e.formUI("0")),e.$loading.fadeOut(200),e.inputFileBind()},createList:function(t){var a="";a+="<ul>",a+='<li class="list-item">',a+='<div class="upload-wrap">',a+='<div class="file-wrap">',a+=e.formUI("0"),a+="</div>",a+="</div>",a+='<p class="title">新建课程</p>',a+="</li>";for(var s=0;s<t.length;s++)a+='<li class="list-item">',a+='<div class="upload-wrap">',""==t[s].picUrl?a+='<img src="./static/images/course-default.png" class="thumb">':a+='<img src="'+t[s].picUrl+'" class="thumb">',a+='<div class="mask-plus"></div>',a+='<div class="file-wrap">',a+=e.formUI(t[s].id),a+="</div>",a+="</div>",t[s].name.length>8?a+='<p class="title">'+t[s].name.substring(0,8)+"...</p>":a+='<p class="title">'+t[s].name+"</p>",a+="</li>";a+="</ul>",e.$list.html(a).fadeIn(300),e.$onlyone.empty(),e.$loading.fadeOut(200),e.inputFileBind()},formUI:function(e){return'<form id="form-'+e+'" data-id="'+e+'"><input type="file" name="file" class="input-file" id="file-'+e+'"></form>'},inputFileBind:function(){var t=$("form .input-file");t.unbind("change"),t.change(function(){var t=$(this).parent(),a=new FormData,s=t.attr("data-id"),n=$(this)[0].files[0].name,o=n.split("."),i=o[o.length-1];if("ppt"!==i&&"pptx"!==i)return e.showMsg("请上传 .ppt 或 .pptx 格式的文件！","error"),!1;a.append("file",$(this)[0].files[0]),a.append("sid",e.sid),a.append("token",e.token),a.append("deviceType",1),0!=s?(a.append("tempCourseId",s),a.append("courseId",s),e.uploadppt(0,s,o[0],a)):(a.append("tempCourseId",0),$.ajax({url:CONFIG.apiOnline+"/course/add",dataType:"json",type:"post",data:{sid:e.sid,token:e.token,pptName:o[0]},success:function(t){0==t.code?(a.append("courseId",t.data.courseId),e.uploadppt(1,t.data.courseId,o[0],a)):e.showMsg(t.errorInfo,"error")},error:function(){e.showMsg("新增课程失败，请刷新页面重试！","error")}}))})},uploadppt:function(t,a,s,n){$.ajax({url:CONFIG.apiOnline+"/course/upload/ppt",type:"POST",data:n,dataType:"JSON",async:!0,cache:!1,contentType:!1,processData:!1,xhr:function(){var n=$.ajaxSettings.xhr();return n.upload.onloadstart=function(){if(0==t)$("#form-"+a).parent().parent().append(e.progressUI(a));else if(1==t)if($("#form-0").attr("data-id",a).attr("id","form-"+a),$("#file-0").attr("id","file-"+a),"block"==$(".onlyone").css("display"))$("#form-"+a).parent().parent().find(".text").hide(),$("#form-"+a).parent().parent().append(e.progressUI(a)),$("#form-"+a).parent().parent().prepend('<img src="./static/images/course-default.png" class="thumb">');else{var n="",o="";n+='<li class="list-item">',n+='<div class="upload-wrap">',n+='<div class="file-wrap">',n+=e.formUI("0"),n+="</div>",n+="</div>",n+='<p class="title">新建课程</p>',n+="</li>",o+='<img src="./static/images/course-default.png" class="thumb">',o+='<div class="mask-plus"></div>',$("#form-"+a).parent().parent().append(e.progressUI(a)),$("#form-"+a).parent().parent().prepend(o),$("#form-"+a).parent().parent().parent().find(".title").html(s),e.$list.find("ul").prepend(n),e.inputFileBind()}},n.upload.onprogress=function(t){e.onprogress(a,t)},n},success:function(t){0==t.code?($("#form-"+a).parent().parent().append(e.loadUI(a)),$("#progress-"+a).hide(),$("#load-"+a).fadeIn()):e.showMsg(t.errorInfo,"error")},error:function(){e.showMsg("文件上传失败！请重试！","error");var t=$("#form-"+a).parent();$("#form-"+a).remove(),t.html(e.formUI(courseID)),t.parent().find(".text").show(),e.inputFileBind()}})},progressUI:function(e){var t="";return t+='<div class="mask-progress" id="progress-'+e+'">',t+='<div class="progress-box">',t+='<div class="progress-bar" style="width: 1%;"></div>',t+="</div>",t+='<div class="progress-text">0%</div>',t+="</div>"},loadUI:function(e){var t="";return t+='<div class="load" id="load-'+e+'">',t+='<div class="load-icon"></div>',t+='<div class="load-text">课件生成中...</div>',t+="</div>"},sendUploadMsg:function(t,a){e.sendMsg({bizType:10008,sid:e.sid,token:e.token,time:(new Date).getTime(),data:{courseId:t,updateType:"WEB",status:a}})},onprogress:function(e,t){var a=t.loaded,s=t.total,n=Math.floor(100*a/s),o=$("#progress-"+e);o.find(".progress-bar").css("width",n+"%"),o.find(".progress-text").html(n+"%")},updateBtnSureBind:function(){e.$update.find(".btn-sure").unbind("click"),e.$update.find(".btn-sure").on("click",function(){e.$update.fadeOut("300")})}}).init()});