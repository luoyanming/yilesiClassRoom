/**
 * @author luoym
 * @email 13575458746@163.com
 * @descrip 
 * @version v2.0.1
 */
"use strict";$(function(){var d,r=null;({init:function(){(d=this).heartCount=0,d.UIInit(),d.sid=localStorage.getItem("sid"),d.token=localStorage.getItem("token"),d.sid&&d.token?d.webSocketInit():location.href="./index.html?from=lesson&v="+CONFIG.version},UIInit:function(){d.$buttonLogout=$("#buttonLogout"),d.$loading=$(".loading"),d.$onlyone=$(".onlyone"),d.$list=$(".list"),d.$update=$(".update"),d.$failure=$(".failure"),d.courseIdArr=[],d.$buttonLogout.on("click",function(){d.sendMsg({bizType:10011,sid:d.sid,token:d.token,data:{opType:1001101}}),r.close(),location.href="./index.html?from=lesson&v="+CONFIG.version})},webSocketInit:function(){"WebSocket"in window?r=new WebSocket("ws://"+CONFIG.online):alert("当前浏览器不支持 webSocket, 请更换最新版谷歌浏览器！"),r.onerror=function(){console.log("WebSocket连接发生错误")},r.onopen=function(){console.log("WebSocket连接成功"),d.sendHeartMsg(),d.sendMsg({bizType:10002,sid:d.sid,token:d.token,data:{loginType:2}})},r.onmessage=function(e){d.doReceiveMsg(e.data)},r.onclose=function(){console.log("WebSocket连接关闭")},window.onbeforeunload=function(){d.sendMsg({bizType:10011,sid:d.sid,token:d.token,data:{opType:1001101}}),r.close()}},sendHeartMsg:function(){setInterval(function(){d.heartCount<3?d.sendMsg({bizType:10006,data:{}}):location.href=location.href},5e3)},doReceiveMsg:function(e){if(10001==(e=JSON.parse(e)).code)d.sendMsg({bizType:10001,data:{}});else if(10002==e.code)$("#avatar").attr("src",e.data.userface),$("#nickname").html(e.data.name),d.getCourseList();else if(10006==e.code)d.heartCount-=1;else if(10007==e.code)r.close(),alert("您的账号已在其它地点登录，将被强制下线！"),location.href="./index.html?v="+CONFIG.version;else if(10009==e.code){if("block"==$(".onlyone").css("display"))return d.getCourseList(),!1;var t=$("#form-"+e.data.courseId).parent().parent();if(e.data.errorInfo){2==e.data.addType&&t.parent().remove(),d.$failure.find(".text").html(e.data.errorInfo),d.$failure.fadeIn(300),d.failureBtnSureBind();var a=$("#form-"+e.data.courseId).parent();return $("#form-"+e.data.courseId).remove(),$("#progress-"+e.data.courseId).remove(),$("#load-"+e.data.courseId).remove(),a.html(d.formUI(e.data.courseId)),d.inputFileBind(),!1}if(0==e.data.addType)""==e.data.picUrl?t.find(".thumb").attr("src","./static/images/course-default.png"):t.find(".thumb").attr("src",e.data.picUrl),-1==d.courseIdArr.indexOf(e.data.courseId)&&(d.courseIdArr.push(e.data.courseId),d.courseAppAddUI(e.data.courseId,e.data.picUrl,e.data.courseName));else if(1==e.data.addType)d.courseIdArr.push(e.data.courseId),d.courseAppAddUI(e.data.courseId,e.data.picUrl,e.data.courseName);else if(2==e.data.addType)d.courseIdArr.push(e.data.courseId),""==e.data.picUrl?t.find(".thumb").attr("src","./static/images/course-default.png"):t.find(".thumb").attr("src",e.data.picUrl);else if(4==e.data.addType){$("#form-"+e.data.courseId).parent().parent().parent().remove();for(var s=0;s<d.courseIdArr.length;s++)e.data.courseId==d.courseIdArr[s]&&d.courseIdArr.splice(s,1)}8<e.data.courseName.length?t.parent().find(".title").html(e.data.courseName.substring(0,8)+"..."):t.parent().find(".title").html(e.data.courseName),$("#progress-"+e.data.courseId).remove(),$("#load-"+e.data.courseId).remove(),e.data.refresh||(d.$update.fadeIn(300),d.updateBtnSureBind())}else 1000901==e.code||80011==e.code&&(r.close(),location.href="./index.html?from=lesson&v="+CONFIG.version)},sendMsg:function(e){r.send(JSON.stringify(e))},showMsg:function(e,t){$(".message")&&0<$(".message").length&&$(".message").remove(),$("body").append('<div class="message '+t+'">'+e+"</div>"),setTimeout(function(){var e=$(".message");e.addClass("message-show"),setTimeout(function(){e.removeClass("message-show")},1500)},200)},getCourseList:function(){$.ajax({url:CONFIG.apiOnline+"/index/course/list",dataType:"json",type:"post",data:{sid:d.sid,token:d.token,name:"",pageNo:1,pageSize:1e3},success:function(e){0==e.data.list.length?d.createOnlyone():d.createList(e.data.list,e.data.notEndCourseIds)},error:function(){d.showMsg("获取课程列表失败，请刷新页面重试！","error")}})},createOnlyone:function(){d.$onlyone.fadeIn(300).find(".file-wrap").html(d.formUI("0")),d.$loading.fadeOut(200),d.inputFileBind()},createList:function(e,t){var a="";a+="<ul>",a+='<li class="list-item">',a+='<div class="upload-wrap">',a+='<div class="file-wrap">',a+=d.formUI("0"),a+="</div>",a+="</div>",a+='<p class="title">新建课程</p>',a+="</li>";for(var s=0;s<e.length;s++)d.courseIdArr.push(e[s].id),a+='<li class="list-item">',a+='<div class="upload-wrap">',""==e[s].picUrl?a+='<img src="./static/images/course-default.png" class="thumb">':a+='<img src="'+e[s].picUrl+'" class="thumb">',a+='<div class="mask-plus"></div>',a+='<div class="file-wrap">',a+=d.formUI(e[s].id),a+="</div>",console.log(0),-1<t.indexOf(e[s].id)&&(console.log(1),a+=d.loadUI(e[s].id)),a+="</div>",8<e[s].name.length?a+='<p class="title">'+e[s].name.substring(0,8)+"...</p>":a+='<p class="title">'+e[s].name+"</p>",a+="</li>";a+="</ul>",d.$list.html(a).fadeIn(300),d.$onlyone.empty(),d.$loading.fadeOut(200),d.inputFileBind()},formUI:function(e){return'<form id="form-'+e+'" data-id="'+e+'"><input type="file" name="file" class="input-file" id="file-'+e+'"></form>'},inputFileBind:function(){var e=$("form .input-file");e.unbind("change"),e.change(function(){var e=$(this).parent(),t=new FormData,a=e.attr("data-id"),s=$(this)[0].files[0].name,r=$(this)[0].files[0].size,n=s.split("."),o=n[n.length-1].toLowerCase(),i=s.substring(0,s.length-o.length-1);return["ppt","pptx","pdf","mp3","m4a","jpg","png","jpeg"].indexOf(o)<0?(d.showMsg("请上传 .ppt、.pptx、.pdf、.mp3、m4a、jpg、jpeg、png 格式的文件！","error"),d.reBindUpload(a),!1):104857600<r?(d.$failure.find(".text").html("您上传的PPT《"+s+"》大小超过限制，请上传小于100MB的PPT！"),d.$failure.fadeIn(300),d.failureBtnSureBind(),d.reBindUpload(a),!1):(t.append("file",$(this)[0].files[0]),t.append("sid",d.sid),t.append("token",d.token),t.append("deviceType",1),void(0!=a?(t.append("tempCourseId",a),t.append("courseId",a),d.uploadppt(0,a,i,t)):(t.append("tempCourseId",0),$.ajax({url:CONFIG.apiOnline+"/course/add",dataType:"json",type:"post",data:{sid:d.sid,token:d.token,pptName:n[0]},success:function(e){0==e.code?(t.append("courseId",e.data.courseId),d.uploadppt(1,e.data.courseId,i,t)):d.showMsg(e.errorInfo,"error")},error:function(){d.showMsg("新增课程失败，请刷新页面重试！","error")}}))))})},uploadppt:function(t,a,s,e){$.ajax({url:CONFIG.apiOnline+"/course/upload/ppt",type:"POST",data:e,dataType:"JSON",async:!0,cache:!1,contentType:!1,processData:!1,xhr:function(){var e=$.ajaxSettings.xhr();return e.upload.onloadstart=function(){if(0==t)$("#form-"+a).parent().parent().append(d.progressUI(a));else if(1==t)if($("#form-0").attr("data-id",a).attr("id","form-"+a),$("#file-0").attr("id","file-"+a),"block"==$(".onlyone").css("display"))$("#form-"+a).parent().parent().find(".text").hide(),$("#form-"+a).parent().parent().append(d.progressUI(a)),$("#form-"+a).parent().parent().prepend('<img src="./static/images/course-default.png" class="thumb">');else{var e="";e+='<li class="list-item">',e+='<div class="upload-wrap">',e+='<div class="file-wrap">',e+=d.formUI("0"),e+="</div>",e+="</div>",e+='<p class="title">新建课程</p>',e+="</li>",'<img src="./static/images/course-default.png" class="thumb">','<div class="mask-plus"></div>',$("#form-"+a).parent().parent().append(d.progressUI(a)),$("#form-"+a).parent().parent().prepend('<img src="./static/images/course-default.png" class="thumb"><div class="mask-plus"></div>'),8<s.length?$("#form-"+a).parent().parent().parent().find(".title").html(s.substring(0,8)+"..."):$("#form-"+a).parent().parent().parent().find(".title").html(s),d.$list.find("ul").prepend(e),d.inputFileBind()}},e.upload.onprogress=function(e){d.onprogress(a,e)},e},success:function(e){d.reBindUpload(a),0==e.code?(d.courseIdArr.push(a),$("#form-"+a).parent().parent().append(d.loadUI(a)),$("#progress-"+a).hide(),$("#load-"+a).fadeIn()):d.showMsg(e.errorInfo,"error")},error:function(){d.showMsg("文件上传失败！请重试！","error"),d.reBindUpload(a)}})},reBindUpload:function(e){var t=$("#form-"+e).parent();$("#form-"+e).remove(),t.html(d.formUI(e)),t.parent().find(".text").show(),d.inputFileBind()},progressUI:function(e){var t="";return t+='<div class="mask-progress" id="progress-'+e+'">',t+='<div class="progress-box">',t+='<div class="progress-bar" style="width: 1%;"></div>',t+="</div>",t+='<div class="progress-text">0%</div>',t+="</div>"},loadUI:function(e){var t="";return t+='<div class="load" id="load-'+e+'">',t+='<div class="load-icon"></div>',t+='<div class="load-text">课件生成中...</div>',t+="</div>"},courseAppAddUI:function(e,t,a){var s="";s+='<li class="list-item">',s+='<div class="upload-wrap">',s+=""==t?'<img src="./static/images/course-default.png" class="thumb">':'<img src="'+t+'" class="thumb">',s+='<div class="mask-plus"></div>',s+='<div class="file-wrap">',s+=d.formUI(e),s+="</div>",s+="</div>",8<a.length?s+='<p class="title">'+a.substring(0,8)+"...</p>":s+='<p class="title">'+a+"</p>",s+="</li>",d.$list.find("ul li").eq(0).after(s)},sendUploadMsg:function(e,t){d.sendMsg({bizType:10008,sid:d.sid,token:d.token,time:(new Date).getTime(),data:{courseId:e,updateType:"WEB",status:t}})},onprogress:function(e,t){var a=t.loaded,s=t.total,r=Math.floor(100*a/s),n=$("#progress-"+e);n.find(".progress-bar").css("width",r+"%"),n.find(".progress-text").html(r+"%")},updateBtnSureBind:function(){d.$update.find(".btn-sure").unbind("click"),d.$update.find(".btn-sure").on("click",function(){d.$update.fadeOut("300")})},failureBtnSureBind:function(){d.$failure.find(".btn-sure").unbind("click"),d.$failure.find(".btn-sure").on("click",function(){d.$failure.fadeOut("300")})}}).init()});