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
var iMouseX, iMouseY = 1;
var bMouseDown = false;
var iZoomRadius = 100;
var iZoomPower = 3;
var draw_interval = null;
var image;
var localStorage_holder = {}; // remove afterwards
if(localStorage.farms){
	localStorage_holder.farms = JSON.parse(localStorage.farms);
}


function main_load()
{
	setup_colors();
	canvas.addEventListener("click", click, false);
	el("fileUpload").addEventListener("change", readImage, false);
	//window.onresize = function(){ setTimeout(function (){	location.reload();}, 500);}//refresh page on screen resizing
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
				$("#modal_body").load("includes/modal/farms.html");
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
						$("#modal_body").load("includes/modal/fields.html")
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
			$("#modal_body").load("includes/modal/new_farm.html")
			$('#Overlay_Modal').modal('show');
			break;
		case "add_field":
			el("modal_title").innerHTML = "Add a New Field";
			$("#modal_body").load("includes/modal/new_field.html")
			$('#Overlay_Modal').modal('show');
			break;
		case "historical_results":
			if(localStorage_holder && localStorage_holder.farms && localStorage_holder.farms.length > 0 && localStorage_holder.farms[el("farm_header_link").getAttribute("val")])//if farm exists adn set
			{	
				if(localStorage_holder.farms[el("farm_header_link").getAttribute("val")].fields.length > 0)//if set farm has fields
				{
					el("modal_title").innerHTML = "Past Results: "+localStorage_holder.farms[el("farm_header_link").getAttribute("val")].fields[el("field_header_link").getAttribute("val")].name;
					$("#modal_body").load("includes/modal/historical_results.html");//load page
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
function change_canvas_color(e) 
{
  x = e.offsetX;
  y = e.offsetY;
  canvas.getContext('2d').putImageData(imageData,0,0);
  var imageData_color = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
  rgbaColor =
    "rgba(" + imageData_color[0] + "," + imageData_color[1] + "," + imageData_color[2] + ",1)";
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
function click(e) 
{
	change_canvas_color(e);
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
	var dots_length = dots.length
	for (cnt_1 = 0; cnt_1 < dots_length; cnt_1++)
	{
		delims[cnt_1] = getRGB(dots[cnt_1].style.backgroundColor)

	}	
	ctx.fillStyle = highligh_color;//cover color
	ctx.globalCompositeOperation = 'source-over';
	
	for (var y = 0; y < canvasHeight; y++) 
	{
		for (var x = 0; x < canvasWidth; x++) 
		{
			var index = (y * canvasWidth + x) * 4;
			for (var z = 0; z < dots_length; z++)//calling length property of dots inside so many loops in IE slows it down so much, Screw IE.
			{
				var holder_function = point_error; //Damned IE support look at document which outlines reasoning for this //https://blogs.msdn.microsoft.com/ie/2006/08/28/ie-javascript-performance-recommendations-part-1/
				if(holder_function(imageData.data[index],imageData.data[index + 1],imageData.data[index + 2],delims[z],tolerance))
				{
					ctx.fillRect( x, y, 1, 1 );
					crop_pixel_count ++;
					break;
				}
			}

			
		}
	}
	el("section_3").style.display = "block";
	crop_percentage(crop_pixel_count,(canvasWidth*canvasHeight))
	
}
function point_error(r,g,b,delims,tolerance)
{
	p = (Math.pow(Math.pow(r-delims.red,2)+Math.pow(g-delims.green,2)+Math.pow(b-delims.blue,2),0.5))/442;
	return Math.abs(p) < tolerance/100
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
{
  var match = str.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
  return match ? {
    red: match[1],
    green: match[2],
    blue: match[3]
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
    clear(); // clear canvas
    if (bMouseDown) { // drawing zoom area
		var ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0 - iMouseX * (iZoomPower - 1), 0 - iMouseY * (iZoomPower - 1), ctx.canvas.width * iZoomPower, ctx.canvas.height * iZoomPower);
        ctx.globalCompositeOperation = 'destination-atop';//source-over
        var oGrd = ctx.createRadialGradient(iMouseX, iMouseY, 0, iMouseX, iMouseY, iZoomRadius);
        oGrd.addColorStop(0.8, "rgba(0, 0, 0, 1.0)");
        oGrd.addColorStop(1.0, "rgba(0, 0, 0, 0.1)");
        ctx.fillStyle = oGrd;
        ctx.beginPath();
        ctx.arc(iMouseX, iMouseY, iZoomRadius, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
    }
    // draw source image
    ctx.drawImage(image, 0, 0, ctx.canvas.width, ctx.canvas.height);
}
function CurrentDate(){
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
    });
	
    $('#canvas_1').mousedown(function(e) { // binding mousedown event
        bMouseDown = true;
		draw_interval = setInterval(drawScene, 30); // loop drawScene
    });
    $('#canvas_1').mouseup(function(e) { // binding mouseup event
        bMouseDown = false;
		clearInterval(draw_interval);
		manipulate_image();
    });
	//mobile o_O
	/*
	$('#canvas_1').bind('touchmove',function(e) { // mouse move handler
        var canvasOffset = $(canvas).offset();
        iMouseX = Math.floor(e.pageX - canvasOffset.left);
        iMouseY = Math.floor(e.pageY - canvasOffset.top);
    });
    $('#canvas_1').bind('touchstart mousedown',function(e) { // binding mousedown event
        bMouseDown = true;
		draw_interval = setInterval(drawScene, 30); // loop drawScene
    });
    $('#canvas_1').bind('touchend mouseup',function(e) { // binding mouseup event
        bMouseDown = false;
		clearInterval(draw_interval);
		manipulate_image();
    });	
    */
});
