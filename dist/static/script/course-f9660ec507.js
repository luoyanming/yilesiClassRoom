/**
 * @author luoym
 * @email 13575458746@163.com
 * @descrip 
 * @version v1.0.0
 */
var that,ws=null,INDEX={init:function(){""==document.referrer&&(localStorage.setItem("sid",""),localStorage.setItem("token",""),this.clearLocalStorage(),localStorage.removeItem("bindcardData"),localStorage.removeItem("bindStudentData"),localStorage.removeItem("zoom"),localStorage.removeItem("PresentationStep")),that=this,that.UIInit(),that.$connection.hide(),that.$screen.hide(),that.showLoading("正在连接易乐思课堂..."),that.sid=localStorage.getItem("sid"),that.token=localStorage.getItem("token"),that.sid&&that.token?that.webSocketInit():location.href="./index.html?from=class",that.heartCount=0,$(window).unbind("resize"),$(window).on("resize",function(){localStorage.getItem("picUrl")?that.showImage(localStorage.getItem("picUrl"),localStorage.getItem("answerType"),localStorage.getItem("isAnswer"),"",localStorage.getItem("htmlUrl"),""):(that.$connection.fadeIn(200),that.$screen.fadeIn(200),that.$loading.fadeOut(200)),that.showSessionMask()})},UIInit:function(){that.audioCurrenttimeTimeout,that.$course=$("#course"),that.$connection=$("#connection"),that.$loading=$("#loading"),that.$screen=$("#screen"),that.$courseImg=$("#courseImg"),that.$courseIframe=$("#courseIframe"),that.$audioBox=$("#audioBox"),that.$toolbar=$("#toolbar"),that.$buttonRefresh=$("#button-refresh"),that.$buttonFullscreen=$("#button-fullscreen"),that.$bindcard=$("#bindcard"),that.$bindlist=$("#bindlist"),that.$buttonRefresh.unbind("click"),that.$buttonRefresh.on("click",that.buttonRefreshBind),that.$buttonFullscreen.unbind("click"),that.$buttonFullscreen.on("click",that.buttonFullscreenBind)},webSocketInit:function(){"WebSocket"in window?ws=new WebSocket("ws://"+CONFIG.online):alert("当前浏览器不支持 webSocket, 请更换最新版谷歌浏览器！"),ws.onopen=function(){console.log("WebSocket连接成功"),that.sendHeartMsg(),that.sendMsg({bizType:10002,sid:that.sid,token:that.token,data:{loginType:2}})},ws.onmessage=function(t){that.doReceiveMsg(t.data)},ws.onclose=function(){console.log("WebSocket连接关闭"),ws.close(),ws=null,that.$screen.hide(),that.showLoading("连接已断开，正在重新连接，请稍候"),that.webSocketInit()},window.onbeforeunload=function(){that.sendMsg({bizType:10011,sid:that.sid,token:that.token,data:{opType:1001101}}),ws.close()}},clearLocalStorage:function(){localStorage.removeItem("sessionType"),localStorage.removeItem("picUrl"),localStorage.removeItem("htmlUrl"),localStorage.removeItem("answerType"),localStorage.removeItem("isAnswer"),localStorage.removeItem("timeClock"),localStorage.removeItem("answerNum"),localStorage.removeItem("answerCharts"),localStorage.removeItem("answerStudent"),localStorage.removeItem("unAnswerStudent"),localStorage.removeItem("canvasData"),localStorage.removeItem("audioTime"),localStorage.removeItem("scale"),localStorage.removeItem("audioStatus"),$(".imgbox").removeAttr("style"),$(".canvas").removeAttr("style")},sendHeartMsg:function(){setInterval(function(){that.heartCount<3?that.sendMsg({bizType:10006,data:{}}):location.href=location.href},5e3)},doReceiveMsg:function(t){if(t=JSON.parse(t),-1==t.code);else if(10001==t.code)that.sendMsg({bizType:10001,data:{}});else if(10002==t.code)localStorage.getItem("picUrl")?that.showImage(localStorage.getItem("picUrl"),localStorage.getItem("answerType"),localStorage.getItem("isAnswer"),"",localStorage.getItem("htmlUrl"),""):(that.$connection.fadeIn(200),that.$screen.fadeIn(200),that.$loading.fadeOut(200)),that.showSessionMask();else if(10006==t.code)that.heartCount-=1;else if(10007==t.code)ws.close(),alert("您的账号已在其它地点登录，将被强制下线！"),location.href="./index.html?from=class";else if(10014==t.code){var e=document.getElementById("audio");switch(t.data.opType){case 1:e.play(),localStorage.setItem("audioStatus","1");break;case 2:e.pause(),localStorage.setItem("audioStatus","2");break;case 3:e.currentTime=0,that.setStorageAudioTime(0),that.sendAudioMsg(1),e.play(),localStorage.setItem("audioStatus","1");break;case 4:e.currentTime>e.duration-parseInt(t.data.seconds)?e.currentTime=e.duration:e.currentTime=e.currentTime+parseInt(t.data.seconds),that.setStorageAudioTime(e.currentTime),that.sendAudioMsg(1),e.play(),localStorage.setItem("audioStatus","1");break;case 5:e.currentTime<parseInt(t.data.seconds)?e.currentTime=0:e.currentTime=e.currentTime-parseInt(t.data.seconds),that.setStorageAudioTime(e.currentTime),that.sendAudioMsg(1),e.play(),localStorage.setItem("audioStatus","1");break;default:return}}else if(10015==t.code)console.log(10015),1==t.data.pptOpType?(courseIframe.window.Presentation.Prev(),setTimeout(function(){localStorage.setItem("PresentationStep",courseIframe.window.Presentation.CurrentStatus().step)},200),that.sendMsg({bizType:10015,sid:that.sid,token:that.token,data:{sourceType:"web",pptOpType:1}})):2==t.data.pptOpType&&(courseIframe.window.Presentation.Next(),setTimeout(function(){localStorage.setItem("PresentationStep",courseIframe.window.Presentation.CurrentStatus().step)},200),that.sendMsg({bizType:10015,sid:that.sid,token:that.token,data:{sourceType:"web",pptOpType:2}}));else if(80002==t.code)this.clearLocalStorage(),that.$connection.fadeIn(200),that.$screen.find("#canvas").remove(),that.$screen.find(".state-before").remove(),that.$screen.find(".state-doing").remove(),that.$screen.find(".state-after").remove(),that.$screen.find(".chart").remove(),that.$screen.find(".student").remove(),that.$screen.find(".unAnswer-student").remove(),that.$courseImg.hide(),$("#courseIframe").remove(),that.$audioBox.hide(),that.$audioBox.find("audio").remove(),that.$screen.fadeIn(200),that.$loading.fadeOut(200);else if(80003==t.code)clearInterval(that.audioCurrenttimeTimeout),localStorage.removeItem("zoom"),localStorage.removeItem("PresentationStep"),localStorage.setItem("sessionType","0"),t.data.picList?(this.clearLocalStorage(),t.data.htmlList?that.showImage(t.data.picUrl,t.data.answerType,t.data.isAnswer,t.data.picList,t.data.htmlUrl,t.data.htmlList):that.showImage(t.data.picUrl,t.data.answerType,t.data.isAnswer,t.data.picList,t.data.htmlUrl,"")):that.showImage(t.data.picUrl,t.data.answerType,t.data.isAnswer,"",t.data.htmlUrl,"");else if(80004==t.code)localStorage.setItem("sessionType","2"),that.$screen.find(".state-before").remove(),that.$screen.find(".state-after").remove(),that.$screen.find(".chart").remove(),that.startAnswer();else if(80005==t.code)localStorage.setItem("sessionType","3"),that.endAnswer();else if(80006==t.code)localStorage.setItem("sessionType","4"),localStorage.setItem("answerCharts",JSON.stringify(t.data.answerInfo)),that.showAnswerCharts();else if(80007==t.code)localStorage.setItem("sessionType","5"),localStorage.setItem("answerStudent",JSON.stringify(t.data)),that.showStudent();else if(80008==t.code)localStorage.setItem("answerNum",t.data.answerNum),that.$screen.find(".state-doing .text-number .number").html("答题人数："+t.data.answerNum+"人");else if(80009==t.code)localStorage.setItem("sessionType","3"),that.$screen.find(".chart").remove(),that.endAnswer();else if(80010==t.code)localStorage.setItem("sessionType","4"),that.$screen.find(".student").remove(),that.showAnswerCharts();else if(80011==t.code)ws.close(),location.href="./index.html?from=class";else if(80013==t.code)localStorage.setItem("sessionType","80"),localStorage.setItem("bindcardData",JSON.stringify(t.data)),that.showBindCard();else if(80014==t.code)localStorage.setItem("sessionType","81"),localStorage.setItem("bindStudentData",JSON.stringify(t.data)),that.showBindStudent();else if(80015==t.code)that.$bindcard.removeClass("bindcard-active").hide(),that.$bindlist.hide(),that.$connection.fadeIn(300);else if(80016==t.code){var a=JSON.parse(localStorage.getItem("bindcardData"));a.stuNum=t.data.stuNum,localStorage.setItem("bindcardData",JSON.stringify(a)),that.$bindcard.find(".card-info span").html(t.data.stuNum)}else if(80017==t.code){var o=[];if(localStorage.getItem("canvasData")){o=JSON.parse(localStorage.getItem("canvasData"));for(var n=0;n<o.length;n++)if(o[n].picUrl==localStorage.getItem("picUrl"))return void that.canvasInit()}else o=[];o.push({picUrl:localStorage.getItem("picUrl"),data:{width:t.data.initData.width,height:t.data.initData.height}}),localStorage.setItem("canvasData",JSON.stringify(o)),that.canvasInit()}else if(80018==t.code){for(var o=JSON.parse(localStorage.getItem("canvasData")),r=t.data.points[0],s=localStorage.getItem("picUrl"),n=0;n<o.length;n++)if(o[n].picUrl==s){var i=o[n].data;if(i.lines){for(var c=0;c<i.lines.length;c++)if(i.lines[c].lineId==r.lineId)return i.lines[c].location||(i.lines[c].location=[]),i.lines[c].location.push({x:r.x,y:r.y}),localStorage.setItem("canvasData",JSON.stringify(o)),void that.drawCanvas();return i.lines.push({lineId:r.lineId,color:r.color,isEraser:r.isEraser,location:[{x:r.x,y:r.y}]}),localStorage.setItem("canvasData",JSON.stringify(o)),void that.drawCanvas()}return i.lines=[],i.lines.push({lineId:r.lineId,color:r.color,isEraser:r.isEraser,location:[{x:r.x,y:r.y}]}),localStorage.setItem("canvasData",JSON.stringify(o)),void that.drawCanvas()}}else if(80019==t.code)localStorage.setItem("zoom",JSON.stringify(t.data.zoomObj)),that.zoomAndMove();else if(80020==t.code){for(var o=JSON.parse(localStorage.getItem("canvasData")),s=localStorage.getItem("picUrl"),n=0;n<o.length;n++)if(o[n].picUrl==s){o[n].data.lines=[],localStorage.setItem("canvasData",JSON.stringify(o));var l=document.getElementById("canvas"),d=l.getContext("2d");d.clearRect(0,0,$("#canvas").width(),$("#canvas").height())}}else 80021==t.code?(localStorage.setItem("sessionType","6"),localStorage.setItem("unAnswerStudent",JSON.stringify(t.data)),that.$screen.find(".state-doing").hide(),that.showUnAnswerStudent()):80022==t.code&&(that.$screen.find(".unAnswer-student").remove(),that.$screen.find(".state-doing").show(),localStorage.setItem("sessionType","2"),that.$screen.find(".state-before").remove(),that.$screen.find(".state-after").remove(),that.$screen.find(".chart").remove(),that.startAnswer())},sendMsg:function(t){ws.send(JSON.stringify(t))},showImage:function(t,e,a,o,n,r){if(t!=localStorage.getItem("picUrl")&&localStorage.setItem("audioStatus","2"),localStorage.setItem("picUrl",t),localStorage.setItem("htmlUrl",n),localStorage.setItem("answerType",e),localStorage.setItem("isAnswer",a?"true":""),that.$connection.hide(),that.$screen.hide(),that.$courseImg.hide(),$("#courseIframe").remove(),that.$screen.find("#canvas").remove(),that.$screen.find(".state-before").remove(),that.$screen.find(".state-doing").remove(),that.$screen.find(".state-after").remove(),that.$screen.find(".chart").remove(),that.$screen.find(".student").remove(),that.$screen.find(".unAnswer-student").remove(),that.$audioBox.find("audio").remove(),that.$audioBox.hide(),that.showLoading("正在同步显示手机屏幕，请稍候"),localStorage.getItem("zoom")&&that.zoomAndMove(),n){var s=document.createElement("iframe");s.id="iframe",s.src=n,s.style.display="none",s.attachEvent?s.attachEvent("onload",function(){that.afterShowImage(),$("#iframe").remove(),$("#courseIframe").show(),that.showPresentation()}):s.onload=function(){that.afterShowImage(),$("#iframe").remove(),$("#courseIframe").show(),that.showPresentation()},that.$screen.find(".imgbox").append('<iframe width="100%" height="100%" src="'+n+'" name="courseIframe" id="courseIframe" style="display: none;"></iframe>'),document.body.appendChild(s)}else{var i=t.split(".");if("mp3"==i[i.length-1])that.$audioBox.append('<audio src="'+t+'" preload="metadata" id="audio"></audio>'),that.handleAudioEvents();else{var c,l,d=new Image,h=window.innerWidth,m=window.innerHeight-42;"number"!=typeof h&&("CSS1Compat"==document.compatMode?(h=document.documentElement.clientWidth,m=document.documentElement.clientHeight-42):(h=document.body.clientWidth,m=document.body.clientHeight-42)),c=h/m,d.crossOrigin="anonymous",d.onload=function(e){EXIF.getData(d,function(){l=EXIF.getTag(this,"Orientation");var e=d.width,a=d.height;switch(l){case void 0:case 1:var o=e/a;o>c?that.$courseImg.css({width:"100%",height:"auto","-webkit-transform":"translate3d(-50%, -50%, 0) rotate(0deg)",transform:"translate3d(-50%, -50%, 0) rotate(0deg)"}):that.$courseImg.css({width:"auto",height:"100%","-webkit-transform":"translate3d(-50%, -50%, 0) rotate(0deg)",transform:"translate3d(-50%, -50%, 0) rotate(0deg)"});break;case 3:var o=e/a;o>c?that.$courseImg.css({width:"100%",height:"auto","-webkit-transform":"translate3d(-50%, -50%, 0) rotate(-180deg)",transform:"translate3d(-50%, -50%, 0) rotate(-180deg)"}):that.$courseImg.css({width:"auto",height:"100%","-webkit-transform":"translate3d(-50%, -50%, 0) rotate(-180deg)",transform:"translate3d(-50%, -50%, 0) rotate(-180deg)"});break;case 6:var o=a/e;o>c?that.$courseImg.css({width:"auto",height:h,"-webkit-transform":"translate3d(-50%, -50%, 0) rotate(-270deg)",transform:"translate3d(-50%, -50%, 0) rotate(-270deg)"}):that.$courseImg.css({width:m,height:"auto","-webkit-transform":"translate3d(-50%, -50%, 0) rotate(-270deg)",transform:"translate3d(-50%, -50%, 0) rotate(-270deg)"});break;case 8:var o=a/e;o>c?that.$courseImg.css({width:"auto",height:h,"-webkit-transform":"translate3d(-50%, -50%, 0) rotate(-90deg)",transform:"translate3d(-50%, -50%, 0) rotate(-90deg)"}):that.$courseImg.css({width:m,height:"auto","-webkit-transform":"translate3d(-50%, -50%, 0) rotate(-90deg)",transform:"translate3d(-50%, -50%, 0) rotate(-90deg)"})}that.$courseImg.attr("src",t).show(),that.afterShowImage()})},d.src=t}!r&&o&&that.preloadImages(o)}},showPresentation:function(){localStorage.getItem("PresentationStep")&&setTimeout(function(){var t=parseInt(localStorage.getItem("PresentationStep"))+1,e=parseInt(courseIframe.window.Presentation.CurrentStatus().slide);console.log(t,e),courseIframe.window.Presentation.JumpToAnim(t,e)},500)},handleAudioEvents:function(){var t=document.getElementById("audio");t.onloadedmetadata=function(){that.getStorageAudioTime()&&(t.currentTime=that.getStorageAudioTime()),that.showDuration(t.duration),that.showCurrentTime(t.currentTime),that.setStorageAudioTime(t.currentTime),that.$audioBox.find(".progress-bar").css("width",t.currentTime/t.duration*100+"%"),clearInterval(that.audioCurrenttimeTimeout),that.audioCurrenttimeTimeout=setInterval(function(){that.showCurrentTime(t.currentTime),that.setStorageAudioTime(t.currentTime),that.$audioBox.find(".progress-bar").css("width",t.currentTime/t.duration*100+"%")},1e3),that.sendAudioMsg(2),"1"==localStorage.getItem("audioStatus")&&t.play(),that.$audioBox.show(),that.afterShowImage()},t.onplay=function(){that.sendAudioMsg(1),that.showTipsText("正在播放中...")},t.onpause=function(){that.sendAudioMsg(2),that.showTipsText("暂停中...")},t.onended=function(){t.currentTime=0,that.setStorageAudioTime(0),that.sendAudioMsg(2),that.showTipsText("播放结束...")}},sendAudioMsg:function(t){that.sendMsg({bizType:10014,sid:that.sid,token:that.token,data:{sourceType:"web",mediaType:"audio",opType:t}})},setStorageAudioTime:function(t){var e=localStorage.getItem("picUrl"),a=JSON.parse(localStorage.getItem("audioTime"));if(a){for(var o=0;o<a.length;o++)if(e==a[o].picUrl)return a[o].time=t,localStorage.setItem("audioTime",JSON.stringify(a)),!1;return a.push({picUrl:e,time:t}),localStorage.setItem("audioTime",JSON.stringify(a)),!1}return a=new Array,a.push({picUrl:e,time:t}),localStorage.setItem("audioTime",JSON.stringify(a)),!1},getStorageAudioTime:function(){var t,e=localStorage.getItem("picUrl"),a=JSON.parse(localStorage.getItem("audioTime"));if(a)for(var o=0;o<a.length;o++)e==a[o].picUrl&&(t=a[o].time);else t=0;return t},afterShowImage:function(){that.$loading.fadeOut(200),that.$screen.fadeIn(200),localStorage.getItem("sessionType")&&"0"!=localStorage.getItem("sessionType")||that.showProblem(),that.canvasInit()},showTipsText:function(t){that.$audioBox.find(".text").html(t)},showDuration:function(t){that.$audioBox.find(".duration-time").html(that.concatMinuteSecond(t))},showCurrentTime:function(t){that.$audioBox.find(".current-time").html(that.concatMinuteSecond(t))},showSessionMask:function(){if(!localStorage.getItem("sessionType"))return!1;switch(parseInt(localStorage.getItem("sessionType"))){case 0:break;case 2:that.startAnswer();break;case 3:that.endAnswer();break;case 4:that.showAnswerCharts();break;case 5:that.showStudent();break;case 6:that.showUnAnswerStudent();break;case 80:that.showBindCard();break;case 81:that.showBindStudent();break;default:return}},showProblem:function(){if(answerType=parseInt(localStorage.getItem("answerType")),0!=answerType)if(localStorage.getItem("isAnswer")){var t="";t+='<div class="state-after">',t+='<div class="button-detail">查看结果</div>',t+='<p class="text">重新答题</p>',t+="</div>",that.$screen.append(t)}else switch(answerType){case 1:that.$screen.append('<div class="state-before">答题(单选)</div>');break;case 2:that.$screen.append('<div class="state-before">答题(多选)</div>');break;case 3:that.$screen.append('<div class="state-before">答题(判断)</div>');break;default:that.$screen.append("")}},startAnswer:function(){var t,e="";t=localStorage.getItem("timeClock")?JSON.parse(localStorage.getItem("timeClock")):{minutes:"00",seconds:"00"},e+='<div class="state-doing">',e+='<p class="text text-time">答题时间：00:'+t.minutes+":"+t.seconds+"</p>",e+='<p class="text text-number clearfix"><span class="number">答题人数：'+localStorage.getItem("answerNum")+'人</span><span class="btn-unAnswer">未答</span></p>',e+='<div class="button-stop">结束答题</div>',e+="</div>",that.$screen.find(".state-doing").remove(),that.$screen.append(e),that.timeClock()},endAnswer:function(){var t="";t+='<div class="state-after">',t+='<div class="button-detail">查看结果</div>',t+='<p class="text">重新答题</p>',t+="</div>",clearInterval(that.XF),localStorage.removeItem("timeClock"),that.$screen.find(".state-before").remove(),that.$screen.find(".state-doing").remove(),that.$screen.find(".state-after").remove(),that.$screen.append(t)},showAnswerCharts:function(){var t=JSON.parse(localStorage.getItem("answerCharts")),e=[],a=[];if(3==t.answerType)e=["✓","✕","误按","未答题"],a=[{value:t.numTrue,width:"",bgcolor:"#38A0FF"},{value:t.numFalse,width:"",bgcolor:"#FFFD38"},{value:t.wrongNum,width:"",bgcolor:"#D9D9D9"},{value:t.giveupNum,width:"",bgcolor:"#D9D9D9"}],"0"==t.answer||0==t.answer?a[1].bgcolor="#1EC51D":"1"!=t.answer&&1!=t.answer||(a[0].bgcolor="#1EC51D");else if(1==t.answerType){e=["A","B","C","D","E","F","误按","未答题"],a=[{value:t.numA,width:"",bgcolor:"#38A0FF"},{value:t.numB,width:"",bgcolor:"#FFFD38"},{value:t.numC,width:"",bgcolor:"#D71616"},{value:t.numD,width:"",bgcolor:"#D68A16"},{value:t.numE,width:"",bgcolor:"#7A38FF"},{value:t.numF,width:"",bgcolor:"#C238FF"},{value:t.wrongNum,width:"",bgcolor:"#D9D9D9"},{value:t.giveupNum,width:"",bgcolor:"#D9D9D9"}];var o=e.indexOf(t.answer);a[o].bgcolor="#1EC51D"}else 2==t.answerType&&(e=["A","B","C","D","E","F","答对","误按","未答题"],a=[{value:t.numA,width:"",bgcolor:"#38A0FF"},{value:t.numB,width:"",bgcolor:"#FFFD38"},{value:t.numC,width:"",bgcolor:"#D71616"},{value:t.numD,width:"",bgcolor:"#D68A16"},{value:t.numE,width:"",bgcolor:"#7A38FF"},{value:t.numF,width:"",bgcolor:"#C238FF"},{value:t.rightNum,width:"",bgcolor:"#1EC51D"},{value:t.wrongNum,width:"",bgcolor:"#D9D9D9"},{value:t.giveupNum,width:"",bgcolor:"#D9D9D9"}]);for(var n=[],r=0;r<a.length;r++)n.push(a[r].value);n.sort(that.compare);for(var s=n.pop(),i=0;i<a.length;i++)a[i].width=parseInt(a[i].value)/parseInt(s)*90;var c="";c+='<div class="chart">',c+='<div class="chart-box flex-h">',c+='<div class="time">答题时间：00:'+that.transMinute(Math.floor(t.costTime/60))+":"+that.transSecond(t.costTime%60)+"</div>",c+='<div class="titles">';for(var l=0;l<e.length;l++)c+='<p class="titles-item">'+e[l]+"</p>";c+="</div>",c+='<div class="options flex-a-i">';for(var d=0;d<a.length;d++)c+='<div class="options-item flex-h">',c+='<p class="color-line" style="width: '+a[d].width+"%; background: "+a[d].bgcolor+';"></p>',c+='<p class="text">'+a[d].value+"人</p>",c+="</div>";c+="</div>",c+="</div>",c+="</div>",that.$screen.find(".state-after").remove(),that.$screen.append(c)},showStudent:function(){var t=JSON.parse(localStorage.getItem("answerStudent")),e="";switch(parseInt(t.answerType)){case 0:e="选择✕的学生";break;case 1:e="选择✓的学生";break;case 2:e="答对("+t.rightAnswer+")的学生";break;case 4:e="未答题的学生";break;case 7:e="误按的学生";break;default:e="选择"+t.answerType+"的学生"}var a="";a+='<div class="student">',a+='<div class="student-box">',a+="<h2>"+e+"</h2>";for(var o=0;o<t.studentList.length;o++)a+="<p>"+t.studentList[o].name+"</p>";a+="</div>",a+="</div>",that.$screen.find(".chart").remove(),that.$screen.append(a)},showUnAnswerStudent:function(){var t=JSON.parse(localStorage.getItem("unAnswerStudent")),e="";if(0==t.studentList.length)e+='<div class="unAnswer-student">',e+='<div class="no-list">全部回答完毕</div>',e+="</div>";else{e+='<div class="unAnswer-student">',e+='<div class="student-box">',e+="<h2>尚未答题学生</h2>";for(var a=0;a<t.studentList.length;a++)e+="<p>"+t.studentList[a].name+"</p>";e+="</div>",e+="</div>"}that.$screen.find(".state-after").remove(),that.$screen.append(e),that.timeClock()},showBindCard:function(){var t=JSON.parse(localStorage.getItem("bindcardData")),e=["A","B","C","D","E","F","","1","0"],a=t.code.split(""),o=that.$bindcard.find(".card-header .card-item"),n=that.$bindcard.find(".card-main .card-item");n.removeClass("selected");for(var r=0;r<a.length;r++){"0"==a[r]?o.eq(r).html("✕"):"1"==a[r]?o.eq(r).html("✓"):o.eq(r).html(a[r]);var s=e.indexOf(a[r]);n.eq(s).addClass("selected")}that.$bindcard.find(".card-info span").html(t.stuNum),that.$bindcard.show();var i=that.$bindcard.height(),c=that.$bindcard.find(".bindcard-box").height(),l=i/c;that.$bindcard.find(".bindcard-box").css({"-webkit-transform":"translate3d(-50%, -50%, 0) scale("+l+")","-moz-transform":"translate3d(-50%, -50%, 0) scale("+l+")","-ms-transform":"translate3d(-50%, -50%, 0) scale("+l+")",transform:"translate3d(-50%, -50%, 0) scale("+l+")"}),that.$connection.hide(),that.$bindlist.hide(),that.$bindcard.addClass("bindcard-active").fadeIn(300)},showBindStudent:function(){var t=JSON.parse(localStorage.getItem("bindStudentData"));if(t.studentList&&t.studentList.length>0){for(var e="",a=0;a<t.studentList.length;a++)e+='<li class="list-item">'+t.studentList[a]+"</li>";that.$bindlist.find("ul").html(e)}else that.$bindlist.find("ul").html('<li class="no-data">暂无绑定的学生</li>');that.$bindcard.removeClass("bindcard-active").hide(),that.$bindlist.fadeIn(300)},showLoading:function(t){that.$loading.find(".text").html(t),that.$loading.fadeIn(200)},timeClock:function(){if(clearInterval(that.XF),localStorage.getItem("timeClock")){var t=JSON.parse(localStorage.getItem("timeClock")),e=parseInt(t.minutes),a=parseInt(t.seconds);that.clock=60*e+a}else that.clock=0,that.seconds=0,that.minutes=0;that.XF=setInterval(function(){that.clock+=1,that.seconds=that.clock%60,that.minutes=Math.floor(that.clock/60);var t={minutes:that.transMinute(that.minutes),seconds:that.transSecond(that.seconds)};that.$screen.find(".state-doing .text-time").html("答题时间：00:"+t.minutes+":"+t.seconds),localStorage.setItem("timeClock",JSON.stringify(t))},1e3)},preloadImages:function(t){for(var e=[],a=0;a<t.length;a++){var o=t[a].split(".");"mp3"==o[o.length-1]||(e[a]=new Image,e[a].src=t[a])}},canvasInit:function(){var t=(localStorage.getItem("picUrl"),JSON.parse(localStorage.getItem("canvasData")));if(!t)return!1;for(var e=0;e<t.length;e++)if(t[e].picUrl==localStorage.getItem("picUrl")){var a=t[e].data,o=a.width,n=a.height,r=window.innerWidth,s=window.innerHeight-42;"number"!=typeof r&&("CSS1Compat"==document.compatMode?(r=document.documentElement.clientWidth,s=document.documentElement.clientHeight-42):(r=document.body.clientWidth,s=document.body.clientHeight-42));var i,c=r/s,l=$("#courseImg").width(),d=$("#courseImg").height(),h=l/d;return h>c?(i=r/o,o=r,n*=i):(i=s/n,o*=i,n=s),localStorage.setItem("scale",i),void that.createCanvas(o,n)}},createCanvas:function(t,e){$(".canvas").html('<canvas id="canvas" width="'+t+'" height="'+e+'"></canvas>'),that.drawCanvas()},drawCanvas:function(){var t=(localStorage.getItem("picUrl"),JSON.parse(localStorage.getItem("canvasData"))),e=document.getElementById("canvas"),a=e.getContext("2d");a.clearRect(0,0,$("#canvas").width(),$("#canvas").height());for(var o=0;o<t.length;o++)if(t[o].picUrl==localStorage.getItem("picUrl")){var n=t[o].data.lines,r=localStorage.getItem("scale");if(!n)return!1;a.lineCap="round",a.lineJoin="round";for(var s=0;s<n.length;s++){var i=n[s].color,c=n[s].isEraser,l=n[s].location;"-2681322"==i?i="#D71616":"-13065985"==i&&(i="#38A0FF"),c?(a.globalCompositeOperation="destination-out",a.lineWidth=40*parseFloat(localStorage.getItem("scale"))):(a.globalCompositeOperation="source-over",a.lineWidth=4*parseFloat(localStorage.getItem("scale"))),a.beginPath(),a.strokeStyle=i;for(var d=0;d<l.length-1;d++)a.moveTo(parseFloat(l[d].x)*r,parseFloat(l[d].y)*r),a.lineTo(parseFloat(l[d+1].x)*r,parseFloat(l[d+1].y)*r);a.closePath(),a.stroke()}return}},zoomAndMove:function(){var t=JSON.parse(localStorage.getItem("zoom")),e=t.translateX/t.width/t.zoom*100,a=t.translateY/t.height/t.zoom*100;$(".imgbox").css({"-webkit-transform":"scale("+t.zoom+") translate3d("+e+"%, "+a+"%, 0)","-webkit-transform":"scale("+t.zoom+") translate3d("+e+"%, "+a+"%, 0)"}),$(".canvas").css({"-webkit-transform":"scale("+t.zoom+") translate3d("+e+"%, "+a+"%, 0)","-webkit-transform":"scale("+t.zoom+") translate3d("+e+"%, "+a+"%, 0)"})},transMinute:function(t){return t<10?"0"+t:t},transSecond:function(t){return t<10?"0"+t:t},concatMinuteSecond:function(t){t=parseInt(t);var e=Math.floor(t/60),a=t%60;return that.transMinute(e)+":"+that.transSecond(a)},compare:function(t,e){return t<e?-1:t>e?1:0},buttonRefreshBind:function(){location.href=location.href},buttonFullscreenBind:function(){that.isFullscreenForNoScroll()?that.cancleFullscreen():that.launchFullscreen(document.documentElement)},launchFullscreen:function(t){t.requestFullscreen?t.requestFullscreen():t.mozRequestFullScreen?t.mozRequestFullScreen():t.webkitRequestFullscreen?t.webkitRequestFullscreen():t.msRequestFullscreen&&t.msRequestFullscreen()},cancleFullscreen:function(){document.exitFullscreen?document.exitFullscreen():document.mozCancelFullScreen?document.mozCancelFullScreen():document.webkitExitFullscreen?document.webkitExitFullscreen():document.msExitFullscreen&&document.msExitFullscreen()},isFullscreenForNoScroll:function(){return window.navigator.userAgent.toLowerCase().indexOf("chrome")>0?document.body.scrollHeight===window.screen.height&&document.body.scrollWidth===window.screen.width:window.outerHeight===window.screen.height&&window.outerWidth===window.screen.width}};INDEX.init();