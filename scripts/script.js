/*

Main Script File for Crop Residue Application

*/
//Defaults
var default_picker_colors = ["#d6d380","#c3d88c","#ccbd8a","#e0d2a3","#c4b583"]
var color_dot_pos = 0;
var canvas  = el("canvas_1"); //useful to define globally since it is used in many places and should remain constant
var highligh_color = "rgba(0, 255, 255, 1)";
var tolerance = 5;//default val
var imageData = null;
var crop_percentage_val = 0;
var iMouseX, iMouseY = 1; //Mouse position on canvas
var bMouseDown = false;
var iZoomRadius = 100;
var iZoomPower = 3;
var draw_interval = null;
var image;
var localStorage_holder = {}; 

if(localStorage.farms){
	localStorage_holder.farms = JSON.parse(localStorage.farms);
}




function main_load()
{
	setup_colors();
	canvas.addEventListener("click", click, false);
	el("fileUpload").addEventListener("change", readImage, false);
	//Bellow Allows for off-line access while still lazy loading. -_- :/
	$.get( "includes/modal/farms.html", function( data ) {  sessionStorage.setItem('farms', data);});
	$.get( "includes/modal/fields.html", function( data ) {  sessionStorage.setItem('fields', data);});
	$.get( "includes/modal/historical_results.html", function( data ) {  sessionStorage.setItem('historical_results', data);});
	$.get( "includes/modal/new_farm.html", function( data ) {  sessionStorage.setItem('new_farm', data);});
	$.get( "includes/modal/new_field.html", function( data ) {  sessionStorage.setItem('new_field', data);});
}
function el(id)
{
	return document.getElementById(id);
} 
function reset_data()
{
	color_dot_pos = 0;
	canvas  = el("canvas_1");
	tolerance = 5;
	el("tolerance_slider").value = tolerance;
	imageData = null;
	crop_percentage_val = 0;
}
function Overlay_Modal(option_name)
{
	
	switch(option_name)
	{
		case "Farm":
			if(localStorage_holder && localStorage_holder.farms && localStorage_holder.farms.length > 0)
			{
				el("modal_title").innerHTML = "Select Your "+option_name;
				$("#modal_body").load("includes/modal/farms.html", function(responseText,stat){if(stat != "success"){$("#modal_body").html(sessionStorage.farms)}});
			}else{
				localStorage_holder.farms = [];
				localStorage.setItem('farms',JSON.stringify(localStorage_holder.farms))
				Overlay_Modal("add_farm");
			}
			$('#Overlay_Modal').modal('show');
			break;
		case "Field":
			if(localStorage_holder && localStorage_holder.farms && localStorage_holder.farms.length > 0)
			{	
				if(localStorage_holder.farms[el("farm_header_link").getAttribute("val")])
				{
					if(localStorage_holder.farms[el("farm_header_link").getAttribute("val")].fields.length > 0)
					{
						el("modal_title").innerHTML = "Select Your "+option_name;
						$("#modal_body").load("includes/modal/fields.html", function(responseText,stat){if(stat != "success"){$("#modal_body").html(sessionStorage.fields)}});
					}else{
						Overlay_Modal("add_field");
					}					
				}else{
					alert("select farm"); //defaults to farm 0
				}
			}else{
				Overlay_Modal("Farm");
			}
			$('#Overlay_Modal').modal('show');
			break;
		case "add_farm":
			el("modal_title").innerHTML = "Add a New Farm";
			$("#modal_body").load("includes/modal/new_farm.html", function(responseText,stat){if(stat != "success"){$("#modal_body").html(sessionStorage.new_farm)}});
			$('#Overlay_Modal').modal('show');
			break;
		case "add_field":
			el("modal_title").innerHTML = "Add a New Field";
			$("#modal_body").load("includes/modal/new_field.html");
			$("#modal_body").load("includes/modal/new_field.html", function(responseText,stat){if(stat != "success"){$("#modal_body").html(sessionStorage.new_field)}});
			$('#Overlay_Modal').modal('show');
			break;
		case "historical_results":
			if(localStorage_holder && localStorage_holder.farms && localStorage_holder.farms.length > 0 && localStorage_holder.farms[el("farm_header_link").getAttribute("val")])//if farm exists adn set
			{	
				if(localStorage_holder.farms[el("farm_header_link").getAttribute("val")].fields.length > 0)//if set farm has fields
				{
					el("modal_title").innerHTML = "Past Results: "+localStorage_holder.farms[el("farm_header_link").getAttribute("val")].fields[el("field_header_link").getAttribute("val")].name;
					$("#modal_body").load("includes/modal/historical_results.html", function(responseText,stat){if(stat != "success"){$("#modal_body").html(sessionStorage.historical_results)}});
					$('#Overlay_Modal').modal('show');
				}else{
					Overlay_Modal("add_field");
				}					
			}else{
				Overlay_Modal("Farm");
			}
			break;
		case "close":
			$('#Overlay_Modal').modal("hide");
			break;
		default:
			$('#Overlay_Modal').modal("hide");
			break;
	}
	
}
function readImage() 
{
	el("cavas_loading_text").innerHTML = "Loading Please Wait";
    if ( this.files && this.files[0] ) {
        var FR= new FileReader();
		var img = new Image();
		img.addEventListener("load", function() {
			var max_width = Math.min(screen.width - 16*2,540);
			var max_height = 540;
			var dimensions = resize(img.width,img.height,max_width,max_height);//fit image into max sizes

			canvas.width = dimensions[0];
			canvas.height = dimensions[1];
			canvas.style.display ="block";
			var context = canvas.getContext("2d");
			//el("canvas_column").style.width = dimensions[0]+"px"; //canvas column not canvas
			//el("canvas_column").style.height = dimensions[1]+"px";
			el("cavas_loading_text").innerHTML = "";
			context.drawImage(img,0,0,dimensions[0],dimensions[1]);
			el("input_button_text").innerHTML = "Select New Picture";
			reset_data();
			imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
			image = new Image();
			image.src = canvas.toDataURL("image/png");
			show("section_2");
			
		});
		img.src = (URL || webkit).createObjectURL(this.files[0]); //increased performance vs file readers necessairy for IE
		el("fileUpload").value = "";
		
    }
	
}
function resize(width,height,max_width,max_height)
{
	var width_per = width/max_width;
	var height_per = height/max_height;
	if( width_per > 1|| height_per > 1)
	{
		return [width/Math.max(width_per,height_per),height/Math.max(width_per,height_per)]; //not using mapping since IE support :'(
	}
	else		
	{
		return [width/Math.min(width_per,height_per),height/Math.min(width_per,height_per)]; //not using mapping since IE support :'(
	}
}
function show(div_id)
{
	if(el(div_id).style.display != "block")
	{
		el(div_id).style.display = "block";
		el(div_id).scrollIntoView({block: "start", behavior: "smooth"});
	}
	else
	{
		el(div_id).scrollIntoView({block: "start", behavior: "smooth"});
	}
}
function setup_colors()
{
	
	var dots = document.querySelectorAll(".dot");
	var dot_size = Math.min((screen.width - 80 -dots.length*2),400)/dots.length;
	for (cnt_1 = 0; cnt_1 < dots.length; cnt_1++)
	{
		dots[cnt_1].style.backgroundColor = default_picker_colors[cnt_1];
		dots[cnt_1].style.height = dot_size +"px";
		dots[cnt_1].style.width = dot_size + "px";
	}
}
function change_canvas_color(x,y) 
{
  canvas.getContext('2d').putImageData(imageData,0,0);
  var imageData_color = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
  rgbaColor ="rgba(" + imageData_color[0] + "," + imageData_color[1] + "," + imageData_color[2] + ",1)";
  apply_to_color_dot(rgbaColor)
  
}
function apply_to_color_dot(color)
{
	var dots = document.querySelectorAll(".dot");
	dots[color_dot_pos].style.backgroundColor = color;
	color_dot_pos++;
	if(color_dot_pos >= dots.length)
	{
		color_dot_pos = 0;
	}
	manipulate_image();
	
}
function clear_dot(dot_num)
{
	var dots = document.querySelectorAll(".dot");
	dots[dot_num-1].style.backgroundColor = "#ffffff";
	color_dot_pos = dot_num-1;
	manipulate_image();
}
function click() 
{
	x = iMouseX;
	y = iMouseY;
	change_canvas_color(x,y);
}
function mobile_click()
{
	x = iMouseX;
	y = iMouseY;
	change_canvas_color(x,y);
}
function change_tolerance()
{
	tolerance =  el("tolerance_slider").value;
	manipulate_image()
}
function revert_image()
{
	refresh_canvas();
}
function manipulate_image()
{
	refresh_canvas();
	var canvasWidth  = canvas.width;
	var canvasHeight = canvas.height;
	var ctx = canvas.getContext('2d');
	if(imageData == null)
	{
		imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
	}else{
	ctx.putImageData(imageData,0,0);
	}
	var dots = document.querySelectorAll(".dot");
	var delims = [];
	var crop_pixel_count = 0;
	var dots_length = dots.length; //damned IE
	for (cnt_1 = 0; cnt_1 < dots_length; cnt_1++)
	{
		delims[cnt_1] = getRGB(dots[cnt_1].style.backgroundColor);

	}
	ctx.fillStyle = highligh_color;//cover color
	ctx.globalCompositeOperation = 'source-over';
	var t0 = performance.now();
	var img_data = imageData.data; //shaves off 500ms in IE ohh god why is IE still supported.
	var holder_function = point_error; //Damned IE support look at document which outlines reasoning for this //https://blogs.msdn.microsoft.com/ie/2006/08/28/ie-javascript-performance-recommendations-part-1/
	var index = 0;
	for (var y = 0; y < canvasHeight; y++) 
	{
		
		for (var x = 0; x < canvasWidth; x++) 
		{

			index = (y * canvasWidth + x) * 4;
			for (var z = 0; z < dots_length; z++)//calling length property of dots inside so many loops in IE slows it down so much, Screw IE.
			{
				if(holder_function(img_data[index],img_data[index + 1],img_data[index + 2],delims[z].red,delims[z].green,delims[z].blue))
				{
					ctx.fillRect( x, y, 1, 1 );
					crop_pixel_count ++;
					break;					
				}
			}
		
		}
	}
	var t1 = performance.now();
	console.log(t1-t0);	
	el("section_3").style.display = "block";
	crop_percentage(crop_pixel_count,(canvasWidth*canvasHeight))
	
}
function point_error(x0,x1,x2,y0,y1,y2)
{
	d1 = x0-y0;
	d2 = x1-y1;
	d3 = x2-y2;
	return Math.sqrt(d1*d1+d2*d2+d3*d3)/422 < tolerance/100;
}
function squared(x)
{
	return x*x
}
function crop_percentage(crop_pixel_count,total_pixels)
{
	crop_percentage_val = Math.round(100*crop_pixel_count/total_pixels);
	el("crop_percentage_results_image").className = 'c100 p'+crop_percentage_val+' big';;
	el("crop_percentage_results").innerHTML = crop_percentage_val+'%';
	//crop_percentage_results
	//crop_percentage_results_image
}
function getRGB(str)
{ //converting to int saved 900ms in IE MB for not catching that earlier I thought delims was already an int32
  var match = str.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
  return match ? {
    red: parseInt(match[1]),
    green: parseInt(match[2]),
    blue: parseInt(match[3])
  } : {};
}
function refresh_canvas()
{
	if(imageData)
	{
		canvas.getContext('2d').putImageData(imageData,0,0);
	}
}
function clear() 
{
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}
function drawScene() 
{ // main drawScene function
    if (bMouseDown) { // drawing zoom area
		clear(); // clear canvas
		var ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0 - iMouseX * (iZoomPower - 1), 0 - iMouseY * (iZoomPower - 1), ctx.canvas.width * iZoomPower, ctx.canvas.height * iZoomPower);
        ctx.globalCompositeOperation = 'destination-atop';//source-over
        var oGrd = ctx.createRadialGradient(iMouseX, iMouseY, 0, iMouseX, iMouseY, iZoomRadius);
        oGrd.addColorStop(0.8, "rgba(0, 0, 0, 1.0)");
        oGrd.addColorStop(1.0, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = oGrd;
        ctx.beginPath();
        ctx.arc(iMouseX, iMouseY, iZoomRadius, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
		ctx.drawImage(image, 0, 0, ctx.canvas.width, ctx.canvas.height);
		var ctx = canvas.getContext("2d");
		ctx.globalCompositeOperation = 'source-over';//source-over
		ctx.lineWidth=3;
		ctx.beginPath();
		ctx.arc(iMouseX, iMouseY, 10, 0, 2 * Math.PI);
		ctx.stroke();
    }
}
function CurrentDate()
{
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; 
	var yyyy = today.getFullYear();
	if(dd<10) {
		dd = '0'+dd
	} 
	if(mm<10) {
		mm = '0'+mm
	} 
	return dd + '/' + mm + '/' + yyyy;
}
function SaveResults()
{
	if(localStorage_holder && localStorage_holder.farms && localStorage_holder.farms[el("farm_header_link").getAttribute("val")])
	{
		if(localStorage_holder.farms[el("farm_header_link").getAttribute("val")].fields[el("field_header_link").getAttribute("val")])
		{
			var field_results = {date:CurrentDate(),results:crop_percentage_val};
			localStorage_holder.farms[el("farm_header_link").getAttribute("val")].fields[el("field_header_link").getAttribute("val")].crop_percentage.push(field_results);
			localStorage.setItem('farms',JSON.stringify(localStorage_holder.farms));
			//alert("Saved");
			show("section_1");
			Overlay_Modal('historical_results');
		}else{
			alert("Please Create A Field");
			Overlay_Modal('Field');
		}
	}else{
		alert("Please Create A Farm");
		Overlay_Modal('Farm');
	}
}

$(function()
{
	
    $('#canvas_1').mousemove(function(e) { // mouse move handler
        var canvasOffset = $(canvas).offset();
        iMouseX = Math.floor(e.pageX - canvasOffset.left);
        iMouseY = Math.floor(e.pageY - canvasOffset.top);
		drawScene();
    });
	
    $('#canvas_1').mousedown(function(e) { // binding mousedown event
        bMouseDown = true;
		//draw_interval = setInterval(drawScene, 30); // loop drawScene performance tuning availability for IE :(
    });
    $('#canvas_1').mouseup(function(e) { // binding mouseup event
        bMouseDown = false;
		clearInterval(draw_interval);
		//manipulate_image();
    });
	//mobile o_O
	$('#canvas_1').bind('touchmove',function(e) { // mouse move handler
		var canvasOffset = $(canvas).offset();
        iMouseX = Math.floor(e.changedTouches[0].pageX - canvasOffset.left-50); //-50 so it appears above finger not under
        iMouseY = Math.floor(e.changedTouches[0].pageY - canvasOffset.top-50);
		drawScene();
		e.preventDefault();
    });
    $('#canvas_1').bind('touchstart',function(e) { // binding mousedown event
		bMouseDown = true;
	});
    $('#canvas_1').bind('touchend',function(e) { // binding mouseup event
		bMouseDown = false;
		//manipulate_image();
		mobile_click();
    });	
    
});
