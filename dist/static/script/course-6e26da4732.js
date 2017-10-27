/**
 * @author luoym
 * @email 13575458746@163.com
 * @descrip 
 * @version v1.0.0
 */
var that,ws=null,INDEX={init:function(){""==document.referrer&&(localStorage.setItem("sid",""),localStorage.setItem("token",""),localStorage.removeItem("sessionType"),localStorage.removeItem("picUrl"),localStorage.removeItem("answerType"),localStorage.removeItem("isAnswer"),localStorage.removeItem("timeClock"),localStorage.removeItem("answerNum"),localStorage.removeItem("answerCharts"),localStorage.removeItem("answerStudent"),localStorage.removeItem("bindcardData"),localStorage.removeItem("bindStudentData"),localStorage.removeItem("canvasData"),localStorage.removeItem("zoom")),that=this,that.UIInit(),that.$connection.hide(),that.$screen.hide(),that.showLoading("正在连接易乐思课堂..."),that.sid=localStorage.getItem("sid"),that.token=localStorage.getItem("token"),that.sid&&that.token?that.webSocketInit():location.href="./index.html?from=class",that.heartCount=0,$(window).unbind("resize"),$(window).on("resize",function(){localStorage.getItem("picUrl")?that.showImage(localStorage.getItem("picUrl"),localStorage.getItem("answerType"),localStorage.getItem("isAnswer")):(that.$connection.fadeIn(200),that.$screen.fadeIn(200),that.$loading.fadeOut(200)),that.showSessionMask()})},UIInit:function(){that.$course=$("#course"),that.$connection=$("#connection"),that.$loading=$("#loading"),that.$screen=$("#screen"),that.$courseImg=$("#courseImg"),that.$audioBox=$("#audioBox"),that.$toolbar=$("#toolbar"),that.$buttonRefresh=$("#button-refresh"),that.$buttonFullscreen=$("#button-fullscreen"),that.$bindcard=$("#bindcard"),that.$bindlist=$("#bindlist"),that.$buttonRefresh.unbind("click"),that.$buttonRefresh.on("click",that.buttonRefreshBind),that.$buttonFullscreen.unbind("click"),that.$buttonFullscreen.on("click",that.buttonFullscreenBind)},webSocketInit:function(){"WebSocket"in window?ws=new WebSocket("ws://"+CONFIG.online):alert("当前浏览器不支持 webSocket, 请更换最新版谷歌浏览器！"),ws.onopen=function(){console.log("WebSocket连接成功"),that.sendHeartMsg(),that.sendMsg({bizType:10002,sid:that.sid,token:that.token,data:{loginType:2}})},ws.onmessage=function(e){that.doReceiveMsg(e.data)},ws.onclose=function(){console.log("WebSocket连接关闭"),ws.close(),ws=null,that.$screen.hide(),that.showLoading("连接已断开，正在重新连接，请稍候"),that.webSocketInit()},window.onbeforeunload=function(){that.sendMsg({bizType:10011,sid:that.sid,token:that.token,data:{opType:1001101}}),ws.close()}},sendHeartMsg:function(){setInterval(function(){that.heartCount<3?that.sendMsg({bizType:10006,data:{}}):location.href=location.href},5e3)},doReceiveMsg:function(e){if(e=JSON.parse(e),console.log(e),-1==e.code);else if(10001==e.code)that.sendMsg({bizType:10001,data:{}});else if(10002==e.code)localStorage.getItem("picUrl")?that.showImage(localStorage.getItem("picUrl"),localStorage.getItem("answerType"),localStorage.getItem("isAnswer")):(that.$connection.fadeIn(200),that.$screen.fadeIn(200),that.$loading.fadeOut(200)),that.showSessionMask();else if(10006==e.code)that.heartCount-=1;else if(10007==e.code)ws.close(),alert("您的账号已在其它地点登录，将被强制下线！"),location.href="./index.html?from=class";else if(80002==e.code)localStorage.removeItem("sessionType"),localStorage.removeItem("picUrl"),localStorage.removeItem("answerType"),localStorage.removeItem("isAnswer"),localStorage.removeItem("timeClock"),localStorage.removeItem("answerNum"),localStorage.removeItem("answerCharts"),localStorage.removeItem("answerStudent"),localStorage.removeItem("canvasData"),that.$connection.fadeIn(200),that.$screen.find("#canvas").remove(),that.$screen.find(".state-before").remove(),that.$screen.find(".state-doing").remove(),that.$screen.find(".state-after").remove(),that.$screen.find(".chart").remove(),that.$screen.find(".student").remove(),that.$courseImg.hide(),that.$audioBox.hide(),that.$screen.fadeIn(200),that.$loading.fadeOut(200);else if(80003==e.code)localStorage.removeItem("zoom"),localStorage.setItem("sessionType","0"),e.data.picList?that.showImage(e.data.picUrl,e.data.answerType,e.data.isAnswer,e.data.picList):that.showImage(e.data.picUrl,e.data.answerType,e.data.isAnswer);else if(80004==e.code)localStorage.setItem("sessionType","2"),that.$screen.find(".state-before").remove(),that.$screen.find(".state-after").remove(),that.$screen.find(".chart").remove(),that.startAnswer();else if(80005==e.code)localStorage.setItem("sessionType","3"),that.endAnswer();else if(80006==e.code)localStorage.setItem("sessionType","4"),localStorage.setItem("answerCharts",JSON.stringify(e.data.answerInfo)),that.showAnswerCharts();else if(80007==e.code)localStorage.setItem("sessionType","5"),localStorage.setItem("answerStudent",JSON.stringify(e.data)),that.showStudent();else if(80008==e.code)localStorage.setItem("answerNum",e.data.answerNum),that.$screen.find(".state-doing .text-number").html("答题人数："+e.data.answerNum+"人");else if(80009==e.code)localStorage.setItem("sessionType","3"),that.$screen.find(".chart").remove(),that.endAnswer();else if(80010==e.code)localStorage.setItem("sessionType","4"),that.$screen.find(".student").remove(),that.showAnswerCharts();else if(80011==e.code)ws.close(),location.href="./index.html?from=class";else if(80013==e.code)localStorage.setItem("sessionType","80"),localStorage.setItem("bindcardData",JSON.stringify(e.data)),that.showBindCard();else if(80014==e.code)localStorage.setItem("sessionType","81"),localStorage.setItem("bindStudentData",JSON.stringify(e.data)),that.showBindStudent();else if(80015==e.code)that.$bindcard.removeClass("bindcard-active").hide(),that.$bindlist.hide(),that.$connection.fadeIn(300);else if(80016==e.code){var t=JSON.parse(localStorage.getItem("bindcardData"));t.stuNum=e.data.stuNum,localStorage.setItem("bindcardData",JSON.stringify(t)),that.$bindcard.find(".card-info span").html(e.data.stuNum)}else if(80017==e.code){var a=[];if(localStorage.getItem("canvasData")){a=JSON.parse(localStorage.getItem("canvasData"));for(var o=0;o<a.length;o++)if(a[o].picUrl==localStorage.getItem("picUrl"))return void that.canvasInit()}else a=[];a.push({picUrl:localStorage.getItem("picUrl"),data:{width:e.data.initData.width,height:e.data.initData.height}}),localStorage.setItem("canvasData",JSON.stringify(a)),that.canvasInit()}else if(80018==e.code){for(var a=JSON.parse(localStorage.getItem("canvasData")),n=e.data.points[0],s=localStorage.getItem("picUrl"),o=0;o<a.length;o++)if(a[o].picUrl==s){var r=a[o].data;if(r.lines){for(var l=0;l<r.lines.length;l++)if(r.lines[l].lineId==n.lineId)return r.lines[l].location||(r.lines[l].location=[]),r.lines[l].location.push({x:n.x,y:n.y}),localStorage.setItem("canvasData",JSON.stringify(a)),void that.drawCanvas();return r.lines.push({lineId:n.lineId,color:n.color,isEraser:n.isEraser,location:[{x:n.x,y:n.y}]}),localStorage.setItem("canvasData",JSON.stringify(a)),void that.drawCanvas()}return r.lines=[],r.lines.push({lineId:n.lineId,color:n.color,isEraser:n.isEraser,location:[{x:n.x,y:n.y}]}),localStorage.setItem("canvasData",JSON.stringify(a)),void that.drawCanvas()}}else if(80019==e.code)localStorage.setItem("zoom",JSON.stringify(e.data.zoomObj)),that.zoomAndMove();else if(80020==e.code)for(var a=JSON.parse(localStorage.getItem("canvasData")),s=localStorage.getItem("picUrl"),o=0;o<a.length;o++)if(a[o].picUrl==s){a[o].data.lines=[],localStorage.setItem("canvasData",JSON.stringify(a));var i=document.getElementById("canvas"),c=i.getContext("2d");c.clearRect(0,0,$("#canvas").width(),$("#canvas").height())}},sendMsg:function(e){ws.send(JSON.stringify(e))},showImage:function(e,t,a,o){localStorage.setItem("picUrl",e),localStorage.setItem("answerType",t),localStorage.setItem("isAnswer",a?"true":""),that.$connection.hide(),that.$screen.hide(),that.$courseImg.hide(),that.showLoading("正在同步显示手机屏幕，请稍候"),that.$screen.find("#canvas").remove(),that.$screen.find(".state-before").remove(),that.$screen.find(".state-doing").remove(),that.$screen.find(".state-after").remove(),that.$screen.find(".chart").remove(),that.$screen.find(".student").remove(),localStorage.getItem("zoom")&&that.zoomAndMove();var n=e.split(".");if("mp3"==n[n.length-1])that.$audioBox.append('<audio src="'+e+'" preload="metadata"></audio>'),that.handleAudioEvents();else{var s,r=new Image,l=window.innerWidth,i=window.innerHeight-42;"number"!=typeof l&&("CSS1Compat"==document.compatMode?(l=document.documentElement.clientWidth,i=document.documentElement.clientHeight-42):(l=document.body.clientWidth,i=document.body.clientHeight-42)),s=l/i,r.src=e,r.onload=function(){r.width/r.height>s?that.$courseImg.css({width:"100%",height:"auto"}):that.$courseImg.css({height:"100%",width:"auto"}),that.$courseImg.attr("src",e).show(),that.afterShowImage()}}o&&that.preloadImages(o)},handleAudioEvents:function(){that.$audioBox.find("audio").on("canplay",function(){console.log("Audio is ready!")})},afterShowImage:function(){that.$loading.fadeOut(200),that.$screen.fadeIn(200),localStorage.getItem("sessionType")&&"0"!=localStorage.getItem("sessionType")||that.showProblem(),that.canvasInit()},showSessionMask:function(){if(!localStorage.getItem("sessionType"))return!1;switch(parseInt(localStorage.getItem("sessionType"))){case 0:break;case 2:that.startAnswer();break;case 3:that.endAnswer();break;case 4:that.showAnswerCharts();break;case 5:that.showStudent();break;case 80:that.showBindCard();break;case 81:that.showBindStudent();break;default:return}},showProblem:function(){if(answerType=parseInt(localStorage.getItem("answerType")),0!=answerType)if(localStorage.getItem("isAnswer")){var e="";e+='<div class="state-after">',e+='<div class="button-detail">查看结果</div>',e+='<p class="text">重新答题</p>',e+="</div>",that.$screen.append(e)}else switch(answerType){case 1:that.$screen.append('<div class="state-before">答题(单选)</div>');break;case 2:that.$screen.append('<div class="state-before">答题(多选)</div>');break;case 3:that.$screen.append('<div class="state-before">答题(判断)</div>');break;default:that.$screen.append("")}},startAnswer:function(){var e,t="";e=localStorage.getItem("timeClock")?JSON.parse(localStorage.getItem("timeClock")):{minutes:"00",seconds:"00"},t+='<div class="state-doing">',t+='<p class="text text-time">答题时间：00:'+e.minutes+":"+e.seconds+"</p>",t+='<p class="text text-number">答题人数：'+localStorage.getItem("answerNum")+"人</p>",t+='<div class="button-stop">结束答题</div>',t+="</div>",that.$screen.find(".state-doing").remove(),that.$screen.append(t),that.timeClock()},endAnswer:function(){var e="";e+='<div class="state-after">',e+='<div class="button-detail">查看结果</div>',e+='<p class="text">重新答题</p>',e+="</div>",clearInterval(that.XF),localStorage.removeItem("timeClock"),that.$screen.find(".state-before").remove(),that.$screen.find(".state-doing").remove(),that.$screen.find(".state-after").remove(),that.$screen.append(e)},showAnswerCharts:function(){var e=JSON.parse(localStorage.getItem("answerCharts")),t=[],a=[];if(3==e.answerType)t=["✓","✕","错答","未答题"],a=[{value:e.numTrue,width:"",bgcolor:"#38A0FF"},{value:e.numFalse,width:"",bgcolor:"#FFFD38"},{value:e.wrongNum,width:"",bgcolor:"#D9D9D9"},{value:e.giveupNum,width:"",bgcolor:"#D9D9D9"}],"0"==e.answer||0==e.answer?a[1].bgcolor="#1EC51D":"1"!=e.answer&&1!=e.answer||(a[0].bgcolor="#1EC51D");else if(1==e.answerType){t=["A","B","C","D","E","F","错答","未答题"],a=[{value:e.numA,width:"",bgcolor:"#38A0FF"},{value:e.numB,width:"",bgcolor:"#FFFD38"},{value:e.numC,width:"",bgcolor:"#D71616"},{value:e.numD,width:"",bgcolor:"#D68A16"},{value:e.numE,width:"",bgcolor:"#7A38FF"},{value:e.numF,width:"",bgcolor:"#C238FF"},{value:e.wrongNum,width:"",bgcolor:"#D9D9D9"},{value:e.giveupNum,width:"",bgcolor:"#D9D9D9"}];var o=t.indexOf(e.answer);a[o].bgcolor="#1EC51D"}else 2==e.answerType&&(t=["A","B","C","D","E","F","答对","错答","未答题"],a=[{value:e.numA,width:"",bgcolor:"#38A0FF"},{value:e.numB,width:"",bgcolor:"#FFFD38"},{value:e.numC,width:"",bgcolor:"#D71616"},{value:e.numD,width:"",bgcolor:"#D68A16"},{value:e.numE,width:"",bgcolor:"#7A38FF"},{value:e.numF,width:"",bgcolor:"#C238FF"},{value:e.rightNum,width:"",bgcolor:"#1EC51D"},{value:e.wrongNum,width:"",bgcolor:"#D9D9D9"},{value:e.giveupNum,width:"",bgcolor:"#D9D9D9"}]);for(var n=[],s=0;s<a.length;s++)n.push(a[s].value);n.sort(that.compare);for(var r=n.pop(),l=0;l<a.length;l++)a[l].width=parseInt(a[l].value)/parseInt(r)*90;var i="";i+='<div class="chart">',i+='<div class="chart-box flex-h">',i+='<div class="time">答题时间：00:'+that.transMinute(Math.floor(e.costTime/60))+":"+that.transSecond(e.costTime%60)+"</div>",i+='<div class="titles">';for(var c=0;c<t.length;c++)i+='<p class="titles-item">'+t[c]+"</p>";i+="</div>",i+='<div class="options flex-a-i">';for(var d=0;d<a.length;d++)i+='<div class="options-item flex-h">',i+='<p class="color-line" style="width: '+a[d].width+"%; background: "+a[d].bgcolor+';"></p>',i+='<p class="text">'+a[d].value+"人</p>",i+="</div>";i+="</div>",i+="</div>",i+="</div>",that.$screen.find(".state-after").remove(),that.$screen.append(i)},showStudent:function(){var e=JSON.parse(localStorage.getItem("answerStudent")),t="";switch(parseInt(e.answerType)){case 0:t="选择✕的学生";break;case 1:t="选择✓的学生";break;case 2:t="答对("+e.rightAnswer+")的学生";break;case 4:t="未答题的学生";break;case 7:t="错答的学生";break;default:t="选择"+e.answerType+"的学生"}var a="";a+='<div class="student">',a+='<div class="student-box">',a+="<h2>"+t+"</h2>";for(var o=0;o<e.studentList.length;o++)a+="<p>"+e.studentList[o].name+"</p>";a+="</div>",a+="</div>",that.$screen.find(".chart").remove(),that.$screen.append(a)},showBindCard:function(){var e=JSON.parse(localStorage.getItem("bindcardData")),t=["A","B","C","D","E","F","","1","0"],a=e.code.split(""),o=that.$bindcard.find(".card-header .card-item"),n=that.$bindcard.find(".card-main .card-item");n.removeClass("selected");for(var s=0;s<a.length;s++){"0"==a[s]?o.eq(s).html("✕"):"1"==a[s]?o.eq(s).html("✓"):o.eq(s).html(a[s]);var r=t.indexOf(a[s]);n.eq(r).addClass("selected")}that.$bindcard.find(".card-info span").html(e.stuNum),that.$bindcard.show();var l=that.$bindcard.height(),i=that.$bindcard.find(".bindcard-box").height(),c=l/i;that.$bindcard.find(".bindcard-box").css({"-webkit-transform":"translate3d(-50%, -50%, 0) scale("+c+")","-moz-transform":"translate3d(-50%, -50%, 0) scale("+c+")","-ms-transform":"translate3d(-50%, -50%, 0) scale("+c+")",transform:"translate3d(-50%, -50%, 0) scale("+c+")"}),console.log(e),that.$connection.hide(),that.$bindlist.hide(),that.$bindcard.addClass("bindcard-active").fadeIn(300)},showBindStudent:function(){var e=JSON.parse(localStorage.getItem("bindStudentData"));if(e.studentList&&e.studentList.length>0){for(var t="",a=0;a<e.studentList.length;a++)t+='<li class="list-item">'+e.studentList[a]+"</li>";that.$bindlist.find("ul").html(t)}else that.$bindlist.find("ul").html('<li class="no-data">暂无绑定的学生</li>');that.$bindcard.removeClass("bindcard-active").hide(),that.$bindlist.fadeIn(300)},showLoading:function(e){that.$loading.find(".text").html(e),that.$loading.fadeIn(200)},timeClock:function(){if(clearInterval(that.XF),localStorage.getItem("timeClock")){var e=JSON.parse(localStorage.getItem("timeClock")),t=parseInt(e.minutes),a=parseInt(e.seconds);that.clock=60*t+a}else that.clock=0,that.seconds=0,that.minutes=0;that.XF=setInterval(function(){that.clock+=1,that.seconds=that.clock%60,that.minutes=Math.floor(that.clock/60);var e={minutes:that.transMinute(that.minutes),seconds:that.transSecond(that.seconds)};that.$screen.find(".state-doing .text-time").html("答题时间：00:"+e.minutes+":"+e.seconds),localStorage.setItem("timeClock",JSON.stringify(e))},1e3)},preloadImages:function(e){for(var t=[],a=0;a<e.length;a++){var o=e[a].split(".");"mp3"==o[o.length-1]||(t[a]=new Image,t[a].src=e[a])}},canvasInit:function(){var e=(localStorage.getItem("picUrl"),JSON.parse(localStorage.getItem("canvasData")));if(!e)return!1;for(var t=0;t<e.length;t++)if(e[t].picUrl==localStorage.getItem("picUrl")){var a=e[t].data,o=a.width,n=a.height,s=window.innerWidth,r=window.innerHeight-42;"number"!=typeof s&&("CSS1Compat"==document.compatMode?(s=document.documentElement.clientWidth,r=document.documentElement.clientHeight-42):(s=document.body.clientWidth,r=document.body.clientHeight-42));var l,i=s/r,c=$("#courseImg").width(),d=$("#courseImg").height(),h=c/d;return h>i?(l=s/o,o=s,n*=l):(l=r/n,o*=l,n=r),localStorage.setItem("scale",l),void that.createCanvas(o,n)}},createCanvas:function(e,t){$(".canvas").html('<canvas id="canvas" width="'+e+'" height="'+t+'"></canvas>'),that.drawCanvas()},drawCanvas:function(){var e=(localStorage.getItem("picUrl"),JSON.parse(localStorage.getItem("canvasData"))),t=document.getElementById("canvas"),a=t.getContext("2d");a.clearRect(0,0,$("#canvas").width(),$("#canvas").height());for(var o=0;o<e.length;o++)if(e[o].picUrl==localStorage.getItem("picUrl")){var n=e[o].data.lines,s=localStorage.getItem("scale");if(!n)return!1;a.lineCap="round",a.lineJoin="round";for(var r=0;r<n.length;r++){var l=n[r].color,i=n[r].isEraser,c=n[r].location;"-2681322"==l?l="#D71616":"-13065985"==l&&(l="#38A0FF"),i?(a.globalCompositeOperation="destination-out",a.lineWidth=40*parseFloat(localStorage.getItem("scale"))):(a.globalCompositeOperation="source-over",a.lineWidth=4*parseFloat(localStorage.getItem("scale"))),a.beginPath(),a.strokeStyle=l;for(var d=0;d<c.length-1;d++)a.moveTo(parseFloat(c[d].x)*s,parseFloat(c[d].y)*s),a.lineTo(parseFloat(c[d+1].x)*s,parseFloat(c[d+1].y)*s);a.closePath(),a.stroke()}return}},zoomAndMove:function(){var e=JSON.parse(localStorage.getItem("zoom")),t=e.translateX/e.width/e.zoom*100,a=e.translateY/e.height/e.zoom*100;$(".imgbox").css({"-webkit-transform":"scale("+e.zoom+") translate3d("+t+"%, "+a+"%, 0)","-webkit-transform":"scale("+e.zoom+") translate3d("+t+"%, "+a+"%, 0)"}),$(".canvas").css({"-webkit-transform":"scale("+e.zoom+") translate3d("+t+"%, "+a+"%, 0)","-webkit-transform":"scale("+e.zoom+") translate3d("+t+"%, "+a+"%, 0)"})},transMinute:function(e){return e<10?"0"+e:e},transSecond:function(e){return e<10?"0"+e:e},compare:function(e,t){return e<t?-1:e>t?1:0},buttonRefreshBind:function(){location.href=location.href},buttonFullscreenBind:function(){that.isFullscreenForNoScroll()?that.cancleFullscreen():that.launchFullscreen(document.documentElement)},launchFullscreen:function(e){e.requestFullscreen?e.requestFullscreen():e.mozRequestFullScreen?e.mozRequestFullScreen():e.webkitRequestFullscreen?e.webkitRequestFullscreen():e.msRequestFullscreen&&e.msRequestFullscreen()},cancleFullscreen:function(){document.exitFullscreen?document.exitFullscreen():document.mozCancelFullScreen?document.mozCancelFullScreen():document.webkitExitFullscreen?document.webkitExitFullscreen():document.msExitFullscreen&&document.msExitFullscreen()},isFullscreenForNoScroll:function(){return window.navigator.userAgent.toLowerCase().indexOf("chrome")>0?document.body.scrollHeight===window.screen.height&&document.body.scrollWidth===window.screen.width:window.outerHeight===window.screen.height&&window.outerWidth===window.screen.width}};INDEX.init();