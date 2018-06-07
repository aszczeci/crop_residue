/*
Main Script File for Crop Residue Application


*/

//Defaults
var default_picker_colors = ["#d6d380","#c3d88c","#ccbd8a","#e0d2a3","#c4b583"]
var color_dot_pos = 0;
var canvas  = el("canvas_1"); //useful to define globally since it is used in many places and should remain constant
var highligh_color = "rgba(0, 255, 255, 1)";
var tolerance = 5;//%
//var scaling = 1;//scaling image useful for performance and quality 1 to 2 please
var imageData = null;
var crop_percentage_val = 0;
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
function readImage() 
{
	
    if ( this.files && this.files[0] ) {
        var FR= new FileReader();
        FR.onload = function(e) {
           var img = new Image();
           img.addEventListener("load", function() {
			 
		     var max_width = Math.min(screen.width - 16*2,540);
			 var max_height = 540;
			 
			 
			 var dimensions = resize(img.width,img.height,max_width,max_height);//fit image into max sizes
			 
			 canvas.width = dimensions[0];
			 canvas.height = dimensions[1];
			 
			 //canvas.style.width = img.width;
			 //canvas.style.height = img.height;

			 var context = canvas.getContext("2d");
			 el("canvas_column").style.width = dimensions[0]+"px"; //canvas column not canvas
			 el("canvas_column").style.height = dimensions[1]+"px";

			 context.drawImage(img,0,0,dimensions[0],dimensions[1]);
			 el("input_button_text").innerHTML = "Select New Picture";
			 reset_data();
			 
			 show("section_2");
           });
           img.src = e.target.result;
		   
        };       
        FR.readAsDataURL( this.files[0] );
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
  var ctx1 = canvas.getContext("2d");
  var imageData = ctx1.getImageData(x, y, 1, 1).data;
  rgbaColor =
    "rgba(" + imageData[0] + "," + imageData[1] + "," + imageData[2] + ",1)";
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
	
}
function clear_dot(dot_num)
{
	var dots = document.querySelectorAll(".dot");
	dots[dot_num-1].style.backgroundColor = "#ffffff";
	color_dot_pos = dot_num-1;
	//manipulate_image();
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
	var ctx = canvas.getContext('2d');
	ctx.putImageData(imageData,0,0);
}
function manipulate_image()
{
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
	for (cnt_1 = 0; cnt_1 < dots.length; cnt_1++)
	{
		delims[cnt_1] = getRGB(dots[cnt_1].style.backgroundColor)

	}	
	ctx.fillStyle = highligh_color;//cover color
	for (var y = 0; y < canvasHeight; y++) 
	{
		for (var x = 0; x < canvasWidth; x++) 
		{
			var index = (y * canvasWidth + x) * 4;
			var r = imageData.data[index];
			var g = imageData.data[index + 1];
			var b = imageData.data[index + 2];
			var d = 442;
			for (var z = 0; z < dots.length; z++)
			{
				p = (Math.pow(Math.pow(r-delims[z].red,2)+Math.pow(g-delims[z].green,2)+Math.pow(b-delims[z].blue,2),0.5))/442;

				if(Math.abs(p) < tolerance/100)
				{
					ctx.fillRect( x, y, 1, 1 );
					crop_pixel_count ++;
					break;
					//imageData.data[index] = imageData.data[++index] = imageData.data[++index] = 0;
				}
			}

			
		}
	}
	crop_percentage(crop_pixel_count,(canvasWidth*canvasHeight))
	el("section_3").style.display = "block";
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
